import pool from './src/data/db.js';
import bcrypt from 'bcryptjs';

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const runMigration = async () => {
  try {
    console.log('Creating admin_users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);

    console.log('Creating password_reset_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES admin_users(id),
        username VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Checking for existing users...');
    const res = await pool.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(res.rows[0].count) === 0) {
      console.log('Inserting default admins...');
      await pool.query(
        `INSERT INTO admin_users (name, username, password, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [
          'Gopal Tiwari', 'gopal_admin', hashPassword('Gopal@123'), 'superadmin',
          'Gyanendra Pal', 'gyanendra_admin', hashPassword('Gyanendra@123'), 'admin'
        ]
      );
    }
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
};

runMigration();
