import express from 'express';
import pool from '../data/db.js';
import { protect, superAdminOnly } from '../middleware/auth.middleware.js';
import { getPendingResetRequests, updateUserPassword, completeResetRequest, getAllAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../data/store.js';

const router = express.Router();

// Get Activity Logs - Restricted to Super Admin
router.get('/logs', protect, superAdminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100');
    // Map camelCase for frontend
    const logs = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      action: row.action,
      details: row.details,
      timestamp: row.timestamp
    }));
    res.json({ logs });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/reset-requests', protect, superAdminOnly, async (req, res) => {
  try {
    const requests = await getPendingResetRequests();
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/reset-requests/:id', protect, superAdminOnly, async (req, res) => {
  const { id } = req.params;
  const { username, newPassword } = req.body;
  
  try {
    const success = await updateUserPassword(username, newPassword);
    if (success) {
      await completeResetRequest(id);
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to update password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// --- USER MANAGEMENT ROUTES ---
router.get('/users', protect, superAdminOnly, async (req, res) => {
  try {
    const users = await getAllAdminUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', protect, superAdminOnly, async (req, res) => {
  const { name, username, role, password } = req.body;
  try {
    // Check if username exists
    const existing = await pool.query('SELECT id FROM admin_users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const newUser = await createAdminUser(name, username, role, password);
    res.status(201).json({ user: newUser, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id', protect, superAdminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, username, role, password } = req.body;
  try {
    // Check if updating to an existing username
    const existing = await pool.query('SELECT id FROM admin_users WHERE username = $1 AND id != $2', [username, id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username already taken by another user' });
    }
    const updatedUser = await updateAdminUser(id, name, username, role, password);
    res.json({ user: updatedUser, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', protect, superAdminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if trying to delete self
    if (req.user.id === parseInt(id, 10)) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }
    const success = await deleteAdminUser(id);
    if (success) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
