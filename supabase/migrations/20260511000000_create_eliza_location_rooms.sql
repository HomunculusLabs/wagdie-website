-- Location-pin scoped public elizaOS rooms.
-- WAGDIE owns room identity, transcripts, and tick queue state; access is service-role only.

CREATE TABLE IF NOT EXISTS eliza_location_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL UNIQUE REFERENCES locations(id) ON DELETE CASCADE,
  official_room_id UUID NOT NULL UNIQUE,
  official_world_id UUID NOT NULL,
  official_user_id UUID NOT NULL,
  channel_id TEXT NOT NULL CHECK (btrim(channel_id) <> ''),
  tick_enabled BOOLEAN NOT NULL DEFAULT true,
  last_tick_at TIMESTAMPTZ,
  next_tick_at TIMESTAMPTZ,
  tick_count INTEGER NOT NULL DEFAULT 0 CHECK (tick_count >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, location_id)
);

CREATE TABLE IF NOT EXISTS eliza_location_room_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  location_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'owner', 'admin')),
  requested_by_wallet TEXT CHECK (
    requested_by_wallet IS NULL OR requested_by_wallet = lower(requested_by_wallet)
  ),
  requested_by_token_id INTEGER CHECK (
    requested_by_token_id IS NULL OR requested_by_token_id BETWEEN 0 AND 6666
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'skipped', 'failed', 'dead')
  ),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  selected_token_id INTEGER CHECK (
    selected_token_id IS NULL OR selected_token_id BETWEEN 0 AND 6666
  ),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_eliza_location_room_ticks_room_location
    FOREIGN KEY (room_id, location_id)
    REFERENCES eliza_location_rooms(id, location_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_eliza_location_room_ticks_lock_state CHECK (
    (status = 'processing' AND locked_at IS NOT NULL AND locked_by IS NOT NULL)
    OR status <> 'processing'
  ),
  CONSTRAINT chk_eliza_location_room_ticks_completion_state CHECK (
    (status IN ('completed', 'skipped', 'dead') AND completed_at IS NOT NULL)
    OR status IN ('pending', 'processing', 'failed')
  )
);

CREATE TABLE IF NOT EXISTS eliza_location_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  location_id TEXT NOT NULL,
  tick_id UUID REFERENCES eliza_location_room_ticks(id) ON DELETE SET NULL,
  sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
  author_kind TEXT NOT NULL CHECK (
    author_kind IN ('agent', 'system', 'wallet', 'admin', 'scheduler')
  ),
  token_id INTEGER CHECK (token_id IS NULL OR token_id BETWEEN 0 AND 6666),
  official_agent_id TEXT CHECK (
    official_agent_id IS NULL OR btrim(official_agent_id) <> ''
  ),
  author_name TEXT NOT NULL CHECK (btrim(author_name) <> ''),
  content TEXT NOT NULL CHECK (btrim(content) <> ''),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_eliza_location_room_messages_room_location
    FOREIGN KEY (room_id, location_id)
    REFERENCES eliza_location_rooms(id, location_id)
    ON DELETE CASCADE
);

COMMENT ON TABLE eliza_location_rooms IS 'One WAGDIE-owned public elizaOS room per map location.';
COMMENT ON COLUMN eliza_location_rooms.location_id IS 'Stable map location id from locations.id.';
COMMENT ON COLUMN eliza_location_rooms.official_room_id IS 'Deterministic hosted official ElizaOS room id derived from location_id.';
COMMENT ON COLUMN eliza_location_rooms.official_world_id IS 'Deterministic hosted official ElizaOS world id derived from location_id.';
COMMENT ON COLUMN eliza_location_rooms.official_user_id IS 'Deterministic hosted official ElizaOS service user id derived from location_id.';
COMMENT ON COLUMN eliza_location_rooms.channel_id IS 'WAGDIE-local channel key for official room metadata.';
COMMENT ON COLUMN eliza_location_rooms.tick_enabled IS 'Per-room scheduler gate; feature-level gate remains in app config.';

COMMENT ON TABLE eliza_location_room_ticks IS 'Queue and audit state for scheduled, owner, and admin room activity.';
COMMENT ON COLUMN eliza_location_room_ticks.requested_by_wallet IS 'Lowercased wallet that requested a manual tick; never exposed publicly.';
COMMENT ON COLUMN eliza_location_room_ticks.status IS 'Tick lifecycle: pending, processing, completed, skipped, failed, or dead.';
COMMENT ON COLUMN eliza_location_room_ticks.selected_token_id IS 'Speaker token selected during processing, if any.';

COMMENT ON TABLE eliza_location_room_messages IS 'Canonical room transcript rows; public APIs must return only public visibility rows.';
COMMENT ON COLUMN eliza_location_room_messages.sequence IS 'Monotonic transcript ordering key.';
COMMENT ON COLUMN eliza_location_room_messages.visibility IS 'public rows are transcript-visible; internal rows are service-only.';
COMMENT ON COLUMN eliza_location_room_messages.metadata IS 'Internal service metadata; public APIs should not expose raw internal fields.';

CREATE INDEX IF NOT EXISTS idx_eliza_location_rooms_tick_schedule
  ON eliza_location_rooms(tick_enabled, next_tick_at)
  WHERE tick_enabled = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eliza_location_room_ticks_one_active
  ON eliza_location_room_ticks(room_id)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_eliza_location_room_ticks_pending_claim
  ON eliza_location_room_ticks(status, next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_eliza_location_room_ticks_locked
  ON eliza_location_room_ticks(locked_at)
  WHERE locked_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eliza_location_room_ticks_room_created
  ON eliza_location_room_ticks(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eliza_location_room_messages_room_sequence
  ON eliza_location_room_messages(room_id, sequence DESC);

CREATE INDEX IF NOT EXISTS idx_eliza_location_room_messages_public_sequence
  ON eliza_location_room_messages(room_id, visibility, sequence DESC)
  WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_eliza_location_room_messages_tick
  ON eliza_location_room_messages(tick_id)
  WHERE tick_id IS NOT NULL;

ALTER TABLE eliza_location_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliza_location_room_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliza_location_room_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE eliza_location_rooms FROM anon, authenticated;
REVOKE ALL ON TABLE eliza_location_room_ticks FROM anon, authenticated;
REVOKE ALL ON TABLE eliza_location_room_messages FROM anon, authenticated;

GRANT ALL ON TABLE eliza_location_rooms TO service_role;
GRANT ALL ON TABLE eliza_location_room_ticks TO service_role;
GRANT ALL ON TABLE eliza_location_room_messages TO service_role;

DO $$
DECLARE
  message_sequence_name TEXT;
BEGIN
  message_sequence_name := pg_get_serial_sequence('eliza_location_room_messages', 'sequence');

  IF message_sequence_name IS NOT NULL THEN
    EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM anon, authenticated', message_sequence_name);
    EXECUTE format('GRANT ALL ON SEQUENCE %s TO service_role', message_sequence_name);
  END IF;
END $$;

DROP POLICY IF EXISTS service_role_all_eliza_location_rooms ON eliza_location_rooms;
CREATE POLICY service_role_all_eliza_location_rooms
  ON eliza_location_rooms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_eliza_location_room_ticks ON eliza_location_room_ticks;
CREATE POLICY service_role_all_eliza_location_room_ticks
  ON eliza_location_room_ticks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_eliza_location_room_messages ON eliza_location_room_messages;
CREATE POLICY service_role_all_eliza_location_room_messages
  ON eliza_location_room_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_eliza_location_rooms_updated_at ON eliza_location_rooms;
CREATE TRIGGER update_eliza_location_rooms_updated_at
  BEFORE UPDATE ON eliza_location_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eliza_location_room_ticks_updated_at ON eliza_location_room_ticks;
CREATE TRIGGER update_eliza_location_room_ticks_updated_at
  BEFORE UPDATE ON eliza_location_room_ticks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
