-- Tables, enums and indexes for treff.
--
-- The shape described in docs/database.md §3. Functions, views and triggers are
-- in the next migration; row-level security is in the one after that. Split that
-- way because a policy reads better next to the other policies than next to the
-- table it guards, and because `is_blocked()` and `has_plus()` are referenced by
-- policies on tables declared long before them.
--
-- Nothing here had run anywhere when it was written, so it is one coherent file
-- rather than a create-then-alter history of a schema that never existed.

create extension if not exists "postgis" with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.join_mode           as enum ('open', 'approval');
create type public.request_status      as enum ('pending', 'accepted', 'declined');
create type public.pronouns            as enum ('she', 'he', 'they', 'unspecified');
create type public.gender              as enum ('woman', 'man', 'non_binary');
create type public.distance_unit       as enum ('mi', 'km');
create type public.audience_gender     as enum ('everyone', 'women', 'men', 'non_binary');
create type public.verification_status as enum ('none', 'pending', 'verified', 'rejected');
create type public.attendance_outcome  as enum ('attended', 'cancelled', 'no_show');
create type public.legal_doc_kind      as enum ('terms', 'privacy');
create type public.report_reason       as enum ('harassment', 'no_show', 'fake_profile', 'inappropriate', 'other');
create type public.entitlement_status  as enum ('active', 'in_trial', 'in_grace', 'billing_issue', 'paused', 'expired', 'refunded');
create type public.platform            as enum ('ios', 'android');

-- ---------------------------------------------------------------------------
-- Remote configuration
--
-- One row per tunable. Readable by anon as well as authenticated: a version gate
-- that only works after sign-in cannot lock out a broken build. No write policy
-- at all, so only the secret key changes a value. Everything in here is public
-- by definition — there is no `is_public` flag, because one mistake on such a
-- flag leaks the thing it was meant to protect. Secrets go to Supabase Vault.
-- ---------------------------------------------------------------------------

create table public.app_config (
  key         text primary key,
  value       jsonb not null,
  description text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  name                    text not null default '' check (char_length(name) <= 40),
  -- Null until the birthday step, six steps after the account exists.
  birthdate               date,
  -- '<profile id>/<file>.jpg' in the `avatars` bucket.
  avatar_storage_path     text,
  pronouns                public.pronouns not null default 'unspecified',
  -- Null means visible to every audience: nobody is hidden for declining to answer.
  gender                  public.gender,
  bio                     text check (char_length(bio) <= 400),
  neighbourhood           text,
  country_code            char(2),
  onboarding_completed_at timestamptz,
  deleted_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint adult check (birthdate is null or birthdate <= current_date - interval '18 years')
);

comment on column public.profiles.neighbourhood is
  'Reverse-geocoded from the point in profile_locations, never typed. Rewritten whenever that point is.';
comment on column public.profiles.country_code is
  'Where the person is from ("De onde você é?"), shown as a flag on their photo. Not where they live.';
comment on column public.profiles.deleted_at is
  'Set by delete-account, which anonymises in place so other people''s conversations stay readable.';

-- The exact home point, isolated in its own table so that no policy on
-- `profiles` can ever leak it. Nothing grants select on this to anyone: every
-- distance calculation happens inside a security definer function that returns
-- metres or a boolean, never coordinates.
create table public.profile_locations (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  point      extensions.geography(point, 4326) not null,
  updated_at timestamptz not null default now()
);

create index profile_locations_point_idx on public.profile_locations using gist (point);

create table public.profile_interests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  interest   text not null check (interest = btrim(interest) and char_length(interest) between 1 and 30),
  primary key (profile_id, interest)
);

-- "Café" and "café" are one interest, or the cap is dodged with near-duplicates.
create unique index profile_interests_folded_idx
  on public.profile_interests (profile_id, lower(interest));

create table public.profile_languages (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  language_code text not null,
  primary key (profile_id, language_code)
);

create table public.preferences (
  profile_id            uuid primary key references public.profiles (id) on delete cascade,
  radius                numeric(5, 2) not null default 2 check (radius > 0),
  distance_unit         public.distance_unit not null default 'mi',
  age_min               smallint not null default 21 check (age_min >= 18),
  age_max               smallint not null default 34 check (age_max <= 99),
  audience_gender       public.audience_gender not null default 'everyone',
  app_language          text not null default 'pt-BR',
  notifications_enabled boolean not null default true,
  updated_at            timestamptz not null default now(),
  constraint age_range_ordered check (age_min <= age_max)
);

-- ---------------------------------------------------------------------------
-- Places, plans and the series that repeat them
-- ---------------------------------------------------------------------------

create table public.places (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text not null,
  point      extensions.geography(point, 4326) not null,
  -- Who added it. A place is shared between plans and outlives its author, so
  -- this is `set null` where every other profile reference cascades.
  profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index places_point_idx on public.places using gist (point);

-- A standing meetup: a weekday, a time and a place, with no organiser. Nobody
-- runs a sunset. A scheduled job materialises the next occurrence as a real row
-- in `plans`, because joins, requests and the group chat all hang off a plan id
-- and a computed occurrence has nothing to attach to.
create table public.plan_series (
  id               uuid primary key default gen_random_uuid(),
  place_id         uuid not null references public.places (id) on delete restrict,
  title            text not null check (char_length(title) between 1 and 60),
  join_mode        public.join_mode not null default 'open',
  seats            smallint check (seats between 2 and 20),
  -- ISO day: 1 = Monday … 7 = Sunday, matching `extract(isodow from …)`.
  repeats_on       smallint not null check (repeats_on between 1 and 7),
  start_time       time not null,
  duration_minutes int check (duration_minutes > 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.plan_series_languages (
  series_id     uuid not null references public.plan_series (id) on delete cascade,
  language_code text not null,
  primary key (series_id, language_code)
);

create table public.plans (
  id               uuid primary key default gen_random_uuid(),
  -- Null for a standing meetup: there is no organiser to name.
  host_id          uuid references public.profiles (id) on delete cascade,
  place_id         uuid not null references public.places (id) on delete restrict,
  series_id        uuid references public.plan_series (id),
  title            text not null check (char_length(title) between 1 and 60),
  join_mode        public.join_mode not null default 'approval',
  starts_at        timestamptz not null,
  duration_minutes int check (duration_minutes > 0),
  -- Total seats, host included — "vagas" in the product's words. Null is a
  -- second shape of plan rather than a bigger number: uncapped, open only, no
  -- waitlist, no seat grid. See docs/database.md §3.12.
  seats            smallint check (seats between 2 and 20),
  age_min          smallint check (age_min >= 18),
  age_max          smallint check (age_max <= 99),
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint plan_age_range_ordered
    check (age_min is null or age_max is null or age_min <= age_max),
  -- Nobody is there to approve a request for a plan with no host.
  constraint hostless_plans_are_open
    check (host_id is not null or join_mode = 'open'),
  constraint uncapped_plans_are_open
    check (seats is not null or join_mode = 'open')
);

create index plans_live_starts_at_idx on public.plans (starts_at) where cancelled_at is null;
create index plans_host_idx on public.plans (host_id);
create index plans_series_idx on public.plans (series_id) where series_id is not null;

-- Which languages the plan is actually held in. Load-bearing rather than
-- decorative: "is this in Portuguese or English?" decides whether someone new in
-- town can follow the evening at all, so the card answers it before the tap.
create table public.plan_languages (
  plan_id       uuid not null references public.plans (id) on delete cascade,
  language_code text not null,
  primary key (plan_id, language_code)
);

create index plan_languages_code_idx on public.plan_languages (language_code);

-- ---------------------------------------------------------------------------
-- Participation
-- ---------------------------------------------------------------------------

create table public.plan_participants (
  plan_id    uuid not null references public.plans (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  is_host    boolean not null default false,
  joined_at  timestamptz not null default now(),
  -- Leaving stamps this rather than deleting the row: it is the one fact
  -- attendance is derived from.
  left_at    timestamptz,
  primary key (plan_id, profile_id)
);

create index plan_participants_profile_idx on public.plan_participants (profile_id);

create table public.join_requests (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.plans (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  message     text check (char_length(message) <= 300),
  status      public.request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (plan_id, profile_id)
);

create index join_requests_pending_idx on public.join_requests (plan_id) where status = 'pending';
-- The weekly quota counts along this one.
create index join_requests_author_idx on public.join_requests (profile_id, created_at desc);

-- Derived by `close-stale-plans` once a plan's end time has passed: a seat with
-- no `left_at` attended, a seat with one cancelled. `no_show` is in the enum for
-- the day a host can report it; nothing writes it yet.
create table public.plan_attendance (
  plan_id     uuid not null references public.plans (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  outcome     public.attendance_outcome not null,
  recorded_at timestamptz not null default now(),
  primary key (plan_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  -- Set for a plan's group chat; null for a direct conversation.
  plan_id    uuid references public.plans (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index conversation_members_profile_idx on public.conversation_members (profile_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  -- Restrict, not cascade: deleting an account must not tear that person's lines
  -- out of everyone else's group conversations. Deletion anonymises instead.
  author_id       uuid not null references public.profiles (id) on delete restrict,
  content         text not null check (char_length(content) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

-- A direct conversation must be unique per pair, or the app will happily open a
-- second thread with the same person. Expressed as a partial unique index over
-- the ordered pair, since the members live one row each.
create table public.direct_conversations (
  conversation_id uuid primary key references public.conversations (id) on delete cascade,
  lower_id        uuid not null references public.profiles (id) on delete cascade,
  higher_id       uuid not null references public.profiles (id) on delete cascade,
  constraint direct_pair_ordered check (lower_id < higher_id),
  unique (lower_id, higher_id)
);

-- ---------------------------------------------------------------------------
-- Verification and legal documents
-- ---------------------------------------------------------------------------

-- Review is manual, in Studio: a person opens the row, looks at the selfie, sets
-- `outcome`. There is no `reviewed_by` and no reviewer console, and a profile's
-- verification status is not stored anywhere — it *is* the latest submission,
-- read through `verification_status_of()`.
create table public.verification_submissions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  submitted_at timestamptz not null default now(),
  outcome      public.verification_status,
  reviewed_at  timestamptz,
  -- The capture screen promises the selfie is deleted after the check. The
  -- retention job purges the object and stamps this, keeping the row so there is
  -- always something to revoke a badge on.
  purged_at    timestamptz
);

create index verification_submissions_latest_idx
  on public.verification_submissions (profile_id, submitted_at desc);

-- `content_md` rather than a URL: with a URL you cannot prove what the document
-- said when it was accepted. Rows are append-only, enforced by trigger — which
-- `service_role` cannot bypass, so even our own tooling cannot rewrite a
-- published document.
create table public.legal_documents (
  id                    uuid primary key default gen_random_uuid(),
  kind                  public.legal_doc_kind not null,
  locale                text not null default 'pt-BR',
  version               text not null,
  content_md            text not null,
  effective_at          timestamptz not null,
  requires_reacceptance boolean not null default false,
  unique (kind, locale, version)
);

create table public.legal_acceptances (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  document_id uuid not null references public.legal_documents (id),
  accepted_at timestamptz not null default now(),
  app_version text,
  platform    public.platform,
  unique (profile_id, document_id)
);

-- ---------------------------------------------------------------------------
-- Safety
-- ---------------------------------------------------------------------------

-- Stored in one direction, applied in both. If only the blocker's view changed,
-- the blocked person could still open their profile, request their plans and
-- message them, and every one of those would fail in a way that announces the
-- block.
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

-- The reverse direction is looked up as often as the forward one.
create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  -- Nullable, or the `set null` below can never fire.
  reporter_id uuid references public.profiles (id) on delete set null,
  subject_id  uuid not null references public.profiles (id) on delete cascade,
  plan_id     uuid references public.plans (id) on delete set null,
  reason      public.report_reason not null,
  detail      text check (char_length(detail) <= 1000),
  created_at  timestamptz not null default now()
);

create index reports_subject_idx on public.reports (subject_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Billing
--
-- RevenueCat is the authority; this is a mirror, and it exists so Postgres can
-- gate server-side. The client's CustomerInfo decides when to dismiss a paywall,
-- never whether a query returns rows.
-- ---------------------------------------------------------------------------

create table public.entitlements (
  profile_id         uuid not null references public.profiles (id) on delete cascade,
  entitlement_id     text not null,
  status             public.entitlement_status not null,
  product_id         text,
  store              text,
  is_sandbox         boolean not null default false,
  current_period_end timestamptz,
  will_renew         boolean,
  last_event_id      text,
  last_event_at      timestamptz,
  updated_at         timestamptz not null default now(),
  primary key (profile_id, entitlement_id)
);

-- Append-only. The RevenueCat event id as the primary key gives idempotency for
-- free; applying an event also checks it is newer than `last_event_at`, because
-- a late RENEWAL must not overwrite a newer CANCELLATION.
create table public.billing_events (
  id          text primary key,
  profile_id  uuid references public.profiles (id) on delete set null,
  type        text not null,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.app_config
  add constraint app_config_updated_by_fkey
  foreign key (updated_by) references public.profiles (id) on delete set null;
