-- Gooday — Hardening apontado pelo linter de segurança do Supabase:
-- 1) fixa search_path nas funções de trigger (evita search_path hijacking)
-- 2) revoga EXECUTE público das funções que só devem rodar como trigger interno
--    (não afeta o disparo dos triggers — isso não passa por checagem de EXECUTE)

alter function public.set_updated_at() set search_path = public;
alter function public.fn_adjust_post_likes_count() set search_path = public;
alter function public.fn_adjust_post_comments_count() set search_path = public;
alter function public.fn_adjust_post_reactions_count() set search_path = public;
alter function public.fn_adjust_post_bookmarks_count() set search_path = public;
alter function public.fn_adjust_follow_counts() set search_path = public;
alter function public.fn_adjust_group_members_count() set search_path = public;
alter function public.fn_adjust_post_author_posts_count() set search_path = public;
alter function public.fn_adjust_story_views_count() set search_path = public;
alter function public.expire_stories() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.fn_group_owner_on_create() from public, anon, authenticated;
revoke execute on function public.fn_notify_on_follow() from public, anon, authenticated;
revoke execute on function public.fn_notify_on_like() from public, anon, authenticated;
revoke execute on function public.fn_notify_on_comment() from public, anon, authenticated;
revoke execute on function public.fn_notify_on_post_mention() from public, anon, authenticated;
revoke execute on function public.fn_notify_on_group_member_change() from public, anon, authenticated;
revoke execute on function public.fn_notify_on_message() from public, anon, authenticated;
revoke execute on function public.fn_notify_on_story_reply() from public, anon, authenticated;
