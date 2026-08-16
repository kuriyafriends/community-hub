-- Profile avatar storage for KURIYA Friends
insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

create policy "Profile avatars: authed upload"
  on storage.objects for insert
  with check (bucket_id = 'profile-avatars' and auth.uid() is not null);

create policy "Profile avatars: public read"
  on storage.objects for select
  using (bucket_id = 'profile-avatars');

create policy "Profile avatars: owner delete"
  on storage.objects for delete
  using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
