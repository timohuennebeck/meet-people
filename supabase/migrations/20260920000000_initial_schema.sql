-- Initial schema for treff.
--
-- Mirrors the Zod schemas in src/shared/data/schemas.ts. The app still reads
-- from fixtures; this is the shape the fixture data source will resolve against
-- once the data layer points at Supabase.

create extension if not exists "postgis" with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type join_mode as enum ('open', 'approval');
create type request_status as enum ('pending', 'accepted', 'declined');
create type pronouns as enum ('she', 'he', 'they', 'unspecified');
create type distance_unit as enum ('mi', 'km');
create type audience_gender as enum ('everyone', 'women', 'men', 'non_binary');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  birthdate date not null,
  avatar_url text,
  pronouns pronouns not null default 'unspecified',
  bio text check (char_length(bio) <= 400),
  -- Neighbourhood only; the app never stores or shows a street address.
  neighbourhood text,
  -- Coarse location used for radius search. Never returned to other users.
  location extensions.geography(point, 4326),
  -- Where the person is from ("De onde você é?"), shown as a flag; not residence.
  country_code char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column profiles.location is
  'Coarse home location for radius search. Exposed only as a neighbourhood name.';

-- Age is derived rather than stored, so it can never go stale.
create function profile_age(profile profiles) returns integer
  language sql stable
  as $$ select extract(year from age(profile.birthdate))::integer $$;

create table profile_interests (
  profile_id uuid not null references profiles on delete cascade,
  interest text not null check (char_length(interest) between 1 and 40),
  primary key (profile_id, interest)
);

create table profile_languages (
  profile_id uuid not null references profiles on delete cascade,
  language_code text not null,
  primary key (profile_id, language_code)
);

-- ---------------------------------------------------------------------------
-- Preferences
-- ---------------------------------------------------------------------------

create table preferences (
  profile_id uuid primary key references profiles on delete cascade,
  radius numeric(5, 2) not null default 2 check (radius > 0),
  distance_unit distance_unit not null default 'mi',
  age_min smallint not null default 21 check (age_min >= 18),
  age_max smallint not null default 34 check (age_max <= 99),
  audience_gender audience_gender not null default 'everyone',
  app_language text not null default 'pt-BR',
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint age_range_ordered check (age_min <= age_max)
);

-- ---------------------------------------------------------------------------
-- Places and plans
-- ---------------------------------------------------------------------------

create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  location extensions.geography(point, 4326) not null,
  -- Who added it. A place is shared between plans, so it outlives its author.
  profile_id uuid references profiles on delete set null,
  created_at timestamptz not null default now()
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles on delete cascade,
  place_id uuid not null references places on delete restrict,
  title text not null check (char_length(title) between 1 and 60),
  join_mode join_mode not null default 'approval',
  starts_at timestamptz not null,
  duration_minutes integer check (duration_minutes > 0),
  -- Total seats, host included — "vagas" in the product's words.
  seats smallint not null check (seats between 2 and 20),
  age_min smallint check (age_min >= 18),
  age_max smallint check (age_max <= 99),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_age_range_ordered check (age_min is null or age_max is null or age_min <= age_max)
);

create index plans_starts_at_idx on plans (starts_at) where cancelled_at is null;
create index plans_host_idx on plans (host_id);

create table plan_participants (
  plan_id uuid not null references plans on delete cascade,
  profile_id uuid not null references profiles on delete cascade,
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (plan_id, profile_id)
);

create table join_requests (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans on delete cascade,
  profile_id uuid not null references profiles on delete cascade,
  message text check (char_length(message) <= 300),
  status request_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (plan_id, profile_id)
);

create index join_requests_plan_pending_idx
  on join_requests (plan_id) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  -- Set for a plan's group chat; null for a direct conversation.
  plan_id uuid references plans on delete cascade,
  created_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations on delete cascade,
  profile_id uuid not null references profiles on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations on delete cascade,
  -- Restrict, not cascade: deleting an account must not tear that person's
  -- lines out of everyone else's conversations. Deletion anonymises instead.
  author_id uuid not null references profiles on delete restrict,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Everything is denied by default. Each policy below opens the narrowest access
-- a screen actually needs.
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table profile_interests enable row level security;
alter table profile_languages enable row level security;
alter table preferences enable row level security;
alter table places enable row level security;
alter table plans enable row level security;
alter table plan_participants enable row level security;
alter table join_requests enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;

-- Profiles are readable by any signed-in user; only the owner can change theirs.
create policy "profiles are readable when signed in"
  on profiles for select to authenticated using (true);
create policy "own profile is insertable"
  on profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "own profile is updatable"
  on profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "profile interests are readable when signed in"
  on profile_interests for select to authenticated using (true);
create policy "own interests are writable"
  on profile_interests for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "profile languages are readable when signed in"
  on profile_languages for select to authenticated using (true);
create policy "own languages are writable"
  on profile_languages for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- Preferences are private to their owner.
create policy "own preferences are readable"
  on preferences for select to authenticated using (profile_id = (select auth.uid()));
create policy "own preferences are writable"
  on preferences for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "places are readable when signed in"
  on places for select to authenticated using (true);
create policy "places are insertable when signed in"
  on places for insert to authenticated with check (true);

-- Live plans are discoverable; only the host can edit or cancel one.
create policy "live plans are readable"
  on plans for select to authenticated using (cancelled_at is null);
create policy "plans are created by their host"
  on plans for insert to authenticated with check (host_id = (select auth.uid()));
create policy "plans are edited by their host"
  on plans for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));

create policy "participants are readable when signed in"
  on plan_participants for select to authenticated using (true);
create policy "participants leave their own plans"
  on plan_participants for delete to authenticated using (profile_id = (select auth.uid()));

-- A request is visible to its author and to the plan's host, nobody else.
create policy "requests are readable by author or host"
  on join_requests for select to authenticated using (
    profile_id = (select auth.uid())
    or exists (
      select 1 from plans
      where plans.id = join_requests.plan_id and plans.host_id = (select auth.uid())
    )
  );
create policy "requests are created by their author"
  on join_requests for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "requests are resolved by the host"
  on join_requests for update to authenticated using (
    exists (
      select 1 from plans
      where plans.id = join_requests.plan_id and plans.host_id = (select auth.uid())
    )
  );
create policy "requests are withdrawn by their author"
  on join_requests for delete to authenticated using (profile_id = (select auth.uid()));

-- Conversations and messages are visible only to their members.
create policy "conversations are readable by members"
  on conversations for select to authenticated using (
    exists (
      select 1 from conversation_members
      where conversation_members.conversation_id = conversations.id
        and conversation_members.profile_id = (select auth.uid())
    )
  );

create policy "membership is readable by members"
  on conversation_members for select to authenticated using (profile_id = (select auth.uid()));
create policy "own read receipts are updatable"
  on conversation_members for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "messages are readable by members"
  on messages for select to authenticated using (
    exists (
      select 1 from conversation_members
      where conversation_members.conversation_id = messages.conversation_id
        and conversation_members.profile_id = (select auth.uid())
    )
  );
create policy "messages are sent by members"
  on messages for insert to authenticated with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from conversation_members
      where conversation_members.conversation_id = messages.conversation_id
        and conversation_members.profile_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function set_updated_at() returns trigger
  language plpgsql
  as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger plans_updated_at before update on plans
  for each row execute function set_updated_at();

-- Seat the host the moment a plan is created, so seat maths is consistent.
create function seat_plan_host() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  insert into public.plan_participants (plan_id, profile_id, is_host)
  values (new.id, new.host_id, true);
  return new;
end;
$$;

create trigger plans_seat_host after insert on plans
  for each row execute function seat_plan_host();
