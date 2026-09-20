-- Gooday — Contadores em cache (performance do feed) e notificações automáticas

-- Quem cria um grupo vira OWNER automaticamente (sem isso, ninguém consegue administrar
-- o grupo depois, já que group_members ficaria vazio).
create or replace function public.fn_group_owner_on_create()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, role, status)
  values (new.id, auth.uid(), 'OWNER', 'ACTIVE');
  return new;
end;
$$;

create trigger trg_group_owner_on_create
  after insert on public.groups
  for each row execute function public.fn_group_owner_on_create();

-- ── Contadores ──────────────────────────────────────────────

create or replace function public.fn_adjust_post_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.post_id is not null then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' and old.post_id is not null then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_likes_post_count
  after insert or delete on public.likes
  for each row execute function public.fn_adjust_post_likes_count();

create or replace function public.fn_adjust_post_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_comments_post_count
  after insert or delete on public.comments
  for each row execute function public.fn_adjust_post_comments_count();

create or replace function public.fn_adjust_post_reactions_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set reactions_count = reactions_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set reactions_count = greatest(reactions_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_reactions_post_count
  after insert or delete on public.reactions
  for each row execute function public.fn_adjust_post_reactions_count();

create or replace function public.fn_adjust_post_bookmarks_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set bookmarks_count = bookmarks_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set bookmarks_count = greatest(bookmarks_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_bookmarks_post_count
  after insert or delete on public.bookmarks
  for each row execute function public.fn_adjust_post_bookmarks_count();

create or replace function public.fn_adjust_follow_counts()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_follows_counts
  after insert or delete on public.follows
  for each row execute function public.fn_adjust_follow_counts();

create or replace function public.fn_adjust_group_members_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.status = 'ACTIVE' then
    update public.groups set members_count = members_count + 1 where id = new.group_id;
  elsif tg_op = 'DELETE' and old.status = 'ACTIVE' then
    update public.groups set members_count = greatest(members_count - 1, 0) where id = old.group_id;
  elsif tg_op = 'UPDATE' and old.status <> new.status then
    if new.status = 'ACTIVE' then
      update public.groups set members_count = members_count + 1 where id = new.group_id;
    elsif old.status = 'ACTIVE' then
      update public.groups set members_count = greatest(members_count - 1, 0) where id = new.group_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_group_members_count
  after insert or update or delete on public.group_members
  for each row execute function public.fn_adjust_group_members_count();

create or replace function public.fn_adjust_post_author_posts_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set posts_count = posts_count + 1 where id = new.author_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set posts_count = greatest(posts_count - 1, 0) where id = old.author_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_posts_author_count
  after insert or delete on public.posts
  for each row execute function public.fn_adjust_post_author_posts_count();

create or replace function public.fn_adjust_story_views_count()
returns trigger language plpgsql as $$
begin
  update public.stories set views_count = views_count + 1 where id = new.story_id;
  return new;
end;
$$;

create trigger trg_story_views_count
  after insert on public.story_views
  for each row execute function public.fn_adjust_story_views_count();

-- ── Notificações automáticas ────────────────────────────────

create or replace function public.fn_notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, 'FOLLOW');
  return new;
end;
$$;

create trigger trg_notify_follow
  after insert on public.follows
  for each row execute function public.fn_notify_on_follow();

create or replace function public.fn_notify_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_post_author uuid;
begin
  if new.post_id is not null then
    select author_id into v_post_author from public.posts where id = new.post_id;
    if v_post_author is not null and v_post_author <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, post_id)
      values (v_post_author, new.user_id, 'LIKE', new.post_id);
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_notify_like
  after insert on public.likes
  for each row execute function public.fn_notify_on_like();

create or replace function public.fn_notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_post_author uuid;
begin
  select author_id into v_post_author from public.posts where id = new.post_id;
  if v_post_author is not null and v_post_author <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
    values (v_post_author, new.author_id, 'COMMENT', new.post_id, new.id);
  end if;

  if new.parent_id is not null then
    declare v_parent_author uuid;
    begin
      select author_id into v_parent_author from public.comments where id = new.parent_id;
      if v_parent_author is not null and v_parent_author not in (new.author_id, coalesce(v_post_author, '00000000-0000-0000-0000-000000000000'::uuid)) then
        insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
        values (v_parent_author, new.author_id, 'COMMENT', new.post_id, new.id);
      end if;
    end;
  end if;

  return new;
end;
$$;

create trigger trg_notify_comment
  after insert on public.comments
  for each row execute function public.fn_notify_on_comment();

create or replace function public.fn_notify_on_post_mention()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, post_id)
  select new.user_id, p.author_id, 'MENTION', new.post_id
  from public.posts p where p.id = new.post_id and p.author_id <> new.user_id;
  return new;
end;
$$;

create trigger trg_notify_post_mention
  after insert on public.post_mentions
  for each row execute function public.fn_notify_on_post_mention();

create or replace function public.fn_notify_on_group_member_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.status = 'PENDING' then
    insert into public.notifications (recipient_id, actor_id, type, group_id)
    select gm.user_id, new.user_id, 'GROUP_REQUEST', new.group_id
    from public.group_members gm
    where gm.group_id = new.group_id and gm.role in ('OWNER', 'ADMIN') and gm.status = 'ACTIVE';
  elsif tg_op = 'UPDATE' and old.status = 'PENDING' and new.status = 'ACTIVE' then
    insert into public.notifications (recipient_id, type, group_id)
    values (new.user_id, 'GROUP_ACCEPTED', new.group_id);
  end if;
  return new;
end;
$$;

create trigger trg_notify_group_member_change
  after insert or update on public.group_members
  for each row execute function public.fn_notify_on_group_member_change();

create or replace function public.fn_notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  select cp.user_id, new.sender_id, 'MESSAGE'
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id
    and cp.user_id <> new.sender_id
    and cp.left_at is null;
  return new;
end;
$$;

create trigger trg_notify_message
  after insert on public.messages
  for each row execute function public.fn_notify_on_message();

create or replace function public.fn_notify_on_story_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_author uuid;
begin
  select author_id into v_author from public.stories where id = new.story_id;
  if v_author is not null and v_author <> new.sender_id then
    insert into public.notifications (recipient_id, actor_id, type)
    values (v_author, new.sender_id, 'STORY_REPLY');
  end if;
  return new;
end;
$$;

create trigger trg_notify_story_reply
  after insert on public.story_replies
  for each row execute function public.fn_notify_on_story_reply();

-- ── Manutenção: expira stories com mais de 24h ──────────────

create or replace function public.expire_stories()
returns void language sql as $$
  update public.stories
  set status = 'EXPIRED'
  where status = 'ACTIVE' and expires_at < now();
$$;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'expire-stories-hourly') then
    perform cron.schedule(
      'expire-stories-hourly',
      '0 * * * *',
      $cron$select public.expire_stories();$cron$
    );
  end if;
exception when others then
  raise notice 'pg_cron indisponível neste projeto — rode public.expire_stories() manualmente ou via Edge Function agendada.';
end $$;
