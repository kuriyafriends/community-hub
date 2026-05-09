-- ============================================================
-- Community Platform – Full Schema + RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. Extensions
create extension if not exists "uuid-ossp";

-- 1. ENUM types
create type listing_status as enum ('active', 'sold', 'closed');
create type category_type  as enum ('classified', 'discussion');

-- 2. Tables

-- Profiles (auto-created on signup via trigger)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  display_name text not null default '',
  avatar_url  text,
  is_admin    boolean not null default false,
  is_banned   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Email whitelist
create table public.email_whitelist (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique not null,
  added_by   uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Categories
create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  type       category_type not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Listings (classifieds)
create table public.listings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  category_id  uuid not null references public.categories(id),
  title        text not null,
  description  text not null default '',
  price        text,
  location     text,
  contact_info text,
  status       listing_status not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Listing images
create table public.listing_images (
  id         uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url  text not null,
  sort_order int not null default 0
);

-- Listing comments
create table public.listing_comments (
  id         uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- Discussions
create table public.discussions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  title       text not null,
  body        text not null default '',
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Discussion comments
create table public.discussion_comments (
  id            uuid primary key default uuid_generate_v4(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  created_at    timestamptz not null default now()
);

-- 3. Indexes
create index idx_listings_category on public.listings(category_id);
create index idx_listings_status   on public.listings(status);
create index idx_listings_user     on public.listings(user_id);
create index idx_listing_images_listing on public.listing_images(listing_id);
create index idx_listing_comments_listing on public.listing_comments(listing_id);
create index idx_discussions_category on public.discussions(category_id);
create index idx_discussion_comments_discussion on public.discussion_comments(discussion_id);
create index idx_email_whitelist_email on public.email_whitelist(email);

-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Row Level Security

alter table public.profiles enable row level security;
alter table public.email_whitelist enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_comments enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_comments enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- Profiles
create policy "Profiles: anyone authed can view"       on public.profiles for select using (auth.uid() is not null);
create policy "Profiles: users update own"              on public.profiles for update using (auth.uid() = id);
create policy "Profiles: admin update any"              on public.profiles for update using (public.is_admin());

-- Email whitelist
create policy "Whitelist: admin full access"            on public.email_whitelist for all using (public.is_admin());
create policy "Whitelist: check own email on signup"    on public.email_whitelist for select using (true);

-- Categories
create policy "Categories: anyone authed can view"      on public.categories for select using (auth.uid() is not null);
create policy "Categories: admin manage"                on public.categories for all using (public.is_admin());

-- Listings
create policy "Listings: anyone authed can view"        on public.listings for select using (auth.uid() is not null);
create policy "Listings: authed users create"           on public.listings for insert with check (auth.uid() = user_id);
create policy "Listings: owner update"                  on public.listings for update using (auth.uid() = user_id);
create policy "Listings: owner delete"                  on public.listings for delete using (auth.uid() = user_id);
create policy "Listings: admin delete"                  on public.listings for delete using (public.is_admin());
create policy "Listings: admin update"                  on public.listings for update using (public.is_admin());

-- Listing images
create policy "Listing images: anyone authed can view"  on public.listing_images for select using (auth.uid() is not null);
create policy "Listing images: owner create"            on public.listing_images for insert with check (
  auth.uid() = (select user_id from public.listings where id = listing_id)
);
create policy "Listing images: owner delete"            on public.listing_images for delete using (
  auth.uid() = (select user_id from public.listings where id = listing_id)
);

-- Listing comments
create policy "Listing comments: anyone authed can view" on public.listing_comments for select using (auth.uid() is not null);
create policy "Listing comments: authed users create"    on public.listing_comments for insert with check (auth.uid() = user_id);
create policy "Listing comments: owner delete"           on public.listing_comments for delete using (auth.uid() = user_id);
create policy "Listing comments: admin delete"           on public.listing_comments for delete using (public.is_admin());

-- Discussions
create policy "Discussions: anyone authed can view"     on public.discussions for select using (auth.uid() is not null);
create policy "Discussions: authed users create"        on public.discussions for insert with check (auth.uid() = user_id);
create policy "Discussions: owner update"               on public.discussions for update using (auth.uid() = user_id);
create policy "Discussions: owner delete"               on public.discussions for delete using (auth.uid() = user_id);
create policy "Discussions: admin delete"               on public.discussions for delete using (public.is_admin());
create policy "Discussions: admin update"               on public.discussions for update using (public.is_admin());

-- Discussion comments
create policy "Discussion comments: anyone authed can view" on public.discussion_comments for select using (auth.uid() is not null);
create policy "Discussion comments: authed users create"    on public.discussion_comments for insert with check (auth.uid() = user_id);
create policy "Discussion comments: owner delete"           on public.discussion_comments for delete using (auth.uid() = user_id);
create policy "Discussion comments: admin delete"           on public.discussion_comments for delete using (public.is_admin());

-- 6. Seed default categories
insert into public.categories (name, type, sort_order) values
  ('Wanted',             'classified', 1),
  ('For Sale',           'classified', 2),
  ('Free Stuff to Give', 'classified', 3),
  ('Free Stuff Wanted',  'classified', 4),
  ('For Rent',           'classified', 5),
  ('For Let',            'classified', 6),
  ('Services Available', 'classified', 7),
  ('Events',             'classified', 8),
  ('General',            'discussion', 1),
  ('Help',               'discussion', 2),
  ('Off-topic',          'discussion', 3);

-- 7. Storage bucket for listing images
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true);

create policy "Listing images storage: authed upload"
  on storage.objects for insert
  with check (bucket_id = 'listing-images' and auth.uid() is not null);

create policy "Listing images storage: public read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "Listing images storage: owner delete"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);
