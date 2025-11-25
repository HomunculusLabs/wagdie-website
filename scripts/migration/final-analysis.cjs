/**
 * Final data analysis with correct structure understanding
 */

const { readFileSync } = require('fs');
const path = require('path');

// Load wagdie.json
const wagdiePath = path.resolve(__dirname, '../../wagdie.json');
console.log('Loading wagdie.json from:', wagdiePath);

try {
  const wagdieData = JSON.parse(readFileSync(wagdiePath, 'utf8'));

  console.log('\n=== WAGDIE Data Analysis ===');

  const environments = ['dev', 'prod'];
  const entityAnalysis = {};

  for (const env of environments) {
    console.log(`\n--- ${env.toUpperCase()} Environment ---`);
    const envData = wagdieData[env] || {};
    const entityTypes = new Set();
    const entityCounts = {};
    const samples = {};

    for (const [key, value] of Object.entries(envData)) {
      const parts = key.split('/');
      if (parts.length >= 2) {
        const entityType = parts[0];
        const entityId = parts[1];

        entityTypes.add(entityType);
        entityCounts[entityType] = (entityCounts[entityType] || 0) + 1;

        if (!samples[entityType]) {
          samples[entityType] = { key, entityId, data: value };
        }
      }
    }

    console.log(`Entity types in ${env}:`, Array.from(entityTypes));
    console.log('Entity counts:', entityCounts);

    // Store for overall analysis
    entityAnalysis[env] = { entityTypes: Array.from(entityTypes), entityCounts, samples };

    // Show samples
    for (const [entityType, sample] of Object.entries(samples)) {
      console.log(`\nSample ${entityType}:`);
      console.log(`  Key: ${sample.key}`);
      console.log(`  Data:`, JSON.stringify(sample.data, null, 2));
      break; // Only show first sample
    }
  }

  // Overall migration summary
  console.log('\n=== Migration Summary ===');
  console.log('Recommended approach: Migrate DEV environment data (smaller dataset)');

  const devCounts = entityAnalysis.dev.entityCounts;
  const totalDevRecords = Object.values(devCounts).reduce((sum, count) => sum + count, 0);

  console.log('\nDEV Environment Migration Plan:');
  console.log('📊 Total Records:', totalDevRecords);

  if (devCounts['character_sheets']) {
    console.log('✅ character_sheets → characters table:', devCounts['character_sheets'], 'records');
  }
  if (devCounts['logins']) {
    console.log('✅ logins → users table:', devCounts['logins'], 'records');
  }
  if (devCounts['metadata']) {
    console.log('✅ metadata → metadata table:', devCounts['metadata'], 'records');
  }
  if (devCounts['tweets']) {
    console.log('⚠️  tweets → tweets table (needs tweet_authors):', devCounts['tweets'], 'records');
  }
  if (devCounts['tokens']) {
    console.log('⚠️  tokens → tokens table (table missing):', devCounts['tokens'], 'records');
  }

  console.log('\n=== Recommended Migration Order ===');
  console.log('1. logins → users (user accounts)');
  console.log('2. metadata → metadata (NFT metadata)');
  console.log('3. character_sheets → characters (game characters)');
  console.log('Skip: tokens, tweets (no corresponding tables)');

} catch (error) {
  console.error('Error loading wagdie.json:', error.message);
  console.error(error.stack);
}