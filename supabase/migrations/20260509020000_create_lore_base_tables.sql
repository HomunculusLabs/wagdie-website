-- Read-only base lore dataset for DB-backed public lore reads.
-- Static TypeScript arrays remain the fallback until seeded DB parity is verified.

CREATE TABLE IF NOT EXISTS lore_seasons (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lore_seasons IS 'Base lore seasons mirrored from static lore data for read-side DB rollout.';
COMMENT ON COLUMN lore_seasons.sort_order IS 'Maps to LoreSeason.order in TypeScript domain records.';

CREATE TABLE IF NOT EXISTS lore_media (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  title TEXT NOT NULL,
  url TEXT,
  archived_url TEXT,
  alt TEXT,
  attribution TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lore_media IS 'Base lore media records referenced by events, sources, locations, and characters.';

CREATE TABLE IF NOT EXISTS lore_sources (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('tweet', 'website', 'image', 'video', 'discord', 'manual_archive')),
  title TEXT NOT NULL,
  url TEXT,
  archived_url TEXT,
  author TEXT,
  platform TEXT,
  published_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  attribution TEXT NOT NULL,
  preservation_note TEXT,
  media_ids TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lore_sources IS 'Base lore source records used for attribution and source-to-media resolution.';

CREATE TABLE IF NOT EXISTS lore_locations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  summary TEXT NOT NULL,
  description TEXT,
  image_id TEXT REFERENCES lore_media(id) ON UPDATE CASCADE ON DELETE SET NULL,
  source_ids TEXT[],
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lore_locations IS 'First-class public base lore locations. Unpublish to remove from navigation without deleting seed history.';

CREATE TABLE IF NOT EXISTS lore_characters (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  summary TEXT NOT NULL,
  token_id INTEGER,
  image_url TEXT,
  external_url TEXT,
  origin TEXT,
  character_class TEXT,
  alignment TEXT,
  level INTEGER,
  image_id TEXT REFERENCES lore_media(id) ON UPDATE CASCADE ON DELETE SET NULL,
  first_appearance_event_id TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lore_characters IS 'First-class public base lore characters. Unpublish to remove from navigation without deleting seed history.';
COMMENT ON COLUMN lore_characters.first_appearance_event_id IS 'LoreEvent id for first appearance; validated by dataset tooling because events and characters reference each other.';

CREATE TABLE IF NOT EXISTS lore_events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind TEXT NOT NULL CHECK (kind IN ('official', 'community')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  season_id TEXT REFERENCES lore_seasons(id) ON UPDATE CASCADE ON DELETE SET NULL,
  location_ids TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  character_ids TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  entity_refs JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(entity_refs) = 'array'),
  occurred_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  timeline_order INTEGER NOT NULL,
  canon JSONB NOT NULL CHECK (jsonb_typeof(canon) = 'object'),
  source_ids TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  media_ids TEXT[],
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lore_events IS 'First-class public base lore events before canonization overrides and community submission overlays are applied.';
COMMENT ON COLUMN lore_events.entity_refs IS 'Maps to LoreEvent.entityRefs JSON array.';
COMMENT ON COLUMN lore_events.canon IS 'Maps to LoreEvent.canon JSON object, including canon path.';

CREATE INDEX IF NOT EXISTS idx_lore_seasons_sort_order
  ON lore_seasons(sort_order ASC, title ASC);

CREATE INDEX IF NOT EXISTS idx_lore_sources_kind
  ON lore_sources(kind, title ASC);

CREATE INDEX IF NOT EXISTS idx_lore_locations_published_name
  ON lore_locations(is_published, name ASC);

CREATE INDEX IF NOT EXISTS idx_lore_locations_tags
  ON lore_locations USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_lore_characters_published_name
  ON lore_characters(is_published, name ASC);

CREATE INDEX IF NOT EXISTS idx_lore_characters_token_id
  ON lore_characters(token_id)
  WHERE token_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lore_characters_tags
  ON lore_characters USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_lore_events_published_timeline
  ON lore_events(is_published, timeline_order ASC, title ASC);

CREATE INDEX IF NOT EXISTS idx_lore_events_season_id
  ON lore_events(season_id);

CREATE INDEX IF NOT EXISTS idx_lore_events_location_ids
  ON lore_events USING GIN(location_ids);

CREATE INDEX IF NOT EXISTS idx_lore_events_character_ids
  ON lore_events USING GIN(character_ids);

CREATE INDEX IF NOT EXISTS idx_lore_events_source_ids
  ON lore_events USING GIN(source_ids);

CREATE INDEX IF NOT EXISTS idx_lore_events_tags
  ON lore_events USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_lore_events_keywords
  ON lore_events USING GIN(keywords);

DROP TRIGGER IF EXISTS update_lore_seasons_updated_at ON lore_seasons;
CREATE TRIGGER update_lore_seasons_updated_at
  BEFORE UPDATE ON lore_seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lore_media_updated_at ON lore_media;
CREATE TRIGGER update_lore_media_updated_at
  BEFORE UPDATE ON lore_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lore_sources_updated_at ON lore_sources;
CREATE TRIGGER update_lore_sources_updated_at
  BEFORE UPDATE ON lore_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lore_locations_updated_at ON lore_locations;
CREATE TRIGGER update_lore_locations_updated_at
  BEFORE UPDATE ON lore_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lore_characters_updated_at ON lore_characters;
CREATE TRIGGER update_lore_characters_updated_at
  BEFORE UPDATE ON lore_characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lore_events_updated_at ON lore_events;
CREATE TRIGGER update_lore_events_updated_at
  BEFORE UPDATE ON lore_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lore_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manage lore seasons" ON lore_seasons;
CREATE POLICY "Service role manage lore seasons"
  ON lore_seasons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage lore media" ON lore_media;
CREATE POLICY "Service role manage lore media"
  ON lore_media
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage lore sources" ON lore_sources;
CREATE POLICY "Service role manage lore sources"
  ON lore_sources
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage lore locations" ON lore_locations;
CREATE POLICY "Service role manage lore locations"
  ON lore_locations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage lore characters" ON lore_characters;
CREATE POLICY "Service role manage lore characters"
  ON lore_characters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage lore events" ON lore_events;
CREATE POLICY "Service role manage lore events"
  ON lore_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON lore_seasons TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lore_media TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lore_sources TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lore_locations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lore_characters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lore_events TO service_role;
