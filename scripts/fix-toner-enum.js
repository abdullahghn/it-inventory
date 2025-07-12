require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function addTonerToEnum() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Add 'toner' to the asset_category enum
    await client.query("ALTER TYPE asset_category ADD VALUE 'toner';");
    console.log('✅ Successfully added "toner" to asset_category enum');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42710') {
      console.log('ℹ️ "toner" value already exists in the enum');
    }
  } finally {
    await client.end();
  }
}

addTonerToEnum(); 