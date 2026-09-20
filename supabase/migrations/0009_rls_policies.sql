-- Gooday — Row Level Security: habilita em todas as tabelas + policies

alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.follows enable row level security;
alter table public.groups enable row level security;
alter table public.group_interests enable row level security;
alter table public.group_members enable row level security;
alter table public.stories enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_tags enable row level security;
alter table public.post_mentions enable row level security;
alter table public.group_posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.story_views enable row level security;
alter table public.story_replies enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.search_history enable row level security;

-- ── profiles ─────────────────────────────────────────────
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ── interests (catálogo público, somente leitura para clientes) ──
create policy "interests_select_all" on public.interests for select using (true);

-- ── user_interests ───────────────────────────────────────
create policy "user_interests_select_all" on public.user_interests for select using (true);
create policy "user_interests_insert_own" on public.user_interests for insert with check (auth.uid() = user_id);
create policy "user_interests_delete_own" on public.user_interests for delete using (auth.uid() = user_id);

-- ── follows ──────────────────────────────────────────────
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

-- ── groups ───────────────────────────────────────────────
create policy "groups_select_visible" on public.groups for select using (
  deleted_at is null and (
    privacy = 'PUBLIC' or public.is_group_member(id, auth.uid())
  )
);
create policy "groups_insert_authenticated" on public.groups for insert with check (auth.uid() is not null);
create policy "groups_update_admin" on public.groups for update using (public.is_group_admin(id, auth.uid()));
create policy "groups_delete_admin" on public.groups for delete using (public.is_group_admin(id, auth.uid()));

-- ── group_interests ──────────────────────────────────────
create policy "group_interests_select_all" on public.group_interests for select using (true);
create policy "group_interests_manage_admin" on public.group_interests for all
  using (public.is_group_admin(group_id, auth.uid()))
  with check (public.is_group_admin(group_id, auth.uid()));

-- ── group_members ────────────────────────────────────────
create policy "group_members_select_visible" on public.group_members for select using (
  exists (select 1 from public.groups g where g.id = group_id and g.privacy = 'PUBLIC')
  or public.is_group_member(group_id, auth.uid())
);
-- Auto-inserção só como MEMBER; status precisa bater com a privacidade do grupo
-- (ACTIVE só em grupo público, PENDING obrigatório em grupo privado — evita auto-aprovação).
-- OWNER é atribuído só pelo trigger trg_group_owner_on_create (security definer, ignora RLS);
-- promoções a ADMIN/OWNER passam por group_members_update_admin_or_self.
create policy "group_members_insert_self" on public.group_members for insert with check (
  auth.uid() = user_id
  and role = 'MEMBER'
  and (
    (status = 'ACTIVE' and exists (
      select 1 from public.groups g where g.id = group_id and g.privacy = 'PUBLIC'
    ))
    or
    (status = 'PENDING' and exists (
      select 1 from public.groups g where g.id = group_id and g.privacy = 'PRIVATE'
    ))
  )
);
-- Só admin/owner atualiza (aprovar PENDING, promover role, banir) — sem WITH CHECK aqui
-- um membro comum poderia reusar a própria condição USING para se auto-promover a OWNER.
-- Sair do grupo é DELETE (policy abaixo), não UPDATE.
create policy "group_members_update_admin" on public.group_members for update
  using (public.is_group_admin(group_id, auth.uid()))
  with check (public.is_group_admin(group_id, auth.uid()));
create policy "group_members_delete_admin_or_self" on public.group_members for delete using (
  public.is_group_admin(group_id, auth.uid()) or auth.uid() = user_id
);

-- ── stories ──────────────────────────────────────────────
create policy "stories_select_visible" on public.stories for select using (
  deleted_at is null and public.can_view_story(id)
);
create policy "stories_insert_own" on public.stories for insert with check (auth.uid() = author_id);
create policy "stories_update_own" on public.stories for update using (auth.uid() = author_id);
create policy "stories_delete_own" on public.stories for delete using (auth.uid() = author_id);

-- ── media ────────────────────────────────────────────────
create policy "media_select_all" on public.media for select using (true);
create policy "media_insert_own" on public.media for insert with check (auth.uid() = uploader_id);
create policy "media_update_own" on public.media for update using (auth.uid() = uploader_id);
create policy "media_delete_own" on public.media for delete using (auth.uid() = uploader_id);

-- ── posts ────────────────────────────────────────────────
create policy "posts_select_visible" on public.posts for select using (
  deleted_at is null and public.can_view_post(id)
);
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts_update_own" on public.posts for update using (auth.uid() = author_id);
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = author_id);

-- ── post_media / post_tags / post_mentions ──────────────
create policy "post_media_select_visible" on public.post_media for select using (public.can_view_post(post_id));
create policy "post_media_insert_own" on public.post_media for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);
create policy "post_media_delete_own" on public.post_media for delete using (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);

create policy "post_tags_select_visible" on public.post_tags for select using (public.can_view_post(post_id));
create policy "post_tags_insert_own" on public.post_tags for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);
create policy "post_tags_delete_own" on public.post_tags for delete using (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);

create policy "post_mentions_select_visible" on public.post_mentions for select using (public.can_view_post(post_id));
create policy "post_mentions_insert_own" on public.post_mentions for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);

-- ── group_posts ──────────────────────────────────────────
create policy "group_posts_select_visible" on public.group_posts for select using (
  public.is_group_member(group_id, auth.uid())
  or exists (select 1 from public.groups g where g.id = group_id and g.privacy = 'PUBLIC')
);
create policy "group_posts_insert_member" on public.group_posts for insert with check (
  auth.uid() = author_id and public.is_group_member(group_id, auth.uid())
);
create policy "group_posts_delete_own_or_admin" on public.group_posts for delete using (
  auth.uid() = author_id or public.is_group_admin(group_id, auth.uid())
);

-- ── comments ─────────────────────────────────────────────
create policy "comments_select_visible" on public.comments for select using (
  deleted_at is null and public.can_view_post(post_id)
);
create policy "comments_insert_can_view_post" on public.comments for insert with check (
  auth.uid() = author_id and public.can_view_post(post_id)
);
create policy "comments_update_own" on public.comments for update using (auth.uid() = author_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = author_id);

-- ── likes ────────────────────────────────────────────────
create policy "likes_select_visible" on public.likes for select using (
  (post_id is not null and public.can_view_post(post_id))
  or (comment_id is not null and exists (
    select 1 from public.comments c where c.id = comment_id and public.can_view_post(c.post_id)
  ))
);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

-- ── reactions ────────────────────────────────────────────
create policy "reactions_select_visible" on public.reactions for select using (public.can_view_post(post_id));
create policy "reactions_insert_own" on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions_delete_own" on public.reactions for delete using (auth.uid() = user_id);

-- ── bookmarks (privado ao usuário) ───────────────────────
create policy "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks for delete using (auth.uid() = user_id);

-- ── story_views ──────────────────────────────────────────
create policy "story_views_select_own_or_author" on public.story_views for select using (
  auth.uid() = viewer_id
  or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
);
create policy "story_views_insert_own" on public.story_views for insert with check (auth.uid() = viewer_id);

-- ── story_replies ────────────────────────────────────────
create policy "story_replies_select_participant" on public.story_replies for select using (
  auth.uid() = sender_id
  or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
);
create policy "story_replies_insert_can_view" on public.story_replies for insert with check (
  auth.uid() = sender_id and public.can_view_story(story_id)
);

-- ── conversations ────────────────────────────────────────
create policy "conversations_select_participant" on public.conversations for select using (
  public.is_conversation_participant(id, auth.uid())
);
create policy "conversations_insert_authenticated" on public.conversations for insert with check (auth.uid() is not null);
create policy "conversations_update_participant" on public.conversations for update using (
  public.is_conversation_participant(id, auth.uid())
);

-- ── conversation_participants ────────────────────────────
create policy "conversation_participants_select_participant" on public.conversation_participants for select using (
  auth.uid() = user_id or public.is_conversation_participant(conversation_id, auth.uid())
);
create policy "conversation_participants_insert_self_or_member" on public.conversation_participants for insert with check (
  auth.uid() = user_id or public.is_conversation_participant(conversation_id, auth.uid())
);
create policy "conversation_participants_update_own" on public.conversation_participants for update using (auth.uid() = user_id);
create policy "conversation_participants_delete_own" on public.conversation_participants for delete using (auth.uid() = user_id);

-- ── messages ─────────────────────────────────────────────
create policy "messages_select_participant" on public.messages for select using (
  public.is_conversation_participant(conversation_id, auth.uid())
);
create policy "messages_insert_participant" on public.messages for insert with check (
  auth.uid() = sender_id and public.is_conversation_participant(conversation_id, auth.uid())
);
create policy "messages_update_own" on public.messages for update using (auth.uid() = sender_id);
create policy "messages_delete_own" on public.messages for delete using (auth.uid() = sender_id);

-- ── notifications (inserts só via trigger SECURITY DEFINER) ──
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = recipient_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = recipient_id);
create policy "notifications_delete_own" on public.notifications for delete using (auth.uid() = recipient_id);

-- ── user_settings ────────────────────────────────────────
create policy "user_settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings for update using (auth.uid() = user_id);

-- ── notification_preferences ─────────────────────────────
create policy "notification_prefs_select_own" on public.notification_preferences for select using (auth.uid() = user_id);
create policy "notification_prefs_insert_own" on public.notification_preferences for insert with check (auth.uid() = user_id);
create policy "notification_prefs_update_own" on public.notification_preferences for update using (auth.uid() = user_id);

-- ── search_history ───────────────────────────────────────
create policy "search_history_select_own" on public.search_history for select using (auth.uid() = user_id);
create policy "search_history_insert_own" on public.search_history for insert with check (auth.uid() = user_id);
create policy "search_history_delete_own" on public.search_history for delete using (auth.uid() = user_id);
