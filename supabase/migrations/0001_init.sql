-- Crumb v0.1 schema
-- Apply with: supabase migration up, or paste into Supabase SQL editor.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists creators (
  slug text primary key,
  name text not null,
  platform text not null check (platform in ('youtube','tiktok','instagram','reddit','web')),
  avatar_url text,
  url text,
  created_at timestamptz not null default now()
);

create table if not exists videos (
  id text primary key,
  url text not null unique,
  source_kind text not null check (source_kind in ('youtube','tiktok','reddit','article','maps_list','text_paste')),
  creator_slug text references creators(slug) on delete set null,
  title text,
  thumbnail_url text,
  published_at timestamptz,
  raw_transcript text,
  created_at timestamptz not null default now()
);
create index if not exists videos_creator_idx on videos(creator_slug);
create index if not exists videos_kind_idx on videos(source_kind);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_local text,
  name_normalized text not null,
  city text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  cuisine text,
  price_level smallint check (price_level between 1 and 4),
  places_id text,
  photo_name text,
  created_at timestamptz not null default now(),
  unique (name_normalized, city, country)
);
create index if not exists restaurants_country_idx on restaurants(country);
create index if not exists restaurants_city_idx on restaurants(city);
create index if not exists restaurants_places_idx on restaurants(places_id) where places_id is not null;
create index if not exists restaurants_name_trgm on restaurants using gin (name gin_trgm_ops);

create table if not exists mentions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  video_id text not null references videos(id) on delete cascade,
  dish text,
  quote text not null,
  timestamp_sec integer,
  anchor text,
  created_at timestamptz not null default now(),
  unique (restaurant_id, video_id)
);
create index if not exists mentions_restaurant_idx on mentions(restaurant_id);
create index if not exists mentions_video_idx on mentions(video_id);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  status text not null default 'queued' check (status in ('queued','fetching','extracting','geocoding','done','failed')),
  progress text,
  result_video_id text references videos(id) on delete set null,
  error text,
  user_ip inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists jobs_created_idx on jobs(created_at desc);

create table if not exists places_cache (
  query_key text primary key,
  places_id text,
  name text,
  formatted_address text,
  lat double precision,
  lng double precision,
  price_level smallint,
  photo_name text,
  cached_at timestamptz not null default now()
);
create index if not exists places_cache_age_idx on places_cache(cached_at);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists jobs_updated_at on jobs;
create trigger jobs_updated_at
  before update on jobs
  for each row
  execute function set_updated_at();

-- The service role needs explicit grants on these tables since auto-expose
-- is off in the Supabase settings. Service role bypasses RLS but still
-- needs table-level permissions.
grant all on table creators, videos, restaurants, mentions, jobs, places_cache to service_role;
grant usage, select on all sequences in schema public to service_role;
