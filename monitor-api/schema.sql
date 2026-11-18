create table if not exists rounds (
  id uuid primary key,
  multiplier numeric(12,2) not null check (multiplier >= 1),
  source varchar(40) not null default 'manual',
  occurred_at timestamptz not null default now()
);
create index if not exists rounds_occurred_at_idx on rounds(occurred_at desc);

create table if not exists jarvis_agent_events (
  id bigserial primary key,
  event varchar(40) not null,
  message varchar(500) not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists jarvis_agent_events_created_idx on jarvis_agent_events(created_at desc);
