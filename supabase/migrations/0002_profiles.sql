-- Gooday — Profiles (ligado a auth.users via Supabase Auth)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  handle text not null unique,
  avatar_url text,
  cover_url text,
  bio text,
  location text,
  website text,
  is_verified boolean not null default false,
  is_private boolean not null default false,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  posts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9_]{3,30}$')
);

create index profiles_handle_idx on public.profiles (handle);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria profile + settings + preferências automaticamente quando um usuário se registra via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_handle text;
begin
  v_handle := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));

  if v_handle is null or length(v_handle) < 3 then
    v_handle := 'user_' || substr(new.id::text, 1, 8);
  end if;

  -- garante unicidade caso o handle derivado já exista
  while exists (select 1 from public.profiles where handle = v_handle) loop
    v_handle := v_handle || floor(random() * 100)::int::text;
  end loop;

  insert into public.profiles (id, name, handle, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    v_handle,
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_settings (user_id) values (new.id);
  insert into public.notification_preferences (user_id) values (new.id);

  return new;
end;
$$;
