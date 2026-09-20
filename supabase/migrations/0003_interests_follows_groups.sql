-- Gooday — Interesses, grafo social (follows) e grupos

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_no_self check (follower_id <> following_id),
  constraint follows_unique unique (follower_id, following_id)
);

create index follows_follower_idx on public.follows (follower_id);
create index follows_following_idx on public.follows (following_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_url text,
  avatar_url text,
  privacy public.privacy not null default 'PUBLIC',
  parent_id uuid references public.groups(id) on delete set null,
  members_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index groups_parent_idx on public.groups (parent_id);

create trigger trg_groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create table public.group_interests (
  group_id uuid not null references public.groups(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  primary key (group_id, interest_id)
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.group_member_role not null default 'MEMBER',
  status public.group_member_status not null default 'ACTIVE',
  joined_at timestamptz not null default now(),
  constraint group_members_unique unique (group_id, user_id)
);

create index group_members_group_idx on public.group_members (group_id);
create index group_members_user_idx on public.group_members (user_id);
