-- Example content for a development database.
--
-- The people, plans and places are the ones transcribed from the design export
-- into `src/shared/data/fixtures.ts`, so a wired-up app renders the same names
-- and faces as the mockups. Coordinates are real Kreuzberg ones chosen to
-- reproduce the distances the design prints ("a 400 m", "0,5 mi"): the viewer's
-- home point sits by Kottbusser Tor and every place is placed at its labelled
-- distance from it.
--
-- Two deliberate departures from the fixtures, both because the database
-- filters where the fixture array did not:
--
--   * the walk the viewer hosts moved from 12 September to the coming Saturday,
--     since `nearby_plans()` only returns plans that have not already happened;
--   * the viewer's radius is seeded at 3 mi rather than 2, so the walk at
--     2,4 mi is inside it. 3 is also the free-tier ceiling, so this is the
--     widest a free account can see.
--
-- Passwords are all `treff-dev-2026`. This is seed data for a development
-- project and nothing else.

begin;

-- ---------------------------------------------------------------------------
-- Remote configuration
-- ---------------------------------------------------------------------------

insert into public.app_config (key, value, description) values
  ('free_request_limit',       '3',       'Requests a free account may send inside the window below.'),
  ('free_request_window_days', '7',       'Rolling window for the free request quota — "Grátis: 3 por semana".'),
  ('min_supported_version',    '"1.0.0"', 'Builds below this are sent to the App Store before sign-in.'),
  ('maintenance_mode',         'false',   'Blocks the app with a notice while something is being fixed.'),
  ('selfie_retention_days',    '7',       'How long a reviewed selfie survives before the purge job deletes it.'),
  ('free_radius_max_mi',       '3',       'Radius a free account is clamped to in nearby_plans().')
on conflict (key) do update set value = excluded.value, description = excluded.description;

-- ---------------------------------------------------------------------------
-- Accounts
--
-- Written straight into `auth.users` rather than through the API because a seed
-- runs before there is an app to sign up with. The `on_auth_user_created`
-- trigger gives each one a profile row — preferences are columns on it since
-- `…000600_collapse_side_tables` — and the updates below fill it in.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  person.id,
  'authenticated',
  'authenticated',
  person.email,
  extensions.crypt('treff-dev-2026', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', person.name),
  now(),
  now()
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, 'mara.k@mail.com',  'Mara'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'phil@mail.com',    'Phil'),
  ('11111111-1111-4111-8111-000000000003'::uuid, 'sara@mail.com',    'Sara'),
  ('11111111-1111-4111-8111-000000000004'::uuid, 'lea@mail.com',     'Lea'),
  ('11111111-1111-4111-8111-000000000005'::uuid, 'noah@mail.com',    'Noah'),
  ('11111111-1111-4111-8111-000000000006'::uuid, 'elif@mail.com',    'Elif'),
  ('11111111-1111-4111-8111-000000000007'::uuid, 'tom@mail.com',     'Tom'),
  ('11111111-1111-4111-8111-000000000008'::uuid, 'ana@mail.com',     'Ana')
) as person(id, email, name)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where not exists (select 1 from auth.identities i where i.user_id = u.id);

-- ---------------------------------------------------------------------------
-- Profiles
--
-- `avatar_storage_path` holds a full picsum URL for seed rows. The design sources
-- its placeholder portraits from picsum with stable seeds, so these are the exact
-- faces in the mockups; the client treats a value starting with `http` as a URL
-- and anything else as a path in the `avatars` bucket, which is what a real
-- upload writes.
-- ---------------------------------------------------------------------------

update public.profiles p set
  name = v.name,
  birthdate = v.birthdate,
  avatar_storage_path = v.avatar,
  pronouns = v.pronouns::public.pronouns,
  bio = v.bio,
  neighbourhood = v.neighbourhood,
  country_code = v.country_code,
  onboarding_completed_at = now() - interval '30 days'
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, 'Mara', date '2002-04-11', 'https://picsum.photos/seed/me-avatar/300/300',  'she',         null, 'Kreuzberg',      'es'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'Phil', date '2003-02-08', 'https://picsum.photos/seed/host-jonas/300/300', 'he',          null, 'Kreuzberg',      null),
  ('11111111-1111-4111-8111-000000000003'::uuid, 'Sara', date '2002-07-19', 'https://picsum.photos/seed/p-sara/300/300',     'she',
     'Faço xadrez ruim e corro devagar, mas apareço sempre. Prefiro planos de semana à noite.', 'Kreuzberg', 'es'),
  ('11111111-1111-4111-8111-000000000004'::uuid, 'Lea',  date '1999-05-02', 'https://picsum.photos/seed/chat-lea/300/300',   'she',         null, 'Friedrichshain', null),
  ('11111111-1111-4111-8111-000000000005'::uuid, 'Noah', date '2005-01-23', 'https://picsum.photos/seed/req-noah/300/300',   'he',          null, 'Mitte',          null),
  ('11111111-1111-4111-8111-000000000006'::uuid, 'Elif', date '2002-09-30', 'https://picsum.photos/seed/req-elif/300/300',   'she',         null, 'Neukölln',       'tr'),
  ('11111111-1111-4111-8111-000000000007'::uuid, 'Tom',  date '2007-03-14', 'https://picsum.photos/seed/req-tom/300/300',    'he',          null, 'Neukölln',       null),
  ('11111111-1111-4111-8111-000000000008'::uuid, 'Ana',  date '2001-11-05', 'https://picsum.photos/seed/chat-lea-2/300/300', 'she',         null, 'Friedrichshain', 'br')
) as v(id, name, birthdate, avatar, pronouns, bio, neighbourhood, country_code)
where p.id = v.id;

-- Home points. Nothing can read these; they exist so `nearby_plans()` and
-- `distance_to()` have something to measure from.
insert into public.profile_locations (profile_id, point)
select v.id, extensions.st_setsrid(extensions.st_point(v.lng, v.lat), 4326)::extensions.geography
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, 13.4180, 52.4990),
  ('11111111-1111-4111-8111-000000000002'::uuid, 13.4205, 52.4985),
  ('11111111-1111-4111-8111-000000000003'::uuid, 13.4162, 52.5001),
  ('11111111-1111-4111-8111-000000000004'::uuid, 13.4540, 52.5150),
  ('11111111-1111-4111-8111-000000000005'::uuid, 13.4010, 52.5210),
  ('11111111-1111-4111-8111-000000000006'::uuid, 13.4300, 52.4810),
  ('11111111-1111-4111-8111-000000000007'::uuid, 13.4350, 52.4790),
  ('11111111-1111-4111-8111-000000000008'::uuid, 13.4520, 52.5120)
) as v(id, lng, lat)
on conflict (profile_id) do update set point = excluded.point;

update public.profiles p set interests = v.interests, languages = v.languages
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, array['Corrida','Cinema','Café'], array['de','en']::public.language_code[]),
  ('11111111-1111-4111-8111-000000000002'::uuid, array['Jogos','Café'],            array['de','en']::public.language_code[]),
  ('11111111-1111-4111-8111-000000000003'::uuid, array['Corrida','Cinema','Café'], array['de','en']::public.language_code[]),
  ('11111111-1111-4111-8111-000000000004'::uuid, array['Corrida'],                 array['de']::public.language_code[]),
  ('11111111-1111-4111-8111-000000000005'::uuid, array['Jogos'],                   array['de']::public.language_code[]),
  ('11111111-1111-4111-8111-000000000006'::uuid, array['Jogos','Café'],            array['de','en']::public.language_code[]),
  ('11111111-1111-4111-8111-000000000007'::uuid, array['Jogos'],                   array['de']::public.language_code[]),
  ('11111111-1111-4111-8111-000000000008'::uuid, array['Café'],                    array['pt','en']::public.language_code[])
) as v(id, interests, languages)
where p.id = v.id;

-- Everyone but Tom is verified, which is what the design draws: his request row
-- is the one that reads "Ainda não verificado".
-- `on conflict` cannot help here: the primary key is a generated uuid, so a
-- second run would never collide and would simply give everybody a second
-- submission. The `not exists` is what makes re-seeding idempotent.
insert into public.verification_submissions (profile_id, storage_path, outcome, submitted_at)
select p.id, p.id::text || '/selfie.jpg', 'verified', now() - interval '20 days'
from public.profiles p
where p.id <> '11111111-1111-4111-8111-000000000007'
  and not exists (
    select 1 from public.verification_submissions v where v.profile_id = p.id
  );

update public.profiles set radius = 3 where id = '11111111-1111-4111-8111-000000000001';

-- ---------------------------------------------------------------------------
-- Places
-- ---------------------------------------------------------------------------

insert into public.places (id, name, address, point, profile_id) values
  ('22222222-2222-4222-8222-000000000001', 'Café Kotti',           'Blutenburgstr. 96', extensions.st_setsrid(extensions.st_point(13.4235, 52.4990), 4326)::extensions.geography, '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000002', 'Tempelhofer Feld',     'Portão Oderstr.',   extensions.st_setsrid(extensions.st_point(13.4180, 52.4830), 4326)::extensions.geography, '11111111-1111-4111-8111-000000000001'),
  ('22222222-2222-4222-8222-000000000003', 'Parque Görlitzer',     'Entrada norte',     extensions.st_setsrid(extensions.st_point(13.4310, 52.4975), 4326)::extensions.geography, '11111111-1111-4111-8111-000000000004'),
  ('22222222-2222-4222-8222-000000000004', 'Kottbusser Tor (metrô)', 'Estação',         extensions.st_setsrid(extensions.st_point(13.4180, 52.5030), 4326)::extensions.geography, '11111111-1111-4111-8111-000000000001'),
  ('22222222-2222-4222-8222-000000000005', 'Königsplatz',          'Königsplatz',       extensions.st_setsrid(extensions.st_point(13.4180, 52.5063), 4326)::extensions.geography, '11111111-1111-4111-8111-000000000004'),
  ('22222222-2222-4222-8222-000000000006', 'S Schlachtensee',      'S Schlachtensee',   extensions.st_setsrid(extensions.st_point(13.4180, 52.4643), 4326)::extensions.geography, '11111111-1111-4111-8111-000000000001'),
  ('22222222-2222-4222-8222-000000000007', 'Café Luzia',           'Oranienstr. 34',    extensions.st_setsrid(extensions.st_point(13.4230, 52.5028), 4326)::extensions.geography, '11111111-1111-4111-8111-000000000006')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Plans
--
-- Times are relative to whenever the seed runs, so the four are always ahead of
-- now and the map is never empty. The host is seated by trigger, so only the
-- other participants are inserted below.
-- ---------------------------------------------------------------------------

insert into public.plans (id, host_id, place_id, title, join_mode, starts_at, duration_minutes, seats) values
  ('33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-000000000004', '22222222-2222-4222-8222-000000000005',
   'Corrida leve de 3 mi no canal', 'approval',
   date_trunc('day', now()) + interval '18 hours 30 minutes', 60, 6),

  ('33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-000000000002', '22222222-2222-4222-8222-000000000001',
   'Tarde de jogos no Café Kotti', 'approval',
   date_trunc('day', now()) + interval '19 hours', 120, 4),

  ('33333333-3333-4333-8333-000000000003',
   '11111111-1111-4111-8111-000000000001', '22222222-2222-4222-8222-000000000006',
   'Caminhada em volta do Schlachtensee', 'approval',
   date_trunc('day', now()) + interval '6 days 10 hours', 120, 5),

  ('33333333-3333-4333-8333-000000000004',
   '11111111-1111-4111-8111-000000000006', '22222222-2222-4222-8222-000000000007',
   'Café no domingo', 'open',
   date_trunc('day', now()) + interval '1 day 10 hours', 90, 4)
on conflict (id) do nothing;

update public.plans p set languages = v.languages
from (values
  ('33333333-3333-4333-8333-000000000001'::uuid, array['pt','en']::public.language_code[]),
  ('33333333-3333-4333-8333-000000000002'::uuid, array['pt','en','de']::public.language_code[]),
  ('33333333-3333-4333-8333-000000000003'::uuid, array['pt']::public.language_code[]),
  ('33333333-3333-4333-8333-000000000004'::uuid, array['en','es']::public.language_code[])
) as v(id, languages)
where p.id = v.id;

-- The run: Lea hosts, and Sara, Noah and the viewer have seats — four of six,
-- which is why the viewer can open its group chat below. The games afternoon:
-- Phil hosts and Sara has the second of four seats, so two are open and three
-- people are waiting for them.
--
-- Written with the state machine switched off: a seed is not a sequence of
-- taps, and `admit_member()` would otherwise count Noah's request against a
-- quota and refuse a seat on an approval plan that nobody accepted.
alter table public.plan_members disable trigger user;

insert into public.plan_members (plan_id, profile_id, status, seated_at) values
  ('33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000003', 'seated', now() - interval '2 days'),
  ('33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000005', 'seated', now() - interval '2 days'),
  ('33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000001', 'seated', now() - interval '1 day'),
  ('33333333-3333-4333-8333-000000000002', '11111111-1111-4111-8111-000000000003', 'seated', now() - interval '1 day')
on conflict do nothing;

-- Three pending requests on the games afternoon, in the order they arrived.
-- Tom appears once, not twice: the fixture listed him under both "requests" and
-- "waitlist", but the waitlist is derived — it is simply the queue in
-- `created_at` order once the seats run out.
-- `requested_at` is supplied rather than left to `admit_member()`, which is
-- exactly the trigger disabled above; without it `requests_are_dated` refuses
-- the row. It is also what the weekly quota counts, so it has to match
-- `created_at` for these to read as three requests made in the last hours.
insert into public.plan_members (plan_id, profile_id, status, message, created_at, requested_at) values
  ('33333333-3333-4333-8333-000000000002', '11111111-1111-4111-8111-000000000005', 'requested',
   'Jogo há 2 anos, sou nova em Berlim', now() - interval '3 hours', now() - interval '3 hours'),
  ('33333333-3333-4333-8333-000000000002', '11111111-1111-4111-8111-000000000006', 'requested',
   null, now() - interval '2 hours', now() - interval '2 hours'),
  ('33333333-3333-4333-8333-000000000002', '11111111-1111-4111-8111-000000000007', 'requested',
   null, now() - interval '1 hour', now() - interval '1 hour')
on conflict do nothing;

alter table public.plan_members enable trigger user;

-- ---------------------------------------------------------------------------
-- A standing meetup
--
-- No host, no seat limit, open to whoever turns up. The occurrences are
-- materialised by `materialise_plan_series()` at the end of this file rather
-- than written out here, so the seed exercises the same path the scheduled job
-- will.
-- ---------------------------------------------------------------------------

insert into public.plan_series
  (id, place_id, title, join_mode, seats, repeats_on, start_time, duration_minutes, languages) values
  ('55555555-5555-4555-8555-000000000001', '22222222-2222-4222-8222-000000000003',
   'Caminhada de quarta no Görlitzer', 'open', null, 3, time '18:30', 90, array['pt','en']::public.language_code[])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chat
--
-- The two threads the design scripts: the run's group chat and a direct one with
-- Sara. The group chat is not created here — `plans_open_chat` made it when the
-- plan was inserted, and `plan_members_sync_chat` seated its members — so the
-- seed only finds it, and writes the direct thread that no trigger makes.
-- Timestamps are minutes apart and relative to now, so the conversations list
-- always has something recent at the top.
-- ---------------------------------------------------------------------------

-- The run's chat was made by `open_plan_chat` with a generated id, and
-- `plan_members_sync_chat` has already written `conversation_members` rows
-- against it. Neither foreign key carries `on update cascade`, so renumbering
-- the conversation here raised a 23503 — the id is read into a setting and the
-- inserts below name that instead.
select set_config('treff.seed_run_chat',
                  (select id::text from public.conversations
                    where plan_id = '33333333-3333-4333-8333-000000000001'),
                  true);

-- Left deliberately stale, so the run's thread shows an unread badge.
update public.conversation_members set last_read_at = now() - interval '1 day'
where conversation_id = current_setting('treff.seed_run_chat')::uuid
  and profile_id = '11111111-1111-4111-8111-000000000001';

insert into public.conversations (id, direct_lower_id, direct_higher_id) values
  ('66666666-6666-4666-8666-000000000002',
   '11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000003')
on conflict (id) do nothing;

insert into public.conversation_members (conversation_id, profile_id) values
  ('66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000001'),
  ('66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000003')
on conflict do nothing;

insert into public.messages (conversation_id, author_id, content, created_at) values
  (current_setting('treff.seed_run_chat')::uuid, '11111111-1111-4111-8111-000000000004',
   'Rota nova hoje: ponte, canal e volta pelo parque.', now() - interval '50 minutes'),
  (current_setting('treff.seed_run_chat')::uuid, '11111111-1111-4111-8111-000000000003',
   'Boa. Ritmo tranquilo?', now() - interval '48 minutes'),
  (current_setting('treff.seed_run_chat')::uuid, '11111111-1111-4111-8111-000000000004',
   'Uns 6 min/km, ninguém fica para trás.', now() - interval '46 minutes'),
  (current_setting('treff.seed_run_chat')::uuid, '11111111-1111-4111-8111-000000000001',
   'Fechado, levo a bola pro depois.', now() - interval '44 minutes'),
  (current_setting('treff.seed_run_chat')::uuid, '11111111-1111-4111-8111-000000000005',
   'Chego direto do trabalho, 18h55 no máximo.', now() - interval '42 minutes'),

  ('66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000003',
   'Oi! Vi que você entrou na corrida de amanhã.', now() - interval '34 minutes'),
  ('66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000001',
   'Entrei sim. Você vai desde o começo?', now() - interval '33 minutes'),
  ('66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000003',
   'Vou. Encontro na ponte às 18h50?', now() - interval '31 minutes'),
  ('66666666-6666-4666-8666-000000000002', '11111111-1111-4111-8111-000000000001',
   'Perfeito, te vejo lá.', now() - interval '30 minutes');

-- A few people have looked at the viewer's profile this week, so the profile
-- tab has a number to show and the Plus list has faces in it.
insert into public.profile_views (profile_id, viewer_id, viewed_at) values
  ('11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000003', now() - interval '2 hours'),
  ('11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000004', now() - interval '1 day'),
  ('11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000005', now() - interval '3 days')
on conflict (profile_id, viewer_id) do update set viewed_at = excluded.viewed_at;

select private.materialise_plan_series(21);

commit;
