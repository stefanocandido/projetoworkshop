-- Gooday — Funções auxiliares usadas dentro das RLS policies

create or replace function public.is_following(p_follower uuid, p_following uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.follows
    where follower_id = p_follower and following_id = p_following
  );
$$;

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id and status = 'ACTIVE'
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
      and role in ('OWNER', 'ADMIN') and status = 'ACTIVE'
  );
$$;

create or replace function public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = p_user_id and left_at is null
  );
$$;

-- Visibilidade de post: PUBLIC sempre; FOLLOWERS exige ser o autor ou seguir o autor;
-- GROUP exige ser membro ativo do grupo em que o post foi publicado.
create or replace function public.can_view_post(p_post_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_post record;
  v_uid uuid := auth.uid();
begin
  select author_id, audience into v_post from public.posts where id = p_post_id and deleted_at is null;

  if v_post is null then
    return false;
  end if;

  if v_uid is not null and v_uid = v_post.author_id then
    return true;
  end if;

  if v_post.audience = 'PUBLIC' then
    return true;
  elsif v_post.audience = 'FOLLOWERS' then
    return v_uid is not null and public.is_following(v_uid, v_post.author_id);
  elsif v_post.audience = 'GROUP' then
    return v_uid is not null and exists (
      select 1 from public.group_posts gp
      where gp.post_id = p_post_id and public.is_group_member(gp.group_id, v_uid)
    );
  end if;

  return false;
end;
$$;

-- Visibilidade de story: autor, público (perfil não privado) ou seguidor de perfil privado
create or replace function public.can_view_story(p_story_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_author uuid;
  v_private boolean;
  v_uid uuid := auth.uid();
begin
  select s.author_id, p.is_private into v_author, v_private
  from public.stories s join public.profiles p on p.id = s.author_id
  where s.id = p_story_id;

  if v_author is null then
    return false;
  end if;

  if v_uid = v_author then
    return true;
  end if;

  if not v_private then
    return true;
  end if;

  return v_uid is not null and public.is_following(v_uid, v_author);
end;
$$;
