const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:admin@localhost:5432/it_inventory'
});

async function addAssetCountersTable() {
  try {
    console.log('Creating asset_counters table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "asset_counters" (
        "id" serial PRIMARY KEY NOT NULL,
        "category" "asset_category" NOT NULL,
        "next_number" integer DEFAULT 1 NOT NULL,
        "last_updated" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "asset_counters_category_unique" UNIQUE("category")
      );
    `;
    
    await pool.query(createTableQuery);
    
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS "asset_counters_category_idx" ON "asset_counters" USING btree ("category");
    `;
    
    await pool.query(createIndexQuery);
    
    console.log('✅ asset_counters table created successfully!');
    
    // Initialize counters for all asset categories (using correct enum values)
    const categories = ['laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'furniture', 'accessory', 'other', 'toner'];
    
    for (const category of categories) {
      const insertQuery = `
        INSERT INTO "asset_counters" ("category", "next_number") 
        VALUES ($1, 1) 
        ON CONFLICT ("category") DO NOTHING
      `;
      await pool.query(insertQuery, [category]);
    }
    
    console.log('✅ Asset counters initialized for all categories!');
    
  } catch (error) {
    console.error('❌ Error creating asset_counters table:', error.message);
  } finally {
    await pool.end();
  }
}

addAssetCountersTable(); 