const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name required' });

    const pool = await getPool();
    const existing = await pool.request().input('email', sql.NVarChar, email).query('SELECT id FROM users WHERE email = @email');
    if (existing.recordset.length > 0) return res.status(400).json({ error: 'User already exists' });

    const userCount = await pool.request().query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = userCount.recordset[0].count === 0;

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
      .query('INSERT INTO profiles (id, user_id, name, email) VALUES (@id, @user_id, @name, @email)');

    const role = isFirstUser ? 'admin' : 'backend_developer';
    await pool.request()
      .input('id', sql.UniqueIdentifier, uuidv4())
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('role', sql.NVarChar, role)
      .query('INSERT INTO user_roles (id, user_id, role) VALUES (@id, @user_id, @role)');

    const token = generateToken({ id: userId, email });
    res.status(201).json({ user: { id: userId, email, name, user_role: role, profile_id: profileId }, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT u.id, u.email, u.password_hash, p.id as profile_id, p.name, p.avatar_url, p.designation, ur.role as user_role
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.email = @email
      `);

    if (result.recordset.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.recordset[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await pool.request().input('id', sql.UniqueIdentifier, user.id).query('UPDATE users SET last_sign_in_at = GETUTCDATE() WHERE id = @id');

    delete user.password_hash;
    const token = generateToken({ id: user.id, email: user.email });
    res.json({ user, token });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const permissions = await pool.request()
      .input('role', sql.NVarChar, req.user.user_role)
      .query('SELECT permission_key, can_view, can_edit FROM role_permissions WHERE role = @role');
    res.json({ user: req.user, permissions: permissions.recordset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = await getPool();
    const result = await pool.request().input('id', sql.UniqueIdentifier, req.user.id).query('SELECT password_hash FROM users WHERE id = @id');
    
    const valid = await bcrypt.compare(currentPassword, result.recordset[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.request().input('id', sql.UniqueIdentifier, req.user.id).input('hash', sql.NVarChar, newHash)
      .query('UPDATE users SET password_hash = @hash, updated_at = GETUTCDATE() WHERE id = @id');
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar_url, designation } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.UniqueIdentifier, req.user.id)
      .input('name', sql.NVarChar, name)
      .input('avatar_url', sql.NVarChar, avatar_url)
      .input('designation', sql.NVarChar, designation)
      .query('UPDATE profiles SET name = COALESCE(@name, name), avatar_url = @avatar_url, designation = @designation, updated_at = GETUTCDATE() WHERE user_id = @user_id');
    
    const result = await pool.request().input('user_id', sql.UniqueIdentifier, req.user.id).query('SELECT * FROM profiles WHERE user_id = @user_id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
