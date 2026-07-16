import bcrypt from 'bcryptjs';
import pool from './db.js';

export const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

export const getUserByUsername = async (username) => {
  const res = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
  return res.rows[0];
};

export const getAllAdminUsers = async () => {
  const res = await pool.query('SELECT id, name, username, role, last_password_reset FROM admin_users ORDER BY role DESC, name ASC');
  return res.rows;
};

export const createAdminUser = async (name, username, role, password) => {
  const hashed = hashPassword(password);
  const res = await pool.query(
    'INSERT INTO admin_users (name, username, role, password) VALUES ($1, $2, $3, $4) RETURNING id, name, username, role',
    [name, username, role, hashed]
  );
  return res.rows[0];
};

export const updateAdminUser = async (id, name, username, role, password) => {
  if (password) {
    const hashed = hashPassword(password);
    const res = await pool.query(
      'UPDATE admin_users SET name = $1, username = $2, role = $3, password = $4, last_password_reset = NOW() WHERE id = $5 RETURNING id, name, username, role',
      [name, username, role, hashed, id]
    );
    return res.rows[0];
  } else {
    const res = await pool.query(
      'UPDATE admin_users SET name = $1, username = $2, role = $3 WHERE id = $4 RETURNING id, name, username, role',
      [name, username, role, id]
    );
    return res.rows[0];
  }
};

export const deleteAdminUser = async (id) => {
  const res = await pool.query('DELETE FROM admin_users WHERE id = $1 RETURNING id', [id]);
  return res.rows.length > 0;
};

export const updateUserPassword = async (username, newPassword) => {
  const hashed = hashPassword(newPassword);
  const res = await pool.query(
    'UPDATE admin_users SET password = $1, last_password_reset = NOW() WHERE username = $2 RETURNING *', 
    [hashed, username]
  );
  return res.rows.length > 0;
};

export const saveUserOTP = async (username, otp) => {
  const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await pool.query(
    'UPDATE admin_users SET reset_otp = $1, reset_otp_expiry = $2 WHERE username = $3',
    [otp, expiry, username]
  );
};

export const verifyUserOTP = async (username, otp) => {
  const res = await pool.query(
    'SELECT * FROM admin_users WHERE username = $1 AND reset_otp = $2 AND reset_otp_expiry > NOW()',
    [username, otp]
  );
  if (res.rows.length > 0) {
    await pool.query(
      'UPDATE admin_users SET reset_otp = NULL, reset_otp_expiry = NULL WHERE username = $1',
      [username]
    );
    return true;
  }
  return false;
};

export const createResetRequest = async (username) => {
  const user = await getUserByUsername(username);
  if (user && user.role !== 'superadmin') {
    await pool.query(
      'INSERT INTO password_reset_requests (user_id, username, name, status) VALUES ($1, $2, $3, $4)',
      [user.id, user.username, user.name, 'pending']
    );
    return true;
  }
  return false;
};

export const getPendingResetRequests = async () => {
  const res = await pool.query('SELECT * FROM password_reset_requests WHERE status = $1 ORDER BY timestamp DESC', ['pending']);
  return res.rows;
};

export const completeResetRequest = async (id) => {
  const res = await pool.query("UPDATE password_reset_requests SET status = 'completed' WHERE id = $1 RETURNING *", [id]);
  return res.rows.length > 0;
};

export const addActivityLog = async (userId, name, action, details = '') => {
  try {
    const queryText = `
      INSERT INTO activity_logs (user_id, name, action, details)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(queryText, [userId, name, action, details]);
  } catch (error) {
    console.error('Failed to insert activity log:', error);
  }
};
