-- Gooday — Stories, Media e Posts

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  status public.story_status not null default 'ACTIVE',
  views_count integer not null default 0,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index stories_author_idx on public.stories (author_id);
create index stories_active_idx on public.stories (status, expires_at);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  url text not null,
  type public.media_type not null default 'IMAGE',
  mime_type text,
  width integer,
  height integer,
  duration integer,
  size_bytes integer,
  alt_text text,
  created_at timestamptz not null default now()
);

create index media_uploader_idx on public.media (uploader_id);
create index media_story_idx on public.media (story_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  audience public.post_audience not null default 'PUBLIC',
  location_name text,
  latitude double precision,
  longitude double precision,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  reactions_count integer not null default 0,
  bookmarks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index posts_author_idx on public.posts (author_id);
create index posts_created_idx on public.posts (created_at desc);

create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_media (
  post_id uuid not null references public.posts(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  "order" integer not null default 0,
  primary key (post_id, media_id)
);

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag text not null,
  primary key (post_id, tag)
);

create index post_tags_tag_idx on public.post_tags (tag);

create table public.post_mentions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  post_id uuid not null unique references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade
);

create index group_posts_group_idx on public.group_posts (group_id);
