# Database

The schema plan for treff, and the reasoning behind it. The app still reads from
the in-memory fixtures in `src/shared/data/fixtures.ts`; this describes where it
is going and what has to change on the way.

## Where we are

A first migration exists — `migrations/20260920000000_initial_schema.sql`, 319
lines — but nothing reads from it yet.

The contract between the app and the database is `src/shared/data/source.ts`.
Its fourteen methods are the entire query surface the database has to serve, and
when this work lands only their bodies change:

| Group       | Methods                                            |
| ----------- | -------------------------------------------------- |
| Plans       | `list`, `detail`, `setMembership`, `acceptRequest` |
| Users       | `me`, `detail`, `search`, `recent`                 |
| Chats       | `conversations`, `thread`, `send`, `receive`       |
| Places      | `recent`, `nearby`                                 |
| Preferences | `get`, `update`                                    |

The existing skeleton gets several things right, and they stay:

- Profiles are keyed to `auth.users`, so identity has one owner.
- Age is a function over `birthdate`, not a stored integer that goes stale.
- `neighbourhood` is a separate column from the coarse `location` point, which
  reflects the design's promise that nobody sees an address.
- PostGIS is enabled.
- RLS is on for every table, with policies written per screen rather than one
  blanket rule.
- A trigger seats the host the moment a plan is created, so capacity arithmetic
  starts from a consistent place.

## What the current migration gets wrong

Three defects, one of them a live privacy hole.

**Profiles expose everything to everyone.** The policy reads
`on profiles for select to authenticated using (true)`, which hands every
signed-in user all columns — including `location` and `birthdate`. The design is
explicit on this point ("Ninguém vê seu endereço, só o bairro") and the schema
contradicts it. This is the one change worth making before anything else.

**Nothing enforces capacity.** `plan_participants` has no guard against
`plans.capacity`, so accepting a request into a full plan silently over-seats
it. The race is not theoretical: a host tapping Accept twice in quick succession
is the same concurrency case already fixed on the client side, and the database
has no equivalent protection.

**`audience_gender` has nothing to filter on.** Preferences store
`everyone | women | men | nonBinary`, but `profiles` carries no gender column —
only pronouns, which are a different thing and should not stand in for it. The
setting cannot work as built.

Smaller gaps in the same file: no trigger creating a profile row on signup, no
GIST index on either `location`, no index on `plan_participants(profile_id)` or
`conversation_members(profile_id)`, no `updated_at` trigger on `preferences`,
and no rule that a direct conversation has exactly one row per pair.

## Decisions taken

| Question                        | Decision                                                                | Why                                                                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gender, for the audience filter | Nullable `gender` on `profiles`, edited from settings                   | The design has no onboarding step for it, so we don't invent a screen. Null means visible to everyone — nobody is hidden for declining to answer.                                                |
| How attendance is measured      | Derived from cancellations                                              | Rule 1 is "Combinado é combinado"; the thing worth measuring is cancellation discipline, and the app already records leave time and start time. No new UI, nothing a hostile host can weaponise. |
| Where the home location lives   | Exact point, in its own `profile_locations` table with no SELECT policy | Better than blurring. A careless policy on a wide `profiles` table is exactly the bug in the migration today; if the column isn't on that table, no policy mistake can leak it.                  |
| Free-tier request cap           | Build the counter, defer the number                                     | The limit lives in `app_config`, so it moves without a migration or an app release.                                                                                                              |
| Legal document storage          | `content_md` in the row, not a URL                                      | With a URL you cannot prove what the document said when it was accepted. With the text in an immutable row, the accepted version _is_ the artifact.                                              |
| Subscriptions                   | RevenueCat is the authority; the database mirrors it                    | The mirror exists so Postgres can gate data server-side. The client's `CustomerInfo` decides when to dismiss a paywall, never whether a query returns rows.                                      |

One earlier recommendation was revised. Snapping the home location to a ~500 m
grid is wrong for this app: the smallest discovery radius is 1 mi (~1,600 m), so
a 500 m snap is up to a third of it, and the design shows labels like "a 400 m"
that would visibly drift. Isolating the exact point in its own table solves the
leak risk structurally instead.

## Identity, profiles and privacy

The base table is locked to its owner; everyone else reads a view. That
inversion is the whole fix for the leak above.

| Table                    | Holds                                                                                      | Who can read it                  |
| ------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------- |
| `profiles`               | name, birthdate, avatar, pronouns, gender, bio, neighbourhood, country, verification state | Owner only                       |
| `public_profiles` (view) | name, derived age, avatar, neighbourhood, country, verified, bio, gender                   | Any signed-in user               |
| `profile_locations`      | the exact home point                                                                       | Nobody — no SELECT policy at all |
| `profile_interests`      | one row per interest                                                                       | Any signed-in user               |
| `profile_languages`      | language code + level                                                                      | Any signed-in user               |
| `preferences`            | radius, unit, age range, audience, app language, notifications                             | Owner only                       |

`profile_locations` is the load-bearing piece. It carries a
`geography(point, 4326)` with a GIST index and no policy grants SELECT to
anyone. Every distance calculation happens inside `security definer` functions
that return distances and in-radius booleans, never coordinates. A client cannot
read a point even in principle.

Two additions to `profiles` itself: `gender` (nullable, as decided) and
`deleted_at`, which the deletion path below depends on.

A `handle_new_user` trigger on `auth.users` creates the profile and preferences
rows on signup. Without it the first write after sign-up fails a foreign key.

## Plans, places and discovery

`plans`, `places`, `plan_participants` and `join_requests` already exist and are
broadly right. Four things get added.

**A capacity trigger.** Before a participant is seated, count seats against
`plans.capacity` in the same transaction and raise if it would overflow. This is
what stops the double-accept race.

**Waitlist ordering.** `join_requests.waitlisted` is a boolean today, which
cannot express "next in line". It needs a position, so the host sheet's
"+1 vaga" has a defined person to admit.

**`plan_attendance`**, shaped to take better signals later without a rewrite:

```
plan_attendance(plan_id, profile_id,
  outcome  enum('attended','cancelled_early','cancelled_late','no_show'),
  source   enum('derived','host','self'),
  recorded_at)
```

Only the `derived` path gets wired now. Its weakness is worth naming: someone
who silently fails to turn up, without ever tapping leave, keeps a perfect
score. Because `source` exists from day one, adding host confirmation later is
an insert, not a migration.

**A `nearby_plans(radius, unit, filters)` RPC**, which is the real workhorse.
One round trip returns the spatial query, the age and gender filters, the blocks
exclusion and the viewer's membership per plan. Doing this as separate table
reads would mean four round trips and a membership value the client has to
compute.

Two fields the database should not hold. `whenLabel` ("Hoje 19:00–21:00") is
locale formatting — the client's job, from `starts_at`. And `pin` is a
coordinate in the design's 402×874 canvas; in production it is a projection of
lat/lng onto the current viewport, computed at render time.

## Chat

The three tables are in place and correct. What is missing is everything the
conversations list actually renders.

A `Conversation` in the app carries title, one or two avatars, a `+N` pill, a
preview line, a time label, an unread count, a member count and an online count.
None of that is stored. A `conversation_list` view assembles it per viewer:
title and avatars from the other members for a direct chat or from the plan for
a group, preview and timestamp from the newest message, unread from
`messages.created_at > conversation_members.last_read_at`.

`online` and `onlineCount` come from Realtime presence, not from a column. A
stored boolean would be wrong within seconds of a connection dropping.

Messages go into the `supabase_realtime` publication so threads update without
polling. The client's optimistic send stays as it is — the bubble appears
immediately and the realtime echo reconciles it.

`Message.receipt` ("Visto 9:24", "Visto por 4") is derived from the other
members' `last_read_at`, not stored per message. A receipt row per message per
reader is write amplification nobody needs at this size.

One constraint to add: a direct conversation must be unique per pair of people,
or the app will happily create a second thread with the same person.

## Safety

Neither blocking nor reporting exists anywhere in the app or the schema today.
For a product whose premise is meeting strangers in person, both are table
stakes rather than a later feature.

```
blocks(blocker_id, blocked_id, created_at)      -- primary key on the pair
reports(id, reporter_id, subject_id, plan_id?, reason, detail, status, created_at)
```

The part that matters is not the tables but where they are joined. A block has
to be invisible and total: neither person sees the other in `nearby_plans`, in
people search, in a plan's participant list, or in a conversation. That means
the exclusion belongs in the RPC and in the read policies, not in client-side
filtering — otherwise a blocked person still appears in any response the client
happens to render differently.

Reports are append-only and readable only by their author, with resolution
handled out of band. Putting a moderation status back in front of the reporter
invites argument about it.

## Verification, legal and billing

### Verification

`profiles.verification_status` exists, but nothing records the submission.
`verification_submissions` holds the storage path, submitted and reviewed
timestamps, reviewer and outcome, against a private `selfies` bucket no user can
list.

The selfie screen promises "Apagamos a selfie depois da conferência". That is a
retention obligation, not a nicety — see [Data protection](#data-protection).

### Legal documents

```
legal_documents(id, kind, locale, version, title, content_md,
                content_sha256, url?, requires_reacceptance,
                effective_at)   -- unique (kind, locale, version)
legal_acceptances(profile_id, document_id, content_sha256,
                  accepted_at, app_version)
```

Rows are append-only: a `before update or delete` trigger rejects every
mutation, so a new version is a new row. That trigger is the right enforcement
point because `service_role` bypasses RLS but **not** triggers — even our own
admin tooling cannot quietly rewrite a published document.

Readable by `anon` as well as `authenticated`: the welcome screen shows these
links before sign-in. The prose itself lives in the repo as `legal/*.md` and a
migration publishes it, so the text is code-reviewed and diffable while the row
stays the immutable artifact.

This also makes two dead links work. **Termos** and **Privacidade** currently
render as styled text with no `onPress`, and `app/` has no legal route at all.
Rendering `content_md` needs a small in-house Markdown renderer — six node types
is enough for legal prose — rather than a dependency that renders its own text
components and bypasses `@shared/ui`'s `Text`.

### Billing

One thing has to change before any of this functions: `BillingProvider` calls
`Purchases.configure({ apiKey })` with no `appUserID`, and nothing calls
`Purchases.logIn()` on sign-in. Every install therefore gets an anonymous
RevenueCat id, and a webhook arriving with it cannot be mapped to a profile.

```
entitlements(profile_id, entitlement_id, status, product_id, store,
             is_sandbox, current_period_end, will_renew,
             last_event_id, last_event_at)
billing_events(id, profile_id, type, payload, received_at)
```

`billing_events.id` is the RevenueCat event id, so `on conflict do nothing`
gives idempotency against retries for free. `entitlements` is readable by its
owner and has **no write policies at all** — only the webhook's `service_role`
writes. A user granting themselves Plus must be structurally impossible, not
merely unexposed in the UI.

The webhook Edge Function verifies the shared secret, records the event, applies
it only if `event_timestamp_ms` is newer than `last_event_at`, then upserts.
Out-of-order delivery is real: a late `RENEWAL` must not overwrite a newer
`CANCELLATION`. Two events are easy to miss — `TRANSFER` moves a subscription
between accounts and must revoke from the old profile, and `REFUND` must revoke
immediately rather than waiting out the period.

Gating is a single `has_plus()` function, and all four paywall promises are
enforced server-side:

| Promise                   | Enforced in                                  |
| ------------------------- | -------------------------------------------- |
| Unlimited join requests   | the quota trigger skips the `app_config` cap |
| See who wants to meet you | the read policy on inbound requests          |
| The whole city            | `nearby_plans()` clamps radius               |
| Filters                   | `nearby_plans()` ignores filter args         |

Deliberately not stored: receipts and purchase tokens. RevenueCat holds those;
copying them buys nothing and adds a liability.

## Configuration

One row per setting, JSON value, parsed through Zod on the client like every
other read.

```sql
create table app_config (
  key         text primary key,
  value       jsonb not null,
  description text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references profiles
);
```

Three properties matter. It is readable by `anon`, not just `authenticated` — a
version gate and a maintenance flag must work before sign-in, or we cannot lock
out a broken build. It has no write policies, so only `service_role` changes it.
And everything in it is public by definition: no `is_public` column, because one
mistake on that flag leaks the thing it was meant to protect. Secrets belong in
Supabase Vault.

Starting keys: `free_request_limit`, `free_request_window_days`,
`min_supported_version`, `maintenance_mode`, `verification_sla_hours`,
`selfie_retention_days`, `plan_capacity_max`.

## Where each UI field comes from

Roughly half of what the app renders is viewer-relative, which is why so much of
this is views and RPCs rather than table reads.

| UI field                | Source                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `User.age`              | `profile_age()` over `birthdate`                                                   |
| `User.plansCount`       | count of past plans attended                                                       |
| `User.sharedPlansCount` | plans both viewer and subject attended — viewer-relative                           |
| `User.attendanceRate`   | `plan_attendance`                                                                  |
| `Plan.membership`       | viewer-relative, returned by `nearby_plans()`                                      |
| `Place.distanceLabel`   | `ST_Distance` inside a `security definer` function; formatted client-side per unit |
| `Plan.whenLabel`        | client-side from `starts_at`                                                       |
| `Plan.pin`              | client-side projection of lat/lng                                                  |
| `Conversation.*`        | the `conversation_list` view                                                       |
| `Conversation.online`   | Realtime presence                                                                  |
| `Message.receipt`       | other members' `last_read_at`                                                      |

Denormalised counters only where a view proves too slow. At this size none of
them do yet.

## Data protection

**Deleting an account today would damage other people's chats.**
`messages.author_id` is `references profiles on delete cascade`, and settings
has an "Excluir conta" row. Removing an account would erase that person's
messages out of every group conversation they were part of, leaving holes in
other people's history.

The fix is to anonymise rather than delete: set `profiles.deleted_at`, scrub the
identifying columns (name, avatar, bio, birthdate, gender, interests,
languages), drop the `profile_locations` row, purge storage objects, and change
that cascade to a restrict. The person is erased; the conversation stays
readable.

That approach also carries the rest of the obligations cleanly:

| Right                  | Mechanism                                                                |
| ---------------------- | ------------------------------------------------------------------------ |
| Erasure                | the anonymisation routine plus a storage purge                           |
| Access and portability | an `export_my_data()` RPC returning one JSON document for the caller     |
| Retention              | a `pg_cron` job purging selfies `selfie_retention_days` after a decision |

The retention job is not optional housekeeping: the capture screen already
promises the selfie is deleted after review, so the schedule is a commitment the
product has made on screen.

Two things to flag rather than settle here. The app is pt-BR with a Lisbon
setting, so **LGPD and GDPR probably both apply**. And a selfie used to confirm
identity is likely **biometric data under GDPR Article 9**, which carries a
higher bar than ordinary personal data and plausibly requires explicit consent
for that specific processing. The engineering above is buildable either way, but
the policy text and the Article 9 question should go past a lawyer.

## Migration sequence

Four files. The first is urgent; the rest can follow in any order.

| File                      | Contains                                                                                                                             | Why this order                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `002_privacy_split`       | `public_profiles` view, `profile_locations`, tightened profile policies, `gender`, `deleted_at`, `handle_new_user`, missing indexes  | Closes the live leak. Everything else assumes profiles are already locked down.         |
| `003_safety_and_capacity` | `blocks`, `reports`, the capacity trigger, waitlist ordering, `plan_attendance`                                                      | Blocks must exist before `nearby_plans` is written, since the exclusion lives inside it |
| `004_trust_legal_billing` | `verification_submissions`, `legal_documents` + `legal_acceptances`, `entitlements`, `billing_events`, `app_config`, storage buckets | `app_config` lands here because the quota gate in 005 reads it                          |
| `005_derived_reads`       | `conversation_list`, `nearby_plans()`, `has_plus()`, `export_my_data()`, the quota trigger, realtime publication                     | Everything it composes exists by now                                                    |

Each one ships with `npm run db:reset` passing locally and `npm run db:types`
regenerating `database.types.ts`. The app keeps reading fixtures throughout —
pointing `source.ts` at Supabase is a separate change, made once the schema
settles, and can go method by method behind the existing fourteen signatures.

## Open questions

- On account deletion, does the `legal_acceptances` row survive as proof of
  consent, or go with everything else? Keeping it is the usual choice for legal
  defence; erasing it is the purer reading of the right to erasure.
- When two people who share a live plan block each other, does the plan keep
  both and hide the chat, or drop one of them?
- Do sandbox purchases grant real Plus in TestFlight? `is_sandbox` is on the row
  either way; `has_plus()` needs to know which answer.
- Where does `gender` get asked — settings only, or a new onboarding step once
  fill rates matter?
- Four plan-sheet states the design draws have no fixture that reaches them:
  requested, joined, host-with-requests and host-full. Worth fixing in the
  fixtures so the schema work has something to verify against.
