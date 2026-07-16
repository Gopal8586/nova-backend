import pool from './src/data/db.js';

const runMigration = async () => {
  try {
    console.log('Adding OTP columns to admin_users...');
    await pool.query(`
      ALTER TABLE admin_users 
      ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS reset_otp_expiry TIMESTAMP;
    `);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
};

runMigration();
