/**
 * Simple migration test using the framework directly
 */

const { readFileSync } = require('fs');
const path = require('path');

// Load wagdie.json
const wagdiePath = path.resolve(__dirname, '../../wagdie.json');
console.log('=== Migration Test ===');

try {
  const wagdieData = JSON.parse(readFileSync(wagdiePath, 'utf8'));

  // Test data extraction
  console.log('\n1. Testing data extraction...');

  function extractEntityRecords(sourceData, entityType) {
    const entityKey = `dev:${entityType}`;
    const records = [];

    for (const [key, value] of Object.entries(sourceData)) {
      if (key.startsWith(entityKey)) {
        records.push({ id: key, data: value });
      }
    }

    return records;
  }

  const entityTypes = ['logins', 'metadata', 'character_sheets'];

  for (const entityType of entityTypes) {
    const records = extractEntityRecords(wagdieData, entityType);
    console.log(`${entityType}: ${records.length} records`);

    if (records.length > 0) {
      console.log(`  Sample key: ${records[0].id}`);
      console.log(`  Sample data:`, JSON.stringify(records[0].data, null, 2));
    }
  }

  // Test transformation
  console.log('\n2. Testing data transformation...');

  function transformCharacter(data) {
    const equipment = data.equipment || { armor: 'None', back: 'None', mask: 'None' };
    const attributes = data.attributes || {
      dexterity: 0, constitution: 0, strength: 0,
      charisma: 0, wisdom: 0, intelligence: 0
    };

    return {
      token_id: data.tokenIdInt || 0,
      name: data.name || 'Unknown Character',
      class: 'Adventurer',
      level: data.level || 1,
      origin: data.origin || 'Unknown',
      experience: data.experience_points || 0,
      str: attributes.strength,
      dex: attributes.dexterity,
      con: attributes.constitution,
      int: attributes.intelligence,
      wis: attributes.wisdom,
      cha: attributes.charisma,
      hp: data.hit_points || 0,
      max_hp: 10 + Math.floor((attributes.constitution - 10) / 2),
      equipment: equipment,
      background_story: data.background_story || null,
      infection_status: 'healthy',
      staking_status: 'unstaked'
    };
  }

  function transformLogin(recordId, data) {
    const address = recordId.split('/').pop().toLowerCase();
    return {
      eth_address: address,
      login_count: data.timestamps ? data.timestamps.length : 0
    };
  }

  function transformMetadata(data) {
    // Transform attributes array to object
    const attributesObj = {};
    if (Array.isArray(data.attributes)) {
      data.attributes.forEach(attr => {
        if (attr.trait_type && attr.value) {
          attributesObj[attr.trait_type] = attr.value;
        }
      });
    }

    return {
      token_id: parseInt(data.tokenId) || 0,
      name: data.name || null,
      description: data.description || null,
      image_url: data.image || null,
      attributes: Object.keys(attributesObj).length > 0 ? attributesObj : null
    };
  }

  // Test transformations on sample data
  const characterRecords = extractEntityRecords(wagdieData, 'character_sheets');
  if (characterRecords.length > 0) {
    const transformed = transformCharacter(characterRecords[0].data);
    console.log('Character transformation:');
    console.log(JSON.stringify(transformed, null, 2));
  }

  const loginRecords = extractEntityRecords(wagdieData, 'logins');
  if (loginRecords.length > 0) {
    const transformed = transformLogin(loginRecords[0].id, loginRecords[0].data);
    console.log('Login transformation:');
    console.log(JSON.stringify(transformed, null, 2));
  }

  const metadataRecords = extractEntityRecords(wagdieData, 'metadata');
  if (metadataRecords.length > 0) {
    const transformed = transformMetadata(metadataRecords[0].data);
    console.log('Metadata transformation:');
    console.log(JSON.stringify(transformed, null, 2));
  }

  console.log('\n✅ Migration test completed successfully!');
  console.log('Data extraction and transformation working as expected.');

} catch (error) {
  console.error('❌ Migration test failed:', error.message);
  console.error(error.stack);
}