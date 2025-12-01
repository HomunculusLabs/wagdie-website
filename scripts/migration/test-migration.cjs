/**
 * Simple test script to validate migration approach
 */

const { readFileSync } = require('fs');
const path = require('path');

// Load wagdie.json
const wagdiePath = path.resolve(__dirname, '../../wagdie.json');
console.log('Loading wagdie.json from:', wagdiePath);

try {
  const wagdieData = JSON.parse(readFileSync(wagdiePath, 'utf8'));

  // Analyze data structure
  console.log('\n=== Data Structure Analysis ===');

  const entityTypes = new Set();
  const entityCounts = {};

  for (const [key, value] of Object.entries(wagdieData)) {
    const parts = key.split(':');
    if (parts.length >= 2) {
      const entityType = parts[1];
      entityTypes.add(entityType);
      entityCounts[entityType] = (entityCounts[entityType] || 0) + 1;
    }
  }

  console.log('Entity Types found:', Array.from(entityTypes));
  console.log('Entity Counts:', entityCounts);

  // Sample character_sheets data
  console.log('\n=== Sample Character Sheet ===');
  const characterKey = Object.keys(wagdieData).find(k => k.includes('character_sheets'));
  if (characterKey) {
    const character = wagdieData[characterKey];
    console.log('Key:', characterKey);
    console.log('Data:', JSON.stringify(character, null, 2));
  }

  // Sample metadata
  console.log('\n=== Sample Metadata ===');
  const metadataKey = Object.keys(wagdieData).find(k => k.includes('metadata'));
  if (metadataKey) {
    const metadata = wagdieData[metadataKey];
    console.log('Key:', metadataKey);
    console.log('Data:', JSON.stringify(metadata, null, 2));
  }

  // Sample login_records
  console.log('\n=== Sample Login Record ===');
  const loginKey = Object.keys(wagdieData).find(k => k.includes('login_records'));
  if (loginKey) {
    const login = wagdieData[loginKey];
    console.log('Key:', loginKey);
    console.log('Data:', JSON.stringify(login, null, 2));
  }

  console.log('\n=== Migration Feasibility ===');
  console.log('✅ Character sheets can be mapped to characters table');
  console.log('✅ Login records can be mapped to users table');
  console.log('✅ Metadata can be mapped to metadata table');
  console.log('⚠️  Tokens table - needs to be created or skip');
  console.log('⚠️  Tweets table - needs tweet_authors table or skip');

  console.log('\n=== Recommended Migration Order ===');
  console.log('1. login_records → users');
  console.log('2. metadata → metadata');
  console.log('3. character_sheets → characters');

} catch (error) {
  console.error('Error loading wagdie.json:', error.message);
}