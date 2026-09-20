-- Gooday — Performance: (select auth.uid()) evita reavaliação por linha nas RLS policies,
-- remove policy permissiva duplicada em group_interests, e cobre FKs sem índice.

-- ── profiles ─────────────────────────────────────────────
drop policy "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check ((select auth.uid()) = id);
drop policy "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = id);

-- ── user_interests ───────────────────────────────────────
drop policy "user_interests_insert_own" on public.user_interests;
create policy "user_interests_insert_own" on public.user_interests for insert with check ((select auth.uid()) = user_id);
drop policy "user_interests_delete_own" on public.user_interests;
create policy "user_interests_delete_own" on public.user_interests for delete using ((select auth.uid()) = user_id);

-- ── follows ──────────────────────────────────────────────
drop policy "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows for insert with check ((select auth.uid()) = follower_id);
drop policy "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows for delete using ((select auth.uid()) = follower_id);

-- ── groups ───────────────────────────────────────────────
drop policy "groups_select_visible" on public.groups;
create policy "groups_select_visible" on public.groups for select using (
  deleted_at is null and (privacy = 'PUBLIC' or public.is_group_member(id, (select auth.uid())))
);
drop policy "groups_insert_authenticated" on public.groups;
create policy "groups_insert_authenticated" on public.groups for insert with check ((select auth.uid()) is not null);
drop policy "groups_update_admin" on public.groups;
create policy "groups_update_admin" on public.groups for update using (public.is_group_admin(id, (select auth.uid())));
drop policy "groups_delete_admin" on public.groups;
create policy "groups_delete_admin" on public.groups for delete using (public.is_group_admin(id, (select auth.uid())));

-- ── group_interests: substitui "for all" (sobrepunha SELECT) por policies específicas ──
drop policy "group_interests_manage_admin" on public.group_interests;
create policy "group_interests_insert_admin" on public.group_interests for insert with check (public.is_group_admin(group_id, (select auth.uid())));
create policy "group_interests_update_admin" on public.group_interests for update using (public.is_group_admin(group_id, (select auth.uid())));
create policy "group_interests_delete_admin" on public.group_interests for delete using (public.is_group_admin(group_id, (select auth.uid())));

-- ── group_members ────────────────────────────────────────
drop policy "group_members_select_visible" on public.group_members;
create policy "group_members_select_visible" on public.group_members for select using (
  exists (select 1 from public.groups g where g.id = group_id and g.privacy = 'PUBLIC')
  or public.is_group_member(group_id, (select auth.uid()))
);
drop policy "group_members_insert_self" on public.group_members;
create policy "group_members_insert_self" on public.group_members for insert with check (
  (select auth.uid()) = user_id
  and role = 'MEMBER'
  and (
    (status = 'ACTIVE' and exists (select 1 from public.groups g where g.id = group_id and g.privacy = 'PUBLIC'))
    or
    (status = 'PENDING' and exists (select 1 from public.groups g where g.id = group_id and g.privacy = 'PRIVATE'))
  )
);
drop policy "group_members_update_admin" on public.group_members;
create policy "group_members_update_admin" on public.group_members for update
  using (public.is_group_admin(group_id, (select auth.uid())))
  with check (public.is_group_admin(group_id, (select auth.uid())));
drop policy "group_members_delete_admin_or_self" on public.group_members;
create policy "group_members_delete_admin_or_self" on public.group_members for delete using (
  public.is_group_admin(group_id, (select auth.uid())) or (select auth.uid()) = user_id
);

-- ── stories ──────────────────────────────────────────────
drop policy "stories_insert_own" on public.stories;
create policy "stories_insert_own" on public.stories for insert with check ((select auth.uid()) = author_id);
drop policy "stories_update_own" on public.stories;
create policy "stories_update_own" on public.stories for update using ((select auth.uid()) = author_id);
drop policy "stories_delete_own" on public.stories;
create policy "stories_delete_own" on public.stories for delete using ((select auth.uid()) = author_id);

-- ── media ────────────────────────────────────────────────
drop policy "media_insert_own" on public.media;
create policy "media_insert_own" on public.media for insert with check ((select auth.uid()) = uploader_id);
drop policy "media_update_own" on public.media;
create policy "media_update_own" on public.media for update using ((select auth.uid()) = uploader_id);
drop policy "media_delete_own" on public.media;
create policy "media_delete_own" on public.media for delete using ((select auth.uid()) = uploader_id);

-- ── posts ────────────────────────────────────────────────
drop policy "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check ((select auth.uid()) = author_id);
drop policy "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update using ((select auth.uid()) = author_id);
drop policy "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete using ((select auth.uid()) = author_id);

-- ── post_media / post_tags / post_mentions ──────────────
drop policy "post_media_insert_own" on public.post_media;
create policy "post_media_insert_own" on public.post_media for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
);
drop policy "post_media_delete_own" on public.post_media;
create policy "post_media_delete_own" on public.post_media for delete using (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
);

drop policy "post_tags_insert_own" on public.post_tags;
create policy "post_tags_insert_own" on public.post_tags for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
);
drop policy "post_tags_delete_own" on public.post_tags;
create policy "post_tags_delete_own" on public.post_tags for delete using (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
);

drop policy "post_mentions_insert_own" on public.post_mentions;
create policy "post_mentions_insert_own" on public.post_mentions for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
);

-- ── group_posts ──────────────────────────────────────────
drop policy "group_posts_select_visible" on public.group_posts;
create policy "group_posts_select_visible" on public.group_posts for select using (
  public.is_group_member(group_id, (select auth.uid()))
  or exists (select 1 from public.groups g where g.id = group_id and g.privacy = 'PUBLIC')
);
drop policy "group_posts_insert_member" on public.group_posts;
create policy "group_posts_insert_member" on public.group_posts for insert with check (
  (select auth.uid()) = author_id and public.is_group_member(group_id, (select auth.uid()))
);
drop policy "group_posts_delete_own_or_admin" on public.group_posts;
create policy "group_posts_delete_own_or_admin" on public.group_posts for delete using (
  (select auth.uid()) = author_id or public.is_group_admin(group_id, (select auth.uid()))
);

-- ── comments ─────────────────────────────────────────────
drop policy "comments_insert_can_view_post" on public.comments;
create policy "comments_insert_can_view_post" on public.comments for insert with check (
  (select auth.uid()) = author_id and public.can_view_post(post_id)
);
drop policy "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update using ((select auth.uid()) = author_id);
drop policy "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete using ((select auth.uid()) = author_id);

-- ── likes / reactions / bookmarks ────────────────────────
drop policy "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes for insert with check ((select auth.uid()) = user_id);
drop policy "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes for delete using ((select auth.uid()) = user_id);

drop policy "reactions_insert_own" on public.reactions;
create policy "reactions_insert_own" on public.reactions for insert with check ((select auth.uid()) = user_id);
drop policy "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own" on public.reactions for delete using ((select auth.uid()) = user_id);

drop policy "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own" on public.bookmarks for select using ((select auth.uid()) = user_id);
drop policy "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own" on public.bookmarks for insert with check ((select auth.uid()) = user_id);
drop policy "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own" on public.bookmarks for delete using ((select auth.uid()) = user_id);

-- ── story_views / story_replies ──────────────────────────
drop policy "story_views_select_own_or_author" on public.story_views;
create policy "story_views_select_own_or_author" on public.story_views for select using (
  (select auth.uid()) = viewer_id
  or exists (select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid()))
);
drop policy "story_views_insert_own" on public.story_views;
create policy "story_views_insert_own" on public.story_views for insert with check ((select auth.uid()) = viewer_id);

drop policy "story_replies_select_participant" on public.story_replies;
create policy "story_replies_select_participant" on public.story_replies for select using (
  (select auth.uid()) = sender_id
  or exists (select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid()))
);
drop policy "story_replies_insert_can_view" on public.story_replies;
create policy "story_replies_insert_can_view" on public.story_replies for insert with check (
  (select auth.uid()) = sender_id and public.can_view_story(story_id)
);

-- ── conversations / conversation_participants / messages ──
drop policy "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations for select using (
  public.is_conversation_participant(id, (select auth.uid()))
);
drop policy "conversations_insert_authenticated" on public.conversations;
create policy "conversations_insert_authenticated" on public.conversations for insert with check ((select auth.uid()) is not null);
drop policy "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant" on public.conversations for update using (
  public.is_conversation_participant(id, (select auth.uid()))
);

drop policy "conversation_participants_select_participant" on public.conversation_participants;
create policy "conversation_participants_select_participant" on public.conversation_participants for select using (
  (select auth.uid()) = user_id or public.is_conversation_participant(conversation_id, (select auth.uid()))
);
drop policy "conversation_participants_insert_self_or_member" on public.conversation_participants;
create policy "conversation_participants_insert_self_or_member" on public.conversation_participants for insert with check (
  (select auth.uid()) = user_id or public.is_conversation_participant(conversation_id, (select auth.uid()))
);
drop policy "conversation_participants_update_own" on public.conversation_participants;
create policy "conversation_participants_update_own" on public.conversation_participants for update using ((select auth.uid()) = user_id);
drop policy "conversation_participants_delete_own" on public.conversation_participants;
create policy "conversation_participants_delete_own" on public.conversation_participants for delete using ((select auth.uid()) = user_id);

drop policy "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages for select using (
  public.is_conversation_participant(conversation_id, (select auth.uid()))
);
drop policy "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages for insert with check (
  (select auth.uid()) = sender_id and public.is_conversation_participant(conversation_id, (select auth.uid()))
);
drop policy "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages for update using ((select auth.uid()) = sender_id);
drop policy "messages_delete_own" on public.messages;
create policy "messages_delete_own" on public.messages for delete using ((select auth.uid()) = sender_id);

-- ── notifications / user_settings / notification_preferences / search_history ──
drop policy "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using ((select auth.uid()) = recipient_id);
drop policy "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update using ((select auth.uid()) = recipient_id);
drop policy "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications for delete using ((select auth.uid()) = recipient_id);

drop policy "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings for select using ((select auth.uid()) = user_id);
drop policy "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings for insert with check ((select auth.uid()) = user_id);
drop policy "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings for update using ((select auth.uid()) = user_id);

drop policy "notification_prefs_select_own" on public.notification_preferences;
create policy "notification_prefs_select_own" on public.notification_preferences for select using ((select auth.uid()) = user_id);
drop policy "notification_prefs_insert_own" on public.notification_preferences;
create policy "notification_prefs_insert_own" on public.notification_preferences for insert with check ((select auth.uid()) = user_id);
drop policy "notification_prefs_update_own" on public.notification_preferences;
create policy "notification_prefs_update_own" on public.notification_preferences for update using ((select auth.uid()) = user_id);

drop policy "search_history_select_own" on public.search_history;
create policy "search_history_select_own" on public.search_history for select using ((select auth.uid()) = user_id);
drop policy "search_history_insert_own" on public.search_history;
create policy "search_history_insert_own" on public.search_history for insert with check ((select auth.uid()) = user_id);
drop policy "search_history_delete_own" on public.search_history;
create policy "search_history_delete_own" on public.search_history for delete using ((select auth.uid()) = user_id);

-- ── Índices de FK faltantes (achados pelo advisor de performance) ──
create index bookmarks_post_id_idx on public.bookmarks (post_id);
create index comments_author_id_idx on public.comments (author_id);
create index group_interests_interest_id_idx on public.group_interests (interest_id);
create index group_posts_author_id_idx on public.group_posts (author_id);
create index likes_comment_id_idx on public.likes (comment_id);
create index likes_post_id_idx on public.likes (post_id);
create index messages_sender_id_idx on public.messages (sender_id);
create index notifications_actor_id_idx on public.notifications (actor_id);
create index notifications_comment_id_idx on public.notifications (comment_id);
create index notifications_group_id_idx on public.notifications (group_id);
create index notifications_post_id_idx on public.notifications (post_id);
create index post_media_media_id_idx on public.post_media (media_id);
create index post_mentions_user_id_idx on public.post_mentions (user_id);
create index reactions_post_id_idx on public.reactions (post_id);
create index story_replies_sender_id_idx on public.story_replies (sender_id);
create index story_views_viewer_id_idx on public.story_views (viewer_id);
create index user_interests_interest_id_idx on public.user_interests (interest_id);
