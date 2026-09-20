-- Gooday — Storage buckets para avatares, capas, posts, stories e mensagens
-- Convenção de path: {user_id}/{filename} — usada nas policies para checar dono.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('covers', 'covers', true, 8388608, array['image/png','image/jpeg','image/webp']),
  ('posts-media', 'posts-media', true, 20971520, array['image/png','image/jpeg','image/webp','video/mp4']),
  ('stories-media', 'stories-media', true, 20971520, array['image/png','image/jpeg','image/webp','video/mp4']),
  ('messages-media', 'messages-media', false, 20971520, array['image/png','image/jpeg','image/webp','video/mp4'])
on conflict (id) do nothing;

-- Leitura pública para buckets públicos
create policy "public_read_avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "public_read_covers" on storage.objects for select using (bucket_id = 'covers');
create policy "public_read_posts_media" on storage.objects for select using (bucket_id = 'posts-media');
create policy "public_read_stories_media" on storage.objects for select using (bucket_id = 'stories-media');

-- messages-media é privado: só participantes da conversa (path = {conversation_id}/{filename})
create policy "participants_read_messages_media" on storage.objects for select using (
  bucket_id = 'messages-media'
  and public.is_conversation_participant((storage.foldername(name))[1]::uuid, auth.uid())
);

-- Upload/update/delete: dono do próprio path ({auth.uid()}/{filename}) nos buckets de perfil/post/story
create policy "owner_write_avatars" on storage.objects for insert with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owner_update_avatars" on storage.objects for update using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owner_delete_avatars" on storage.objects for delete using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner_write_covers" on storage.objects for insert with check (
  bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owner_update_covers" on storage.objects for update using (
  bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owner_delete_covers" on storage.objects for delete using (
  bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner_write_posts_media" on storage.objects for insert with check (
  bucket_id = 'posts-media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owner_delete_posts_media" on storage.objects for delete using (
  bucket_id = 'posts-media' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner_write_stories_media" on storage.objects for insert with check (
  bucket_id = 'stories-media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "owner_delete_stories_media" on storage.objects for delete using (
  bucket_id = 'stories-media' and (storage.foldername(name))[1] = auth.uid()::text
);

-- messages-media: path = {conversation_id}/{filename}; só participante pode enviar
create policy "participants_write_messages_media" on storage.objects for insert with check (
  bucket_id = 'messages-media'
  and public.is_conversation_participant((storage.foldername(name))[1]::uuid, auth.uid())
);
