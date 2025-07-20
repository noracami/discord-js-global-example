const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const appliedResult = await client.query('SELECT version FROM schema_migrations ORDER BY version');
    const appliedMigrations = new Set(appliedResult.rows.map(row => row.version));

    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);
    console.log(`${appliedMigrations.size} migrations already applied`);

    for (const file of migrationFiles) {
      const version = path.basename(file, '.sql');
      
      if (appliedMigrations.has(version)) {
        console.log(`✓ Migration ${version} already applied`);
        continue;
      }

      console.log(`Running migration ${version}...`);
      
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Run migration in transaction
      await client.query('BEGIN');
      try {
        // Execute migration SQL
        await client.query(migrationSQL);
        
        // Record migration as applied
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        
        await client.query('COMMIT');
        console.log(`✓ Migration ${version} completed`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ Migration ${version} failed:`, error.message);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function closeMigrationPool() {
  await pool.end();
}

module.exports = {
  runMigrations,
  closeMigrationPool
};