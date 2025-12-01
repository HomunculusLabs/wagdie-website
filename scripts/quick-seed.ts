#!/usr/bin/env ts-node

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { generateUsers, generateCharacters, generateTweets, generateCharacterConcords } from './seed-database';

// Load environment variables
dotenv.config({ path: '../.env.local' });

// Direct database connection
const pool = new Pool({
  host: 'localhost',
  port: 5442,
  database: 'postgres',
  user: 'postgres',
  password: 'your-super-secret-and-long-postgres-password',
});

async function quickSeed(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('🌱 Quick seed using direct database connection...');

    // Generate all data
    const users = generateUsers();
    const characters = generateCharacters();
    const tweets = generateTweets();
    const characterConcords = generateCharacterConcords();

    console.log(`📊 Generated: ${users.length} users, ${characters.length} characters, ${tweets.length} tweets, ${characterConcords.length} concords`);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert users
      console.log('🌱 Seeding users...');
      for (const user of users) {
        try {
          await client.query(`
            INSERT INTO users (eth_address, created_at, last_login_at, login_count)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (eth_address) DO NOTHING
          `, [user.eth_address, user.created_at, user.last_login_at, user.login_count]);
        } catch (error) {
          console.error(`❌ Error inserting user ${user.eth_address}:`, error);
        }
      }

      // Insert characters
      console.log('🌱 Seeding characters...');
      for (const character of characters) {
        try {
          await client.query(`
            INSERT INTO characters (
              token_id, contract_address, owner_address, name, class, level, experience,
              str, dex, con, int, wis, cha, hp, max_hp, ac, speed,
              equipment, background_story, infection_status, staking_status, location_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            ON CONFLICT (token_id, contract_address) DO NOTHING
          `, [
            character.token_id, character.contract_address, character.owner_address, character.name, character.class,
            character.level, character.experience, character.str, character.dex, character.con, character.int,
            character.wis, character.cha, character.hp, character.max_hp, character.ac, character.speed,
            JSON.stringify(character.equipment), character.background_story, character.infection_status,
            character.staking_status, character.location_id
          ]);
        } catch (error) {
          console.error(`❌ Error inserting character ${character.token_id}:`, error);
        }
      }

      // Insert tweets
      console.log('🌱 Seeding tweets...');
      for (const tweet of tweets) {
        try {
          await client.query(`
            INSERT INTO tweets (tweet_id, author_username, text, created_at, media_url, media_type, video_url, engagement_count, is_reply, is_retweet, fetched_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (tweet_id) DO NOTHING
          `, [tweet.tweet_id, tweet.author_username, tweet.text, tweet.created_at, tweet.media_url, tweet.media_type, tweet.video_url, JSON.stringify(tweet.engagement_count), tweet.is_reply, tweet.is_retweet, tweet.fetched_at]);
        } catch (error) {
          console.error(`❌ Error inserting tweet ${tweet.tweet_id}:`, error);
        }
      }

      // Insert character concords
      console.log('🌱 Seeding character concords...');
      for (const concord of characterConcords) {
        try {
          await client.query(`
            INSERT INTO character_concords (token_id, concord_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (token_id, concord_id) DO NOTHING
          `, [concord.token_id, concord.concord_id, concord.quantity]);
        } catch (error) {
          console.error(`❌ Error inserting character concord ${concord.token_id}-${concord.concord_id}:`, error);
        }
      }

      await client.query('COMMIT');
      console.log('✅ All data inserted successfully!');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Verify counts
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const characterCount = await pool.query('SELECT COUNT(*) FROM characters');
    const tweetCount = await pool.query('SELECT COUNT(*) FROM tweets');
    const concordCount = await pool.query('SELECT COUNT(*) FROM character_concords');

    console.log('\n📊 Database Summary:');
    console.log(`Users: ${userCount.rows[0].count}`);
    console.log(`Characters: ${characterCount.rows[0].count}`);
    console.log(`Tweets: ${tweetCount.rows[0].count}`);
    console.log(`Character Concords: ${concordCount.rows[0].count}`);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ Quick seed completed successfully in ${duration}s`);

  } catch (error) {
    console.error('❌ Fatal error during quick seed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execute if running directly
if (require.main === module) {
  quickSeed();
}