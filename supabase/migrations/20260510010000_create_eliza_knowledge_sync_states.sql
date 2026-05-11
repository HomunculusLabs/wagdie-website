-- Tracks WAGDIE canonical knowledge documents indexed into hosted official ElizaOS memory.
-- WAGDIE remains canonical for document filename/content/list/get/export.

CREATE TABLE IF NOT EXISTS eliza_knowledge_sync_states (
  token_id TEXT NOT NULL CHECK (
    token_id ~ '^[0-9]+$'
    AND token_id::INTEGER BETWEEN 0 AND 6666
  ),
  document_id TEXT NOT NULL,
  official_agent_id TEXT,
  official_memory_id TEXT,
  content_hash TEXT,
  source_pointer JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'indexed', 'deleted', 'error')),
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (token_id, document_id)
);

COMMENT ON TABLE eliza_knowledge_sync_states IS 'Official ElizaOS memory indexing state for WAGDIE canonical knowledge documents.';
COMMENT ON COLUMN eliza_knowledge_sync_states.token_id IS 'WAGDIE character token id stored as text to match Eliza externalId usage.';
COMMENT ON COLUMN eliza_knowledge_sync_states.document_id IS 'WAGDIE canonical knowledge document id.';
COMMENT ON COLUMN eliza_knowledge_sync_states.official_agent_id IS 'Hosted official ElizaOS agent id used when indexing the document.';
COMMENT ON COLUMN eliza_knowledge_sync_states.official_memory_id IS 'Hosted official ElizaOS memory id returned by the WAGDIE ingestion route.';
COMMENT ON COLUMN eliza_knowledge_sync_states.content_hash IS 'SHA-256 hash of canonical WAGDIE document content at last sync attempt.';
COMMENT ON COLUMN eliza_knowledge_sync_states.source_pointer IS 'Durable WAGDIE source pointer payload sent to ElizaOS memory metadata.';
COMMENT ON COLUMN eliza_knowledge_sync_states.status IS 'Last official knowledge sync result for this document.';
COMMENT ON COLUMN eliza_knowledge_sync_states.last_error IS 'Last official knowledge sync error, route-safe and non-secret.';

CREATE INDEX IF NOT EXISTS idx_eliza_knowledge_sync_states_agent_status
  ON eliza_knowledge_sync_states(official_agent_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_eliza_knowledge_sync_states_status_updated
  ON eliza_knowledge_sync_states(status, updated_at DESC);

ALTER TABLE eliza_knowledge_sync_states ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE eliza_knowledge_sync_states FROM anon, authenticated;
GRANT ALL ON TABLE eliza_knowledge_sync_states TO service_role;

DROP POLICY IF EXISTS service_role_all_eliza_knowledge_sync_states ON eliza_knowledge_sync_states;
CREATE POLICY service_role_all_eliza_knowledge_sync_states
  ON eliza_knowledge_sync_states
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_eliza_knowledge_sync_states_updated_at ON eliza_knowledge_sync_states;
CREATE TRIGGER update_eliza_knowledge_sync_states_updated_at
  BEFORE UPDATE ON eliza_knowledge_sync_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
