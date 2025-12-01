import json
import datetime

INPUT_FILE = '/Users/t3rpz/projects/wagdie-simplified/wagdie.json'
OUTPUT_FILE = '/Users/t3rpz/projects/wagdie-simplified/supabase/migrations/20251125000000_import_wagdie_data.sql'
USERS_TABLE = 'wagdie_users'
CHARACTERS_TABLE = 'wagdie_characters'
CONTRACT_ADDRESS = '0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a'
CONCORD_CONTRACT = '0x1d38150f1fd989fb89ab19518a9c4e93c5554634'

def timestamp_to_iso(ts):
    return datetime.datetime.fromtimestamp(ts / 1000.0).isoformat()

def escape_sql_string(s):
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"

def escape_json_for_sql(obj):
    """Escape a JSON object for SQL insertion."""
    if obj is None or obj == {}:
        return 'NULL'
    json_str = json.dumps(obj).replace("'", "''")
    return f"'{json_str}'"

def main():
    print(f"Loading {INPUT_FILE}...")
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)

    users_sql = []
    tokens_data = {}           # Main character data from prod:tokens/
    concords_data = {}         # Concord NFT data
    character_sheets_data = {} # Character sheets from prod:character_sheets/
    metadata_data = {}         # Metadata from prod:metadata/
    locations_set = {}         # Unique locations extracted from tokens

    print("Processing data...")
    for key, value in data.items():
        # Process Users from prod:logins/
        if key.startswith('prod:logins/'):
            eth_address = key.split('/')[-1]
            timestamps = value.get('timestamps', [])
            if not timestamps:
                continue

            timestamps.sort()
            created_at = timestamp_to_iso(timestamps[0])
            last_login_at = timestamp_to_iso(timestamps[-1])
            login_count = len(timestamps)

            sql = f"INSERT INTO {USERS_TABLE} (eth_address, login_count, created_at, last_login_at) VALUES ({escape_sql_string(eth_address)}, {login_count}, {escape_sql_string(created_at)}, {escape_sql_string(last_login_at)}) ON CONFLICT (eth_address) DO UPDATE SET login_count = EXCLUDED.login_count, last_login_at = EXCLUDED.last_login_at;"
            users_sql.append(sql)

        # Process WAGDIE tokens (main character data)
        elif key.startswith(f'prod:tokens/{CONTRACT_ADDRESS}-'):
            token_id = int(key.split('-')[-1])
            tokens_data[token_id] = value

        # Process Concord tokens
        elif key.startswith(f'prod:tokens/{CONCORD_CONTRACT}-'):
            concord_id = int(key.split('-')[-1])
            concords_data[concord_id] = value

        # Process character sheets from prod:character_sheets/
        elif key.startswith('prod:character_sheets/'):
            token_id = int(key.split('/')[-1])
            character_sheets_data[token_id] = value

        # Process metadata from prod:metadata/
        elif key.startswith('prod:metadata/'):
            token_id = int(key.split('/')[-1])
            metadata_data[token_id] = value

    print(f"Found {len(users_sql)} users, {len(tokens_data)} tokens, {len(concords_data)} concords")
    print(f"Found {len(character_sheets_data)} character sheets, {len(metadata_data)} metadata entries")

    # Extract unique locations from tokens
    for token_id, token in tokens_data.items():
        location = token.get('location', {})
        if location and isinstance(location, dict) and location.get('id'):
            loc_id = str(location.get('id'))
            loc_name = location.get('name', f'Location {loc_id}')
            if loc_id not in locations_set:
                locations_set[loc_id] = loc_name

    print(f"Found {len(locations_set)} unique locations")

    # Generate character SQL from tokens_data
    characters_sql = []
    character_concords_sql = []

    for token_id, token in tokens_data.items():
        sheet = token.get('sheet', {}) or {}
        raw_metadata = token.get('rawMetadata', {}) or {}

        # Get owner (first in list, NULL if burned)
        owners = token.get('owners', [])
        burned = token.get('burned', False)
        owner_address = owners[0] if owners and not burned else None

        # Status flags
        infected = token.get('isInfected', False)
        is_seared = token.get('isSeared', False)

        # Location
        location = token.get('location', {})
        location_id = location.get('id') if location and isinstance(location, dict) else None

        # Extract stats from sheet
        attributes = sheet.get('attributes', {}) or {}
        equipment = sheet.get('equipment', {}) or {}

        # Character name (prefer sheet, fallback to metadata)
        name = sheet.get('name') or raw_metadata.get('name')

        # Stats with defaults (clamp to valid D&D range 1-20)
        def clamp_stat(val, default=10):
            if val is None:
                return default
            return max(1, min(20, int(val)))

        str_val = clamp_stat(attributes.get('strength'))
        dex_val = clamp_stat(attributes.get('dexterity'))
        con_val = clamp_stat(attributes.get('constitution'))
        int_val = clamp_stat(attributes.get('intelligence'))
        wis_val = clamp_stat(attributes.get('wisdom'))
        cha_val = clamp_stat(attributes.get('charisma'))

        hp = sheet.get('hit_points', 10) or 10
        level = sheet.get('level', 1) or 1
        experience = sheet.get('experience_points', 0) or 0
        origin = sheet.get('origin')
        background = sheet.get('background_story')

        # Combined metadata JSONB (store everything for reference)
        combined = {**raw_metadata}
        if sheet:
            combined['sheet'] = sheet

        metadata_escaped = escape_json_for_sql(combined)
        equipment_escaped = escape_json_for_sql(equipment)

        # Generate INSERT with all columns
        sql = f"""INSERT INTO {CHARACTERS_TABLE} (token_id, contract_address, owner_address, metadata, burned, infected, location_id, name, str, dex, con, "int", wis, cha, hp, max_hp, level, experience, origin, background_story, equipment) VALUES ({token_id}, {escape_sql_string(CONTRACT_ADDRESS)}, {escape_sql_string(owner_address)}, {metadata_escaped}, {str(burned).upper()}, {str(infected).upper()}, {escape_sql_string(location_id)}, {escape_sql_string(name)}, {str_val}, {dex_val}, {con_val}, {int_val}, {wis_val}, {cha_val}, {hp}, {hp}, {level}, {experience}, {escape_sql_string(origin)}, {escape_sql_string(background)}, {equipment_escaped}) ON CONFLICT (contract_address, token_id) DO UPDATE SET owner_address = EXCLUDED.owner_address, metadata = EXCLUDED.metadata, burned = EXCLUDED.burned, infected = EXCLUDED.infected, location_id = EXCLUDED.location_id, name = EXCLUDED.name, str = EXCLUDED.str, dex = EXCLUDED.dex, con = EXCLUDED.con, "int" = EXCLUDED."int", wis = EXCLUDED.wis, cha = EXCLUDED.cha, hp = EXCLUDED.hp, max_hp = EXCLUDED.max_hp, level = EXCLUDED.level, experience = EXCLUDED.experience, origin = EXCLUDED.origin, background_story = EXCLUDED.background_story, equipment = EXCLUDED.equipment;"""
        characters_sql.append(sql)

        # Process searedConcord relationships
        seared_concord = token.get('searedConcord', {})
        if seared_concord and isinstance(seared_concord, dict) and seared_concord.get('id'):
            concord_id = seared_concord.get('id')
            try:
                concord_id_int = int(concord_id)
                sql = f"INSERT INTO character_concords (token_id, concord_id, is_seared, quantity) VALUES ({token_id}, {concord_id_int}, {str(is_seared).upper()}, 1) ON CONFLICT (token_id, concord_id) DO UPDATE SET is_seared = EXCLUDED.is_seared;"
                character_concords_sql.append(sql)
            except (ValueError, TypeError):
                print(f"Warning: Invalid concord_id '{concord_id}' for token {token_id}")

    # Generate concords SQL
    concords_sql = []
    for concord_id, concord in concords_data.items():
        raw_meta = concord.get('rawMetadata', {}) or {}
        name = raw_meta.get('name', f'Concord #{concord_id}')
        description = raw_meta.get('description', '')
        image_url = raw_meta.get('image', '')

        sql = f"INSERT INTO concords (concord_id, name, description, image_url, is_consumable, effect_type) VALUES ({concord_id}, {escape_sql_string(name)}, {escape_sql_string(description)}, {escape_sql_string(image_url)}, TRUE, 'passive') ON CONFLICT (concord_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url;"
        concords_sql.append(sql)

    # Generate character_sheets SQL
    character_sheets_sql = []
    for token_id, sheet in character_sheets_data.items():
        name = sheet.get('name', f'Character #{token_id}')
        level = sheet.get('level', 1) or 1
        origin = sheet.get('origin')
        location = sheet.get('location', 'Unknown')
        hit_points = sheet.get('hit_points', 0) or 0
        experience_points = sheet.get('experience_points', 0) or 0
        equipment = sheet.get('equipment', {}) or {}
        attributes = sheet.get('attributes', {}) or {}
        background_story = sheet.get('background_story')

        equipment_escaped = escape_json_for_sql(equipment)
        attributes_escaped = escape_json_for_sql(attributes)

        sql = f"INSERT INTO character_sheets (token_id, name, level, origin, location, hit_points, experience_points, equipment, attributes, background_story) VALUES ({token_id}, {escape_sql_string(name)}, {level}, {escape_sql_string(origin)}, {escape_sql_string(location)}, {hit_points}, {experience_points}, {equipment_escaped}, {attributes_escaped}, {escape_sql_string(background_story)}) ON CONFLICT (token_id) DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level, origin = EXCLUDED.origin, location = EXCLUDED.location, hit_points = EXCLUDED.hit_points, experience_points = EXCLUDED.experience_points, equipment = EXCLUDED.equipment, attributes = EXCLUDED.attributes, background_story = EXCLUDED.background_story;"
        character_sheets_sql.append(sql)

    # Generate metadata SQL
    metadata_sql = []
    for token_id, meta in metadata_data.items():
        name = meta.get('name')
        description = meta.get('description')
        image_url = meta.get('image')
        attributes = meta.get('attributes', [])

        attributes_escaped = escape_json_for_sql(attributes)

        sql = f"INSERT INTO metadata (token_id, name, description, image_url, attributes) VALUES ({token_id}, {escape_sql_string(name)}, {escape_sql_string(description)}, {escape_sql_string(image_url)}, {attributes_escaped}) ON CONFLICT (token_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url, attributes = EXCLUDED.attributes;"
        metadata_sql.append(sql)

    # Generate locations SQL
    locations_sql = []
    for loc_id, loc_name in locations_set.items():
        sql = f"INSERT INTO locations (id, name, is_active) VALUES ({escape_sql_string(loc_id)}, {escape_sql_string(loc_name)}, TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;"
        locations_sql.append(sql)

    print(f"Generated:")
    print(f"  - {len(characters_sql)} character inserts")
    print(f"  - {len(concords_sql)} concord inserts")
    print(f"  - {len(character_concords_sql)} relationship inserts")
    print(f"  - {len(character_sheets_sql)} character sheet inserts")
    print(f"  - {len(metadata_sql)} metadata inserts")
    print(f"  - {len(locations_sql)} location inserts")

    # Schema SQL with all required tables and columns
    schema_sql = """-- WAGDIE Data Tables
-- Migration generated from wagdie.json

-- Users table
CREATE TABLE IF NOT EXISTS wagdie_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eth_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  login_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_wagdie_users_eth_address ON wagdie_users(eth_address);

-- Characters table with full stat columns
CREATE TABLE IF NOT EXISTS wagdie_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  owner_address TEXT,
  metadata JSONB,
  burned BOOLEAN DEFAULT FALSE,
  infected BOOLEAN DEFAULT FALSE,
  location_id TEXT,
  name TEXT,
  str INTEGER DEFAULT 10,
  dex INTEGER DEFAULT 10,
  con INTEGER DEFAULT 10,
  "int" INTEGER DEFAULT 10,
  wis INTEGER DEFAULT 10,
  cha INTEGER DEFAULT 10,
  hp INTEGER DEFAULT 10,
  max_hp INTEGER DEFAULT 10,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  origin TEXT,
  background_story TEXT,
  equipment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_address, token_id)
);

CREATE INDEX IF NOT EXISTS idx_wagdie_characters_token_id ON wagdie_characters(token_id);
CREATE INDEX IF NOT EXISTS idx_wagdie_characters_owner ON wagdie_characters(owner_address);
CREATE INDEX IF NOT EXISTS idx_wagdie_characters_burned ON wagdie_characters(burned);
CREATE INDEX IF NOT EXISTS idx_wagdie_characters_infected ON wagdie_characters(infected);
CREATE INDEX IF NOT EXISTS idx_wagdie_characters_location ON wagdie_characters(location_id);

-- Concords table (ERC1155 special items)
CREATE TABLE IF NOT EXISTS concords (
  concord_id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  image_url TEXT,
  is_consumable BOOLEAN DEFAULT TRUE,
  effect_type TEXT DEFAULT 'passive',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character-Concord relationships (searing)
CREATE TABLE IF NOT EXISTS character_concords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL,
  concord_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_seared BOOLEAN DEFAULT FALSE,
  seared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_id, concord_id)
);

CREATE INDEX IF NOT EXISTS idx_character_concords_token ON character_concords(token_id);
CREATE INDEX IF NOT EXISTS idx_character_concords_concord ON character_concords(concord_id);

"""

    # Write output file
    with open(OUTPUT_FILE, 'w') as f:
        f.write(f"-- Migration generated from wagdie.json\n")
        f.write(f"-- {len(users_sql)} users, {len(characters_sql)} characters, {len(concords_sql)} concords\n")
        f.write(f"-- {len(character_sheets_sql)} character_sheets, {len(metadata_sql)} metadata, {len(locations_sql)} locations\n\n")
        f.write(schema_sql)

        f.write("\n-- Users\n")
        for sql in users_sql:
            f.write(sql + "\n")

        f.write("\n-- Locations (insert before characters that reference them)\n")
        for sql in locations_sql:
            f.write(sql + "\n")

        f.write("\n-- Concords (insert before character relationships)\n")
        for sql in concords_sql:
            f.write(sql + "\n")

        f.write("\n-- Characters\n")
        for sql in characters_sql:
            f.write(sql + "\n")

        f.write("\n-- Character-Concord Relationships\n")
        for sql in character_concords_sql:
            f.write(sql + "\n")

        f.write("\n-- Character Sheets\n")
        for sql in character_sheets_sql:
            f.write(sql + "\n")

        f.write("\n-- Metadata\n")
        for sql in metadata_sql:
            f.write(sql + "\n")

    print(f"\nDone! Written to {OUTPUT_FILE}")
    print(f"\nFinal Summary:")
    print(f"  - Users: {len(users_sql)}")
    print(f"  - Characters: {len(characters_sql)}")
    print(f"  - Concords: {len(concords_sql)}")
    print(f"  - Character-Concord links: {len(character_concords_sql)}")
    print(f"  - Character Sheets: {len(character_sheets_sql)}")
    print(f"  - Metadata: {len(metadata_sql)}")
    print(f"  - Locations: {len(locations_sql)}")


if __name__ == "__main__":
    main()
