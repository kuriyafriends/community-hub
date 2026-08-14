-- KURIYA Friends: automatic public reference numbers
-- Run this after the original migration.sql in the Supabase SQL Editor.

-- One sequence per public content type. Gaps are harmless and expected.
create sequence if not exists public.ref_sell_seq start 120801;
create sequence if not exists public.ref_buy_seq start 120801;
create sequence if not exists public.ref_forum_seq start 120801;
create sequence if not exists public.ref_housing_seq start 120801;
create sequence if not exists public.ref_pet_seq start 120801;
create sequence if not exists public.ref_event_seq start 120801;
create sequence if not exists public.ref_children_seq start 120801;
create sequence if not exists public.ref_free_seq start 120801;
create sequence if not exists public.ref_other_seq start 120801;

alter table public.listings
  add column if not exists reference_code text;

alter table public.discussions
  add column if not exists reference_code text;

create unique index if not exists listings_reference_code_key
  on public.listings(reference_code)
  where reference_code is not null;

create unique index if not exists discussions_reference_code_key
  on public.discussions(reference_code)
  where reference_code is not null;

create or replace function public.classified_reference_prefix(category_name text)
returns text
language sql
immutable
as $$
  select case lower(trim(category_name))
    when 'for sale' then 'S'
    when 'wanted' then 'B'
    when 'free stuff wanted' then 'B'
    when 'for rent' then 'H'
    when 'for let' then 'H'
    when 'pet' then 'P'
    when 'pets' then 'P'
    when 'events' then 'E'
    when 'children' then 'C'
    when 'free stuff to give' then 'G'
    when 'free offer' then 'G'
    when 'services available' then 'O'
    when 'other services' then 'O'
    else 'O'
  end;
$$;

create or replace function public.next_classified_reference(prefix text)
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := case prefix
    when 'S' then nextval('public.ref_sell_seq')
    when 'B' then nextval('public.ref_buy_seq')
    when 'H' then nextval('public.ref_housing_seq')
    when 'P' then nextval('public.ref_pet_seq')
    when 'E' then nextval('public.ref_event_seq')
    when 'C' then nextval('public.ref_children_seq')
    when 'G' then nextval('public.ref_free_seq')
    else nextval('public.ref_other_seq')
  end;
  return prefix || n::text;
end;
$$;

create or replace function public.set_listing_reference()
returns trigger
language plpgsql
as $$
declare
  category_name text;
  prefix text;
begin
  if new.reference_code is null or btrim(new.reference_code) = '' then
    select name into category_name
    from public.categories
    where id = new.category_id;

    prefix := public.classified_reference_prefix(coalesce(category_name, ''));
    new.reference_code := public.next_classified_reference(prefix);
  end if;
  return new;
end;
$$;

drop trigger if exists listings_set_reference on public.listings;
create trigger listings_set_reference
  before insert on public.listings
  for each row execute function public.set_listing_reference();

create or replace function public.set_discussion_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference_code is null or btrim(new.reference_code) = '' then
    new.reference_code := 'F' || nextval('public.ref_forum_seq')::text;
  end if;
  return new;
end;
$$;

drop trigger if exists discussions_set_reference on public.discussions;
create trigger discussions_set_reference
  before insert on public.discussions
  for each row execute function public.set_discussion_reference();

-- Give the existing rows references as well. Existing rows receive numbers
-- in creation order within each public type.
with ranked as (
  select l.id,
         public.classified_reference_prefix(c.name) as prefix,
         row_number() over (
           partition by public.classified_reference_prefix(c.name)
           order by l.created_at, l.id
         ) as rn
  from public.listings l
  join public.categories c on c.id = l.category_id
  where l.reference_code is null
)
update public.listings l
set reference_code = r.prefix || (120800 + r.rn)::text
from ranked r
where l.id = r.id;

with ranked as (
  select id,
         row_number() over (order by created_at, id) as rn
  from public.discussions
  where reference_code is null
)
update public.discussions d
set reference_code = 'F' || (120800 + r.rn)::text
from ranked r
where d.id = r.id;

-- Move sequences forward so future automatically generated references cannot
-- collide with references assigned above.
select setval(
  'public.ref_sell_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'S%'), 120800))
);
select setval(
  'public.ref_buy_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'B%'), 120800))
);
select setval(
  'public.ref_housing_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'H%'), 120800))
);
select setval(
  'public.ref_pet_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'P%'), 120800))
);
select setval(
  'public.ref_event_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'E%'), 120800))
);
select setval(
  'public.ref_children_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'C%'), 120800))
);
select setval(
  'public.ref_free_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'G%'), 120800))
);
select setval(
  'public.ref_other_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.listings where reference_code like 'O%'), 120800))
);
select setval(
  'public.ref_forum_seq',
  greatest(120800, coalesce((select max(substring(reference_code from 2)::bigint) from public.discussions where reference_code like 'F%'), 120800))
);
