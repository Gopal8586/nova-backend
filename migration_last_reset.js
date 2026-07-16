import pool from './src/data/db.js';

const runMigration = async () => {
  try {
    console.log('Adding last_password_reset column to admin_users...');
    await pool.query(`
      ALTER TABLE admin_users 
      ADD COLUMN IF NOT EXISTS last_password_reset TIMESTAMP;
    `);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
};

runMigration();
