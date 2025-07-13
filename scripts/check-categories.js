const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:admin@localhost:5432/it_inventory'
});

async function checkCategories() {
  try {
    console.log('Checking available asset categories...');
    
    const query = `
      SELECT unnest(enum_range(NULL::asset_category)) as category;
    `;
    
    const result = await pool.query(query);
    console.log('Available categories:', result.rows.map(row => row.category));
    
  } catch (error) {
    console.error('❌ Error checking categories:', error.message);
  } finally {
    await pool.end();
  }
}

checkCategories(); 