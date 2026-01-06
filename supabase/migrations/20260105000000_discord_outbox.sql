-- Discord Outbox Table for Event Notifications
-- This table acts as a reliable outbox for Discord webhook notifications

create table if not exists discord_outbox (
  id uuid primary key default gen_random_uuid(),

  -- Event identification
  event_type text not null
    check (event_type in ('transfer', 'burn', 'travel', 'sear', 'concord_transfer')),
  source text not null default 'live'
    check (source in ('live', 'backfill')),
  chain_id integer not null,
  token_id integer not null,
  transaction_hash text not null,
  log_index integer not null,
  block_number bigint null,

  -- Event payload (event-type specific data)
  payload jsonb not null default '{}'::jsonb,

  -- Processing state
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'dead')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz null,
  locked_by text null,
  last_error text null,
  sent_at timestamptz null,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicate events (idempotency)
create unique index if not exists discord_outbox_uniq_event
  on discord_outbox (event_type, transaction_hash, log_index, token_id);

-- Query pending events efficiently
create index if not exists discord_outbox_pending_idx
  on discord_outbox (status, next_attempt_at, created_at)
  where status in ('pending', 'failed');

-- Find stale locks
create index if not exists discord_outbox_locked_idx
  on discord_outbox (locked_at)
  where locked_at is not null;

-- Lookup by transaction
create index if not exists discord_outbox_tx_idx
  on discord_outbox (transaction_hash);

-- Trigger to update updated_at
create or replace function update_discord_outbox_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists discord_outbox_updated_at on discord_outbox;
create trigger discord_outbox_updated_at
  before update on discord_outbox
  for each row
  execute function update_discord_outbox_updated_at();

-- RLS policies (service role only for indexers/notifier)
alter table discord_outbox enable row level security;

-- Allow service_role full access
create policy "Service role has full access to discord_outbox"
  on discord_outbox
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table discord_outbox is 'Outbox table for Discord webhook notifications from blockchain events';
comment on column discord_outbox.event_type is 'Type of event: transfer, burn, travel, sear, concord_transfer';
comment on column discord_outbox.source is 'Whether event came from backfill or live indexing';
comment on column discord_outbox.status is 'Processing status: pending, processing, sent, failed, dead';
comment on column discord_outbox.payload is 'Event-specific data as JSON';
