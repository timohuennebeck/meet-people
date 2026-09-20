-- Who looked at your profile.
--
-- "Veja quem quer te encontrar" on the paywall finally means something that
-- does not tax a host: everyone is told how many people looked this week, and
-- Plus is told who. It is the mechanic that sells in this category, and it
-- costs the other side nothing — a look is not a request.
--
-- One row per pair, not one per event. `viewed_at` is bumped on every visit,
-- so the table answers "how many people this week" and "who" and cannot grow
-- without bound. What it deliberately cannot answer is "how many times did Tom
-- look", which nobody should be shown.
--
-- No client reads or writes the table directly. The count and the list are
-- functions so the Plus gate is in exactly one place, and the write is a
-- function so a look at a blocked or half-finished profile is dropped rather
-- than refused — opening a profile must never produce an error.

create table public.profile_views (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id  uuid not null references public.profiles (id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (profile_id, viewer_id),
  constraint not_a_mirror check (viewer_id <> profile_id)
);

create index profile_views_recent_idx on public.profile_views (profile_id, viewed_at desc);

alter table public.profile_views enable row level security;
revoke all on public.profile_views from anon, authenticated;

-- Called when a profile opens. Silent on anything it should not record.
create function public.record_profile_view(profile uuid) returns void
  language plpgsql security definer set search_path = ''
  as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null or profile = me then
    return;
  end if;
  -- `public_profiles` already leaves out the deleted, the unfinished and the
  -- blocked; a look at any of those is not a look.
  if not exists (select 1 from public.public_profiles p where p.id = profile) then
    return;
  end if;

  insert into public.profile_views (profile_id, viewer_id)
  values (profile, me)
  on conflict (profile_id, viewer_id) do update set viewed_at = now();
end;
$$;

-- How many people looked inside the window. Free.
create function public.profile_view_count(days integer default 7) returns integer
  language sql stable security definer set search_path = ''
  as $$
  select count(*)::integer
  from public.profile_views v
  where v.profile_id = (select auth.uid())
    and v.viewed_at > now() - make_interval(days => days)
    and not private.is_blocked((select auth.uid()), v.viewer_id)
$$;

-- Who they were, newest first. Plus.
create function public.profile_viewers(days integer default 7)
returns table (viewer jsonb, viewed_at timestamptz)
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if not private.has_plus((select auth.uid())) then
    raise exception 'PLUS_REQUIRED' using errcode = 'insufficient_privilege';
  end if;

  return query
    select to_jsonb(p), v.viewed_at
    from public.profile_views v
    join public.public_profiles p on p.id = v.viewer_id
    where v.profile_id = (select auth.uid())
      and v.viewed_at > now() - make_interval(days => days)
    order by v.viewed_at desc;
end;
$$;

revoke all on function public.record_profile_view(uuid) from public, anon;
revoke all on function public.profile_view_count(integer) from public, anon;
revoke all on function public.profile_viewers(integer) from public, anon;
grant execute on function public.record_profile_view(uuid) to authenticated;
grant execute on function public.profile_view_count(integer) to authenticated;
grant execute on function public.profile_viewers(integer) to authenticated;
