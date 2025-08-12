-- Enable pgcrypto
create extension if not exists "pgcrypto";

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topic text not null default '',
  mode text not null check (mode in ('filter','prompt')) default 'filter',
  prompt text,
  model_provider text not null default 'openai',
  model text not null default 'gpt-4',
  freq text not null check (freq in ('hourly','daily')) default 'daily',
  timezone text default 'UTC',
  send_time time null,
  unsubscribe_token uuid not null default gen_random_uuid(),
  last_sent timestamptz null,
  created_at timestamptz not null default now()
);

-- Tasks: scheduled arbitrary prompts
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  name text not null,
  prompt text not null,
  model_provider text not null default 'openai',
  model text not null default 'gpt-4',
  cron_expr text not null,
  timezone text default 'UTC',
  channels jsonb default '["email"]',
  to_email text,
  to_whatsapp text,
  enabled boolean default true,
  last_run timestamptz null,
  created_at timestamptz not null default now()
);

-- Task run logs
create table if not exists public.task_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  run_at timestamptz not null default now(),
  status text,
  result text,
  error text
);

-- Indexes
create index if not exists idx_subscriptions_email_topic on public.subscriptions (email, topic);
create index if not exists idx_tasks_owner_email on public.tasks (owner_email);