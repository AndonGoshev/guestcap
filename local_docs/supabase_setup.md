# Supabase Setup Instructions

## 1. Create Project
- Go to [Supabase](https://supabase.com) and sign in.
- Click **"New Project"**.
- Choose your organization, give it a name (e.g., `GuestCap`), set a password, and choose a region close to your users.
- Click **"Create new project"**.

## 2. Get API Keys & URL
- Once the project is ready, go to **Settings** (cog icon) > **API**.
- Copy the **Project URL**.
- Copy the **anon / public** key.
- *Note: You will need these for your environment variables.*

## 3. Database Schema
- Go to the **SQL Editor** (icon on the left).
- Click **"New Query"**.
- Paste and run the following SQL to set up the tables:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Events Table
create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  host_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Guests Table
create table guests (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Challenges Table
create table challenges (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Photos Table
create table photos (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade not null,
  guest_id uuid references guests(id) on delete cascade not null,
  challenge_id uuid references challenges(id) on delete set null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic)
alter table events enable row level security;
alter table guests enable row level security;
alter table challenges enable row level security;
alter table photos enable row level security;

-- Allow public read for now (adjust for production)
create policy "Public read photos" on photos for select using (true);
create policy "Guests can upload photos" on photos for insert with check (true);
create policy "Public read events" on events for select using (true);
create policy "Public read challenges" on challenges for select using (true);
```

## 4. Storage Setup
- Go to **Storage** (folder icon).
- Click **"New Bucket"**.
- Name it: `event-photos`.
- Toggle **"Public bucket"** to ON.
- Click **"Save"**.
- **Policies**: By default, you may need to add policies to allow upload.
    - Go to **Configuration** -> **Policies**.
    - Under `event-photos`, click **"New Policy"**.
    - Choose "For full customization".
    - Name: "Allow public uploads".
    - Allowed operations: SELECT, INSERT.
    - Target roles: `anon`, `authenticated`.
    - Click **"Review"** and **"Save"**.

## 5. Auth Setup (Later)
- For now, we will focus on the Guest flow which is anonymous (Name only).
- Host login will use Email/Password (enabled by default).
