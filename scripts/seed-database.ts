#!/usr/bin/env ts-node

/**
 * WAGDIE Database Seed Script
 *
 * Populates the database with realistic mock data for testing and demonstration.
 *
 * Features:
 * - Idempotent (safe to run multiple times)
 * - Error handling with detailed reporting
 * - 50 characters with D&D stats and equipment
 * - 60 tweets with varied media types
 * - 3 test users with wallet addresses
 * - 10 character-concord associations
 *
 * Usage:
 *   npm run seed
 *   or
 *   npx ts-node scripts/seed-database.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

// ============================================================================
// TypeScript Interfaces and Types
// ============================================================================

interface DatabaseConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  wagdieContractAddress: string;
}

interface SeedResults {
  users: { success: number; failed: number; errors: Array<{ record: string; error: string }> };
  characters: { success: number; failed: number; errors: Array<{ record: number; error: string }> };
  characterConcords: { success: number; failed: number; errors: Array<{ record: string; error: string }> };
  tweets: { success: number; failed: number; errors: Array<{ record: string; error: string }> };
}

interface Character {
  token_id: number;
  contract_address: string;
  owner_address: string | null;
  name: string | null;
  class: 'Warrior' | 'Mage' | 'Rogue' | 'Cleric';
  level: number;
  experience: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  hp: number;
  max_hp: number;
  ac: number;
  speed: number;
  equipment: {
    armor?: string;
    back?: string;
    mask?: string;
  };
  background_story: string | null;
  infection_status: 'healthy' | 'infected' | 'cured';
  staking_status: 'unstaked' | 'staked';
  location_id: string | null;
  burned: boolean;
  image_url: string;
  metadata: Record<string, any> | null;
}

interface Tweet {
  tweet_id: string;
  text: string;
  author_username: string;
  media_type: 'none' | 'image' | 'video';
  media_url: string | null;
  video_url: string | null;
  engagement_count: Record<string, any> | null;
  is_reply: boolean;
  is_retweet: boolean;
  created_at: string;
  fetched_at: string;
}

interface User {
  eth_address: string;
  created_at: string;
  last_login_at: string;
  login_count: number;
}

interface CharacterConcord {
  token_id: number;
  concord_id: number;
  quantity: number;
  is_seared: boolean;
  seared_at: string | null;
}

// ============================================================================
// Configuration and Constants
// ============================================================================

const CONFIG: DatabaseConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  wagdieContractAddress: '0x659A4BdcA5b5B9C3A8E9D6F1B7A5C9E2F8D7B6A5C9E2F8D7B6A5C9E2F8D7B6',
};

// Data volume targets
const TARGETS = {
  CHARACTERS: 50,
  TWEETS: 60,
  USERS: 3,
  CHARACTER_CONCORDS: 10,
};

// Character stat generation profiles
const CLASS_PROFILES = {
  Warrior: { STR: 16, DEX: 12, CON: 14, INT: 8, WIS: 10, CHA: 10, hpBase: 30 },
  Mage: { STR: 8, DEX: 12, CON: 10, INT: 16, WIS: 14, CHA: 10, hpBase: 20 },
  Rogue: { STR: 10, DEX: 16, CON: 12, INT: 12, WIS: 10, CHA: 12, hpBase: 25 },
  Cleric: { STR: 12, DEX: 10, CON: 12, INT: 10, WIS: 16, CHA: 12, hpBase: 25 },
};

// Character image rotation
const CHARACTER_IMAGES = [
  '/images/interactive-1.png',
  '/images/interactive-2.png',
  '/images/interactive-3.png',
  '/images/story-1.png',
  '/images/story-2.png',
  '/images/story-3.png',
];

// Test wallet addresses
const TEST_WALLETS = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
];

// Dark fantasy character names
const CHARACTER_NAMES = [
  'Grim Theron the Cursed',
  'Elara Nightshade',
  'Kael the Forsaken',
  'Morgath Shadowbane',
  'Lyra of the Wastes',
  'Vex the Wanderer',
  'Rook Ashborne',
  'Selene Darkwater',
  'Thane Ironheart',
  'Ash of the Void',
  'Corvus Blackthorn',
  'Mira the Lost',
  'Draven Grimshaw',
  'Nyx Shadowmere',
  'Orin the Fallen',
  'Zara Nightwhisper',
  'Rune the Forgotten',
  'Sable Darkwind',
  'Torn of the Depths',
  'Vesper Moonbane',
  'Cain Ashenmark',
  'Lilith Soulrender',
  'Jax Darkthorn',
  'Rowan Nightfall',
  'Silas the Damned',
  'Vera Shadowend',
  'Orion Starless',
  'Nora Voidborn',
  'Kaelen the Broken',
  'Morrigan the Pale',
  'Raze Nightbloom',
  'Soren the Silent',
  'Lyrael the Forsworn',
  'Dante Voidcaller',
  'Elara Shadowfall',
  'Orion the Unseen',
  'Zara Grimdawn',
  'Vex Nightveil',
  'Rune Ashfall',
  'Sable the Hollow',
  'Corbin Darkfall',
  'Lyra the Nameless',
  'Orin the Lost',
  'Nyx the Bound',
  'Cain the Cursed',
  'Mira the Broken',
  'Vesper the Forsaken',
  'Thane the Silent',
];

// Tweet content templates
const TWEET_TEMPLATES = {
  lore: [
    'The darkness spreads across the realm. Who will stand against it?',
    'Ancient powers stir beneath the ruins. The time of awakening draws near.',
    'Whispers echo through the corridors of the forgotten crypts...',
    'The Concord ceremony approaches. Will you bear the burden?',
    'Shadows lengthen as the sun sets on the old world.',
    'The infection spreads. Will you resist or embrace it?',
    'Strange visions plague the dreams of the faithful...',
    'The old gods are stirring from their slumber.',
    'Something moves in the depths of the dark forest.',
    'The boundaries between worlds grow thin...',
  ],
  announcement: [
    'New character reveal: {name} emerges from the ruins...',
    'The infection reaches {location}. Evacuate immediately!',
    'Concord {id} has been discovered. Its power is unimaginable.',
    'Warning: Corpse activity detected near {location}.',
    'Breaking: Strange mushrooms found near {location}.',
    'The ritual is complete. Changes are coming.',
    'Staking is now live at {location}. Secure your characters!',
    'New equipment discovered: {item} now available.',
    'The infection has reached critical levels.',
    'Emergency: The barrier at {location} is failing.',
  ],
  community: [
    'Share your character stories with us! What adventures await?',
    'Show us your favorite character builds and strategies!',
    'Who has found Concord #15? Tell us your theories!',
    'What location do you prefer for staking your characters?',
    'Share your most memorable infection spread moments!',
    'Which character class do you think is strongest?',
    'What equipment combinations work best for your builds?',
    'How do you use the spread page effectively?',
    'Share your tips for surviving the infection!',
    'What mysteries have you uncovered in the lore?',
  ],
};

// Equipment names
const EQUIPMENT = {
  armor: [
    'Darksteel Plate',
    'Shadowweave Robes',
    'Leather Tunic',
    'Mystic Vestments',
    'Iron Scale Mail',
    'Enchanted Chainmail',
    'Wizards Robes',
    'Assassins Garb',
    'Paladins Armor',
    'Necromancer Robes',
  ],
  back: [
    'Tattered Cloak',
    'Wizards Staff',
    'Thieves Tools',
    'Holy Symbol',
    'Battle Standard',
    'Spellbook',
    'Healing Potion Pouch',
    'Rope and Grappling Hook',
    'Musical Instrument',
    'Ancient Scroll Case',
  ],
  mask: [
    'Skull Visage',
    'Mystic Veil',
    'Iron Helmet',
    'Leather Mask',
    'Ceremonial Mask',
    'Enchanted Circlet',
    'Warriors Helm',
    'Shadow Mask',
    'Divine Crown',
    'Plague Doctor Mask',
  ],
};

// Sample video URLs
const SAMPLE_VIDEOS = [
  'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://sample-videos.com/video321/mp4/480/big_buck_bunny_480p_1mb.mp4',
];

// Tweet images (existing project images)
const TWEET_IMAGES = [
  '/images/community-1.png',
  '/images/community-2.png',
  '/images/community-3.png',
  '/images/cta-characters.png',
  '/images/interactive-1.png',
  '/images/story-1.png',
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random choice from array
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random boolean with probability
 */
function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Generate random timestamp within past days
 */
function randomTimestamp(daysBack: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const randomTime = new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
  return randomTime.toISOString();
}

/**
 * Generate random UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Calculate HP based on class, level, and CON modifier
 */
function calculateHP(className: keyof typeof CLASS_PROFILES, level: number, con: number): number {
  const baseHP = CLASS_PROFILES[className].hpBase;
  const conMod = Math.floor((con - 10) / 2);
  const hitDice = 8; // d8 hit dice for all classes in this simplified system
  return baseHP + (level * hitDice) + (level * conMod);
}

/**
 * Calculate max HP
 */
function calculateMaxHP(hp: number): number {
  return hp; // For simplicity, HP equals max HP for seeded characters
}

/**
 * Calculate AC based on class and DEX
 */
function calculateAC(className: keyof typeof CLASS_PROFILES, dex: number): number {
  const baseAC = 10;
  const dexMod = Math.floor((dex - 10) / 2);

  // Class-specific base AC bonuses
  const classBonus = {
    Warrior: 2,  // Heavy armor
    Mage: 0,     // No armor
    Rogue: 1,    // Light armor
    Cleric: 1,   // Medium armor
  };

  return baseAC + classBonus[className] + dexMod;
}

/**
 * Generate experience points based on level
 */
function calculateExperience(level: number): number {
  // Simple quadratic progression: level^2 * 100
  return level * level * 100;
}

// ============================================================================
// Data Generation Functions
// ============================================================================

/**
 * Generate character data
 */
function generateCharacters(): Character[] {
  const characters: Character[] = [];
  const classes: Array<keyof typeof CLASS_PROFILES> = ['Warrior', 'Mage', 'Rogue', 'Cleric'];
  const locations = ['the-ruins', 'crossroads', 'dark-forest', 'haven'];
  const infectionStatuses: Array<'healthy' | 'infected' | 'cured'> = ['healthy', 'infected', 'cured'];

  for (let i = 1; i <= TARGETS.CHARACTERS; i++) {
    const className = classes[Math.floor((i - 1) % classes.length)];
    const profile = CLASS_PROFILES[className];

    // Generate stats with random variation
    const statVariation = 2;
    const stats = {
      str: Math.max(1, Math.min(20, profile.STR + randomInt(-statVariation, statVariation))),
      dex: Math.max(1, Math.min(20, profile.DEX + randomInt(-statVariation, statVariation))),
      con: Math.max(1, Math.min(20, profile.CON + randomInt(-statVariation, statVariation))),
      int: Math.max(1, Math.min(20, profile.INT + randomInt(-statVariation, statVariation))),
      wis: Math.max(1, Math.min(20, profile.WIS + randomInt(-statVariation, statVariation))),
      cha: Math.max(1, Math.min(20, profile.CHA + randomInt(-statVariation, statVariation))),
    };

    const level = randomInt(1, 5);
    const hp = calculateHP(className, level, stats.con);

    // Determine ownership
    const ownerAddress = i <= 40
      ? TEST_WALLETS[Math.floor((i - 1) / 20)] // First 20 to wallet1, next 20 to wallet2
      : null; // Last 10 unowned

    // Generate equipment (40% full, 30% partial, 30% none)
    const equipmentRoll = Math.random();
    let equipment: {
      armor?: string;
      back?: string;
      mask?: string;
    } = {};

    if (equipmentRoll < 0.4) {
      // Full set
      equipment = {
        armor: randomChoice(EQUIPMENT.armor),
        back: randomChoice(EQUIPMENT.back),
        mask: randomChoice(EQUIPMENT.mask),
      };
    } else if (equipmentRoll < 0.7) {
      // Partial set
      const equipmentCount = randomInt(1, 2);
      const equipmentTypes = ['armor', 'back', 'mask'];
      const selectedTypes = equipmentTypes.sort(() => Math.random() - 0.5).slice(0, equipmentCount);

      equipment = {};
      if (selectedTypes.includes('armor')) {
        equipment.armor = randomChoice(EQUIPMENT.armor);
      }
      if (selectedTypes.includes('back')) {
        equipment.back = randomChoice(EQUIPMENT.back);
      }
      if (selectedTypes.includes('mask')) {
        equipment.mask = randomChoice(EQUIPMENT.mask);
      }
    }
    // else: no equipment (empty object)

    characters.push({
      token_id: i,
      contract_address: CONFIG.wagdieContractAddress,
      owner_address: ownerAddress,
      name: CHARACTER_NAMES[i - 1] || `Character ${i}`,
      class: className,
      level: level,
      experience: calculateExperience(level),
      str: stats.str,
      dex: stats.dex,
      con: stats.con,
      int: stats.int,
      wis: stats.wis,
      cha: stats.cha,
      hp: hp,
      max_hp: calculateMaxHP(hp),
      ac: calculateAC(className, stats.dex),
      speed: 30,
      equipment: equipment,
      background_story: `${CHARACTER_NAMES[i - 1]} is a level ${level} ${className.toLowerCase()} who has ${stats.con > 12 ? 'seen much combat' : 'limited battle experience'}. They ${stats.int > 12 ? 'possess ancient knowledge' : 'rely on instinct'} and ${stats.cha > 12 ? 'inspire allies' : 'work alone'}.`,
      infection_status: infectionStatuses[Math.floor((i - 1) % infectionStatuses.length)] as 'healthy' | 'infected' | 'cured',
      staking_status: i <= 25 ? 'staked' : 'unstaked',
      location_id: i <= 25 ? locations[Math.floor((i - 1) % locations.length)] : null,
      burned: false,
      image_url: CHARACTER_IMAGES[(i - 1) % CHARACTER_IMAGES.length],
      metadata: null,
    });
  }

  return characters;
}

/**
 * Generate tweet data
 */
function generateTweets(): Tweet[] {
  const tweets: Tweet[] = [];
  const mediaTypes: Array<'none' | 'image' | 'video'> = ['none', 'image', 'video'];

  for (let i = 1; i <= TARGETS.TWEETS; i++) {
    // Determine media type (50% text, 30% image, 20% video)
    let mediaType: 'none' | 'image' | 'video';
    const mediaRoll = Math.random();

    if (mediaRoll < 0.5) {
      mediaType = 'none';
    } else if (mediaRoll < 0.8) {
      mediaType = 'image';
    } else {
      mediaType = 'video';
    }

    // Generate content based on type
    let text = '';
    const templateType = Math.random();

    if (templateType < 0.4) {
      // Lore content
      text = randomChoice(TWEET_TEMPLATES.lore);
    } else if (templateType < 0.7) {
      // Announcement content
      const template = randomChoice(TWEET_TEMPLATES.announcement);
      const name = randomChoice(CHARACTER_NAMES);
      const location = ['The Ruins', 'Crossroads', 'Dark Forest', 'Haven'][Math.floor(Math.random() * 4)];
      const item = randomChoice(EQUIPMENT.armor);

      text = template
        .replace('{name}', name)
        .replace('{location}', location)
        .replace('{item}', item)
        .replace('{id}', '#' + randomInt(1, 50));
    } else {
      // Community content
      text = randomChoice(TWEET_TEMPLATES.community);
    }

    tweets.push({
      tweet_id: generateUUID(),
      text: text,
      author_username: '@WAGDIE_ETH',
      media_type: mediaType,
      media_url: mediaType === 'image' ? randomChoice(TWEET_IMAGES) : null,
      video_url: mediaType === 'video' ? randomChoice(SAMPLE_VIDEOS) : null,
      engagement_count: {
        likes: randomInt(5, 100),
        retweets: randomInt(1, 20),
        replies: randomInt(0, 15),
      },
      is_reply: false,
      is_retweet: false,
      created_at: randomTimestamp(30), // Past 30 days
      fetched_at: new Date().toISOString(),
    });
  }

  // Sort by created_at (newest first)
  return tweets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Generate user data
 */
function generateUsers(): User[] {
  return TEST_WALLETS.map((address, index) => ({
    eth_address: address,
    created_at: randomTimestamp(60), // Past 60 days
    last_login_at: randomTimestamp(7), // Past 7 days
    login_count: randomInt(1, 10),
  }));
}

/**
 * Generate character-concord associations
 */
function generateCharacterConcords(): CharacterConcord[] {
  const concords: CharacterConcord[] = [];

  // Select 10 random character token IDs
  const selectedTokens = [5, 12, 18, 23, 31, 37, 42, 45, 48, 50];

  selectedTokens.forEach((tokenId, index) => {
    const quantity = index < 6 ? 1 : index < 9 ? 2 : 3; // 6× qty=1, 3× qty=2, 1× qty=3

    concords.push({
      token_id: tokenId,
      concord_id: 15, // Concord #15 (Strange Mushroom)
      quantity: quantity,
      is_seared: false,
      seared_at: null,
    });
  });

  return concords;
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Create Supabase client
 */
function createSupabaseClient(): SupabaseClient {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
    throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  console.log(`🔌 Connecting to Supabase: ${CONFIG.supabaseUrl}`);
  return createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);
}

function createDirectDbPool(): Pool {
  // Connect directly to the PostgreSQL database
  // Connection details for local Supabase Docker instance
  const pool = new Pool({
    host: 'localhost',
    port: 5442,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });
  console.log('🔌 Creating direct database connection as fallback');
  return pool;
}

/**
 * Insert data with error handling and idempotency
 */
async function insertWithHandling<T>(
  supabase: SupabaseClient,
  tableName: string,
  data: T[],
  conflictColumns: string[],
  results: { success: number; failed: number; errors: Array<{ record: any; error: string }> },
  recordKey: keyof T
): Promise<void> {
  console.log(`🌱 Seeding ${tableName}...`);

  for (const record of data) {
    try {
      // For idempotency, we'll try to select first to check if it exists
      let shouldInsert = true;

      // For each record, check if it already exists based on conflict columns
      if (conflictColumns.includes('eth_address')) {
        const { data: existing, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('eth_address', (record as any).eth_address)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        if (existing) shouldInsert = false;
      } else if (conflictColumns.includes('token_id')) {
        const { data: existing, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('token_id', (record as any).token_id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        if (existing) shouldInsert = false;
      } else if (conflictColumns.includes('tweet_id')) {
        const { data: existing, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('tweet_id', (record as any).tweet_id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        if (existing) shouldInsert = false;
      }

      if (shouldInsert) {
        const { error } = await supabase
          .from(tableName)
          .insert(record);

        if (error && error.code !== '23505') { // Ignore unique violation errors
          console.error(`❌ Insert error for ${record[recordKey]}:`, JSON.stringify(error, null, 2));
          results.errors.push({
            record: record[recordKey],
            error: JSON.stringify(error, null, 2)
          });
          results.failed++;
        } else {
          results.success++;
        }
      } else {
        // Record already exists, count as success for idempotency
        results.success++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error inserting record ${record[recordKey]}:`, errorMessage);
      console.error('Full error object:', error);
      results.errors.push({
        record: record[recordKey],
        error: errorMessage
      });
      results.failed++;
    }
  }

  console.log(`✅ Seeded ${tableName}... ${results.success} created`);
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main seed function
 */
async function seedDatabase(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('🌱 Starting database seed...');

    const supabase = createSupabaseClient();

    // Test database connection first
    console.log('🔍 Testing database connection...');
    const { data: usersTable, error: usersError, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);

    if (usersError) {
      console.error('❌ Database connection failed or users table missing:', usersError);
      throw usersError;
    }

    console.log('✅ Database connection successful');
    console.log('📋 Users table exists, count:', count || 'Unknown');

    const results: SeedResults = {
      users: { success: 0, failed: 0, errors: [] },
      characters: { success: 0, failed: 0, errors: [] },
      characterConcords: { success: 0, failed: 0, errors: [] },
      tweets: { success: 0, failed: 0, errors: [] },
    };

    // Generate all data
    console.log('📊 Generating sample data...');
    const users = generateUsers();
    const characters = generateCharacters();
    const tweets = generateTweets();
    const characterConcords = generateCharacterConcords();

    console.log(`📊 Generated: ${users.length} users, ${characters.length} characters, ${tweets.length} tweets, ${characterConcords.length} concords`);

    // Insert data with error handling
    await insertWithHandling(supabase, 'users', users, ['eth_address'], results.users, 'eth_address');
    await insertWithHandling(supabase, 'characters', characters, ['token_id', 'contract_address'], results.characters, 'token_id');
    await insertWithHandling(supabase, 'character_concords', characterConcords, ['token_id', 'concord_id'], results.characterConcords, 'token_id');
    await insertWithHandling(supabase, 'tweets', tweets, ['tweet_id'], results.tweets, 'tweet_id');

    // Display results
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n📊 Seed Summary:');
    console.table([
      { Entity: 'Users', Success: results.users.success, Failed: results.users.failed, Skipped: 0 },
      { Entity: 'Characters', Success: results.characters.success, Failed: results.characters.failed, Skipped: 0 },
      { Entity: 'Character Concords', Success: results.characterConcords.success, Failed: results.characterConcords.failed, Skipped: 0 },
      { Entity: 'Tweets', Success: results.tweets.success, Failed: results.tweets.failed, Skipped: 0 },
    ]);

    // Display errors if any
    const totalErrors = results.users.errors.length + results.characters.errors.length + results.characterConcords.errors.length + results.tweets.errors.length;

    if (totalErrors > 0) {
      console.log('\n⚠️  Errors encountered:');
      [...results.users.errors, ...results.characters.errors, ...results.characterConcords.errors, ...results.tweets.errors].forEach((error, index) => {
        console.log(`  ${index + 1}. Record ${error.record}: ${error.error}`);
      });
    }

    if (totalErrors === 0) {
      console.log(`\n✅ Seed completed successfully in ${duration}s`);
    } else {
      console.log(`\n⚠️  Seed completed with ${totalErrors} errors in ${duration}s`);
    }

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase, generateCharacters, generateTweets, generateUsers, generateCharacterConcords };