/**
 * Better data analysis script
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
  const samples = {};

  for (const [key, value] of Object.entries(wagdieData)) {
    const parts = key.split(':');
    if (parts.length >= 2) {
      const entityType = parts[0]; // dev:entity_type -> entity_type
      entityTypes.add(entityType);
      entityCounts[entityType] = (entityCounts[entityType] || 0) + 1;

      // Store first sample of each entity type
      if (!samples[entityType]) {
        samples[entityType] = { key, data: value };
      }
    }
  }

  console.log('Entity Types found:', Array.from(entityTypes));
  console.log('Entity Counts:', entityCounts);

  // Sample data for each entity type
  console.log('\n=== Sample Data ===');
  for (const [entityType, sample] of Object.entries(samples)) {
    console.log(`\n--- ${entityType} ---`);
    console.log('Key:', sample.key);
    console.log('Data:', JSON.stringify(sample.data, null, 2));
  }

  console.log('\n=== Migration Recommendations ===');
  console.log('✅ character_sheets → characters table (', entityCounts['character_sheets'], ' records)');
  console.log('✅ logins → users table (', entityCounts['logins'], ' records)');
  console.log('✅ metadata → metadata table (', entityCounts['metadata'], ' records)');

  if (entityCounts['tokens']) {
    console.log('⚠️  tokens → tokens table (', entityCounts['tokens'], ' records) - table creation needed');
  }
  if (entityCounts['tweets']) {
    console.log('⚠️  tweets → tweets table (', entityCounts['tweets'], ' records) - tweet_authors table creation needed');
  }

  console.log('\n=== Total Records ===');
  const totalRecords = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);
  console.log('Total records to migrate:', totalRecords);

} catch (error) {
  console.error('Error loading wagdie.json:', error.message);
}