-- KURIYA Friends page-design additions
-- Run after supabase/migration.sql

alter table public.listings
  add column if not exists reference_code text unique;

-- Category names used by the page design.
insert into public.categories (name, type, sort_order)
select 'Housing Offer', 'classified', 8
where not exists (select 1 from public.categories where name = 'Housing Offer' and type = 'classified');

insert into public.categories (name, type, sort_order)
select 'Housing Wanted', 'classified', 9
where not exists (select 1 from public.categories where name = 'Housing Wanted' and type = 'classified');

insert into public.categories (name, type, sort_order)
select 'Pet', 'classified', 10
where not exists (select 1 from public.categories where name = 'Pet' and type = 'classified');

insert into public.categories (name, type, sort_order)
select 'Children', 'classified', 11
where not exists (select 1 from public.categories where name = 'Children' and type = 'classified');

create or replace function public.make_listing_reference()
returns trigger as $$
declare
  prefix text;
  next_number integer;
begin
  if new.reference_code is not null then
    return new;
  end if;

  select case c.name
    when 'For Sale' then 'SEL'
    when 'Wanted' then 'BUY'
    when 'Free Stuff to Give' then 'FREE'
    when 'Housing Offer' then 'HOF'
    when 'Housing Wanted' then 'HWA'
    when 'Pet' then 'PET'
    when 'Children' then 'CHD'
    when 'Services Available' then 'SVC'
    when 'Events' then 'EVT'
    else 'POST'
  end
  into prefix
  from public.categories c
  where c.id = new.category_id;

  select count(*) + 1 into next_number
  from public.listings l
  where l.category_id = new.category_id;

  new.reference_code := prefix || '-' || lpad(next_number::text, 4, '0');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists listings_reference_code on public.listings;
create trigger listings_reference_code
  before insert on public.listings
  for each row execute function public.make_listing_reference();

-- Give older listings a reference code if this migration is run after data exists.
do $$
declare
  r record;
  prefix text;
  n integer;
begin
  for r in select l.id, l.category_id from public.listings l where l.reference_code is null order by l.created_at, l.id loop
    select case c.name
      when 'For Sale' then 'SEL'
      when 'Wanted' then 'BUY'
      when 'Free Stuff to Give' then 'FREE'
      when 'Housing Offer' then 'HOF'
      when 'Housing Wanted' then 'HWA'
      when 'Pet' then 'PET'
      when 'Children' then 'CHD'
      when 'Services Available' then 'SVC'
      when 'Events' then 'EVT'
      else 'POST'
    end into prefix from public.categories c where c.id = r.category_id;

    select count(*) + 1 into n
    from public.listings x
    where x.category_id = r.category_id and x.created_at <= (select created_at from public.listings where id = r.id) and x.id <> r.id;

    update public.listings set reference_code = prefix || '-' || lpad(n::text, 4, '0') where id = r.id;
  end loop;
end $$;
