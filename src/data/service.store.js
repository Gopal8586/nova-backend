import pool from './db.js';

// Helper to read data
export const getServices = async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    return rows.map(row => ({
      id: row.id,
      categoryId: row.category_id,
      title: row.title,
      isActive: row.is_active,
      ...row.details
    }));
  } catch (error) {
    console.error('Error fetching services from PG', error);
    return [];
  }
};

// Helper to get service by ID
export const getServiceById = async (id) => {
  try {
    const { rows } = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      categoryId: row.category_id,
      title: row.title,
      isActive: row.is_active,
      ...row.details
    };
  } catch (error) {
    console.error('Error fetching service from PG', error);
    return null;
  }
};

// Helper to add or update service
export const upsertService = async (id, serviceData) => {
  try {
    const { categoryId, title, isActive = true, ...details } = serviceData;
    
    const queryText = `
      INSERT INTO services (id, category_id, title, is_active, details)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE 
      SET category_id = EXCLUDED.category_id,
          title = EXCLUDED.title,
          is_active = EXCLUDED.is_active,
          details = EXCLUDED.details,
          updated_at = CURRENT_TIMESTAMP;
    `;
    
    await pool.query(queryText, [id, categoryId, title, isActive, JSON.stringify(details)]);
    return true;
  } catch (error) {
    console.error('Error upserting service to PG', error);
    return false;
  }
};

// Helper to delete service
export const deleteService = async (id) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM services WHERE id = $1', [id]);
    return rowCount > 0;
  } catch (error) {
    console.error('Error deleting service from PG', error);
    return false;
  }
};
