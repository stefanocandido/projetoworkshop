-- Gooday — Sistema de admin com bypass total de RLS (via flag is_admin)
--
-- ⚠️ Esta versão é sanitizada para o repositório: a criação do usuário admin real
-- foi feita manualmente (fora desta migration) para não deixar senha em texto puro
-- no histórico do git. Rode a criação do usuário separadamente, substituindo
-- SEU_EMAIL_AQUI / SUA_SENHA_FORTE_AQUI, e nunca commite essa parte preenchida.

alter table public.profiles add column is_admin boolean not null default false;

create or replace function public.is_admin(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = p_user_id), false);
$$;

-- Policies de bypass total para admin em cada tabela (adicional às policies normais, não substitui)
create policy "admin_full_access" on public.profiles for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.interests for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.user_interests for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.follows for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.groups for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.group_interests for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.group_members for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.stories for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.media for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.posts for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.post_media for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.post_tags for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.post_mentions for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.group_posts for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.comments for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.likes for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.reactions for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.bookmarks for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.story_views for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.story_replies for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.conversations for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.conversation_participants for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.messages for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.notifications for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.user_settings for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.notification_preferences for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy "admin_full_access" on public.search_history for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

create policy "admin_full_access_storage" on storage.objects for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- Criação do usuário admin (rode manualmente, fora do controle de versão, com senha forte):
--
-- insert into auth.users (
--   instance_id, id, aud, role, email, encrypted_password,
--   email_confirmed_at, created_at, updated_at,
--   raw_app_meta_data, raw_user_meta_data, is_super_admin,
--   confirmation_token, recovery_token, email_change_token_new, email_change,
--   is_sso_user, is_anonymous
-- ) values (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(), 'authenticated', 'authenticated',
--   'SEU_EMAIL_AQUI',
--   crypt('SUA_SENHA_FORTE_AQUI', gen_salt('bf')),
--   now(), now(), now(),
--   '{"provider":"email","providers":["email"]}'::jsonb,
--   '{"name":"Nome","handle":"handle_unico"}'::jsonb,
--   false, '', '', '', '', false, false
-- );
--
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'SEU_EMAIL_AQUI');
