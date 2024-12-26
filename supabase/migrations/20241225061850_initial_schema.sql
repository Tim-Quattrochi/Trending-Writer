-- supabase/migrations/<timestamp>_initial_schema.sql

-- Table to store generated articles
create table articles (
  id bigint generated by default as identity primary key,
  topic text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table to track social media posts
create table social_media_posts (
  id bigint generated by default as identity primary key,
  article_id bigint references articles (id) on delete cascade not null,
  platform text not null, 
  post_id text,
  status text not null,
  scheduled_at timestamp with time zone,
  posted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table articles enable row level security;
alter table social_media_posts enable row level security;


-- Allow admin to perform all operations on articles
create policy "Admin can manage articles" on articles
  for all to service_role using (true) with check (true);

-- Allow admin to perform all operations on social media posts
create policy "Admin can manage social media posts" on social_media_posts
  for all to service_role using (true) with check (true);

  -- supabase/migrations/<timestamp>_create_users_table.sql

create table users (
    id uuid primary key references auth.users on delete cascade not null,
    email text unique not null,
    name text,
    is_admin boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for the users table
alter table users enable row level security;

-- RLS policy to allow users to read their own data
create policy "Users can read their own data" on users
    for select using (auth.uid() = id);

-- RLS policy to allow admin to perform all operations on users (adjust if needed)
create policy "Admin can manage users" on users
    for all to service_role using (true) with check (true);