const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all team members
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.*, ur.role as user_role
      FROM profiles p
      LEFT JOIN user_roles ur ON ur.user_id = p.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get team member stats/leaderboard
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT tms.*, p.name, p.email, p.avatar_url, p.designation, ur.role as user_role
      FROM team_member_stats tms
      INNER JOIN profiles p ON p.id = tms.profile_id
      LEFT JOIN user_roles ur ON ur.user_id = p.user_id
      ORDER BY tms.score DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team stats' });
  }
});

// Create team member
router.post('/members', authenticateToken, requirePermission('team_members', 'can_edit'), async (req, res) => {
  try {
    const { name, email, password, role, designation } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Name, email, password, and role required' });

    const pool = await getPool();
    const existing = await pool.request().input('email', sql.NVarChar, email).query('SELECT id FROM users WHERE email = @email');
    if (existing.recordset.length > 0) return res.status(400).json({ error: 'User already exists' });

    const userId = uuidv4();
    const profileId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('id', sql.UniqueIdentifier, userId)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, passwordHash)
      .query('INSERT INTO users (id, email, password_hash, email_confirmed) VALUES (@id, @email, @password_hash, 1)');

    await pool.request()
      .input('id', sql.UniqueIdentifier, profileId)
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('designation', sql.NVarChar, designation)
      .query('INSERT INTO profiles (id, user_id, name, email, designation) VALUES (@id, @user_id, @name, @email, @designation)');

    await pool.request()
      .input('id', sql.UniqueIdentifier, uuidv4())
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('role', sql.NVarChar, role)
      .query('INSERT INTO user_roles (id, user_id, role) VALUES (@id, @user_id, @role)');

    // Create stats entry
    await pool.request()
      .input('id', sql.UniqueIdentifier, uuidv4())
      .input('profile_id', sql.UniqueIdentifier, profileId)
      .query('INSERT INTO team_member_stats (id, profile_id) VALUES (@id, @profile_id)');

    res.status(201).json({ id: profileId, name, email, role, designation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

// Update team member role
router.put('/members/:id/role', authenticateToken, requirePermission('team_members', 'can_edit'), async (req, res) => {
  try {
    const { role } = req.body;
    const pool = await getPool();
    
    // Get user_id from profile
    const profile = await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('SELECT user_id FROM profiles WHERE id = @id');
    if (profile.recordset.length === 0) return res.status(404).json({ error: 'Member not found' });

    await pool.request()
      .input('user_id', sql.UniqueIdentifier, profile.recordset[0].user_id)
      .input('role', sql.NVarChar, role)
      .query('UPDATE user_roles SET role = @role, updated_at = GETUTCDATE() WHERE user_id = @user_id');

    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Get role permissions
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM role_permissions ORDER BY role, permission_key');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Update role permission
router.put('/permissions', authenticateToken, requirePermission('settings', 'can_edit'), async (req, res) => {
  try {
    const { role, permission_key, can_view, can_edit } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('role', sql.NVarChar, role)
      .input('permission_key', sql.NVarChar, permission_key)
      .input('can_view', sql.Bit, can_view)
      .input('can_edit', sql.Bit, can_edit)
      .query(`UPDATE role_permissions SET can_view = @can_view, can_edit = @can_edit, updated_at = GETUTCDATE() WHERE role = @role AND permission_key = @permission_key`);
    res.json({ message: 'Permission updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

module.exports = router;
