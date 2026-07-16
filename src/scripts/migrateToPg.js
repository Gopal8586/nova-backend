import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../data/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICES_FILE = path.join(__dirname, '../data/services.json');

const migrate = async () => {
  console.log('Connecting to PostgreSQL and creating table if not exists...');
  
  try {
    // 1. Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(255) PRIMARY KEY,
        category_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        details JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Table "services" created or verified.');

    // 2. Read existing services JSON
    const data = fs.readFileSync(SERVICES_FILE, 'utf8');
    const services = JSON.parse(data);
    const serviceArray = Object.values(services);
    
    console.log(`Found ${serviceArray.length} services to migrate.`);
    
    // 3. Insert each service
    for (const s of serviceArray) {
      const { id, categoryId, title, ...rest } = s;
      
      const queryText = `
        INSERT INTO services (id, category_id, title, is_active, details)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE 
        SET category_id = EXCLUDED.category_id,
            title = EXCLUDED.title,
            details = EXCLUDED.details,
            updated_at = CURRENT_TIMESTAMP;
      `;
      
      await pool.query(queryText, [id, categoryId, title, true, JSON.stringify(rest)]);
      console.log(`Migrated: ${title}`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
};

migrate();
