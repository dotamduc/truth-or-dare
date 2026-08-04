-- Anonymous community reviews for Truth or Dare.
-- Anonymous visitors receive a Supabase Auth user silently in the browser.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
    check (char_length(btrim(display_name)) between 2 and 40),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  game_id text not null default 'truth-or-dare'
    check (game_id = 'truth-or-dare'),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (
    body is null
    or char_length(btrim(body)) between 10 and 1000
  ),
  locale text not null default 'vi' check (locale in ('vi', 'en')),
  status text not null default 'published'
    check (status in ('published', 'pending', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_review_per_user unique (game_id, user_id)
);

create index if not exists reviews_public_list_idx
  on public.reviews (game_id, status, created_at desc);
create index if not exists reviews_user_idx on public.reviews (user_id);

create or replace function public.anonymous_display_name(user_id uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'ẨnDanh_' || substring(replace(user_id::text, '-', '') from 1 for 8)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.profiles (id, display_name)
  values (
    new.id,
    case
      when new.is_anonymous then public.anonymous_display_name(new.id)
      when char_length(requested_name) between 2 and 40 then requested_name
      else public.anonymous_display_name(new.id)
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;

drop policy if exists profiles_public_read on public.profiles;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;
drop policy if exists reviews_public_or_owner_read on public.reviews;
drop policy if exists reviews_owner_insert on public.reviews;
drop policy if exists reviews_owner_update on public.reviews;
drop policy if exists reviews_owner_delete on public.reviews;

create policy profiles_public_read
on public.profiles for select
to anon, authenticated
using (true);

-- Repairs a missing trigger-created profile, but only with the enforced name.
create policy profiles_owner_insert
on public.profiles for insert
to authenticated
with check (
  id = (select auth.uid())
  and display_name = public.anonymous_display_name((select auth.uid()))
);

create policy reviews_public_or_owner_read
on public.reviews for select
to anon, authenticated
using (status = 'published' or user_id = (select auth.uid()));

create policy reviews_owner_insert
on public.reviews for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and game_id = 'truth-or-dare'
  and status = 'published'
);

create policy reviews_owner_update
on public.reviews for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy reviews_owner_delete
on public.reviews for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
revoke all on public.reviews from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert (id, display_name) on public.profiles to authenticated;

grant select on public.reviews to anon, authenticated;
grant insert (game_id, user_id, rating, body, locale)
  on public.reviews to authenticated;
grant update (rating, body, locale)
  on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

create or replace view public.review_summary
with (security_invoker = true)
as
select
  game_id,
  count(*)::bigint as review_count,
  round(avg(rating)::numeric, 2) as average_rating,
  count(*) filter (where rating = 5)::bigint as five_star_count,
  count(*) filter (where rating = 4)::bigint as four_star_count,
  count(*) filter (where rating = 3)::bigint as three_star_count,
  count(*) filter (where rating = 2)::bigint as two_star_count,
  count(*) filter (where rating = 1)::bigint as one_star_count
from public.reviews
where status = 'published'
group by game_id;

grant select on public.review_summary to anon, authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.anonymous_display_name(uuid) from public;
grant execute on function public.anonymous_display_name(uuid)
  to anon, authenticated;
