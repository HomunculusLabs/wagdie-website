/**
 * Correct data analysis for nested structure
 */

const { readFileSync } = require('fs');
const path = require('path');

// Load wagdie.json
const wagdiePath = path.resolve(__dirname, '../../wagdie.json');
console.log('Loading wagdie.json from:', wagdiePath);

try {
  const wagieData = JSON.parse(readFileSync(wagdiePath, 'utf8'));

  console.log('\n=== WAGDIE Data Structure Analysis ===');

  // Get first few keys to understand structure
  const keys = Object.keys(wagieData);
  console.log('Top-level keys:', keys.slice(0, 10));
  console.log('Total top-level entries:', keys.length);

  // Analyze the pattern
  const entityTypes = new Set();
  const entityCounts = {};
  const environments = new Set();
  const samples = {};

  for (const [key, value] of Object.entries(wagieData)) {
    const parts = key.split(':');

    if (parts.length >= 2) {
      const env = parts[0]; // dev or prod
      const entityPath = parts[1]; // character_sheets/1234
      const entityParts = entityPath.split('/');

      if (entityParts.length >= 2) {
        const entityType = entityParts[0];
        const entityId = entityParts[1];

        environments.add(env);
        entityTypes.add(entityType);
        const envEntityKey = `${env}_${entityType}`;
        entityCounts[envEntityKey] = (entityCounts[envEntityKey] || 0) + 1;

        // Store sample for each environment/entity type
        if (!samples[envEntityKey]) {
          samples[envEntityKey] = { key, env, entityType, entityId, data: value };
        }
      }
    }
  }

  console.log('\nEnvironments found:', Array.from(environments));
  console.log('Entity types found:', Array.from(entityTypes));
  console.log('Entity counts by environment:', entityCounts);

  // Show samples for DEV environment
  console.log('\n=== DEV Environment Samples ===');
  for (const [key, sample] of Object.entries(samples)) {
    if (sample.env === 'dev') {
      console.log(`\n--- ${sample.entityType} ---`);
      console.log('Key:', sample.key);
      console.log('Entity ID:', sample.entityId);
      console.log('Data:', JSON.stringify(sample.data, null, 2));
    }
  }

  // Migration plan
  console.log('\n=== Migration Plan (DEV Environment) ===');
  const devTotal = Object.entries(entityCounts)
    .filter(([key]) => key.startsWith('dev_'))
    .reduce((sum, [, count]) => sum + count, 0);

  console.log('Total DEV records:', devTotal);

  const migrationOrder = [
    'login_records', 'metadata', 'character_sheets'
  ];

  for (const entityType of migrationOrder) {
    const count = entityCounts[`dev_${entityType}`] || 0;
    if (count > 0) {
      console.log(`✅ ${entityType}:`, count, 'records');
    }
  }

  console.log('\nRecommended table mappings:');
  console.log('dev_login_records → users table');
  console.log('dev_metadata → metadata table');
  console.log('dev_character_sheets → characters table');

} catch (error) {
  console.error('Error:', error.message);
}