-- Gooday — Extensions & Enum Types
-- Supabase já habilita pgcrypto (gen_random_uuid) e pgjwt por padrão no schema public/extensions.

create extension if not exists pgcrypto with schema extensions;

-- pg_cron pode não estar disponível em todos os projetos/planos — não deve travar a migration
do $$ begin
  create extension if not exists pg_cron with schema extensions;
exception when others then
  raise notice 'pg_cron indisponível — expire_stories() precisará ser chamada manualmente ou via Edge Function agendada.';
end $$;

do $$ begin
  create type public.privacy as enum ('PUBLIC', 'PRIVATE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.group_member_role as enum ('OWNER', 'ADMIN', 'MEMBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.group_member_status as enum ('ACTIVE', 'PENDING', 'BANNED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'FOLLOW', 'LIKE', 'COMMENT', 'MENTION',
    'GROUP_INVITE', 'GROUP_REQUEST', 'GROUP_ACCEPTED',
    'MESSAGE', 'STORY_REPLY', 'POST_SHARE'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_type as enum ('IMAGE', 'VIDEO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_audience as enum ('PUBLIC', 'FOLLOWERS', 'GROUP');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.story_status as enum ('ACTIVE', 'EXPIRED', 'DELETED');
exception when duplicate_object then null; end $$;

-- Trigger genérico para colunas updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
