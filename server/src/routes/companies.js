const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM companies ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('SELECT * FROM companies WHERE id = @id');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Company not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

router.post('/', authenticateToken, requirePermission('companies', 'can_edit'), async (req, res) => {
  try {
    const { name, logo } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const pool = await getPool();
    const id = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar, name)
      .input('logo', sql.NVarChar, logo || null)
      .query('INSERT INTO companies (id, name, logo) VALUES (@id, @name, @logo)');

    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM companies WHERE id = @id');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.put('/:id', authenticateToken, requirePermission('companies', 'can_edit'), async (req, res) => {
  try {
    const { name, logo } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('logo', sql.NVarChar, logo)
      .query('UPDATE companies SET name = COALESCE(@name, name), logo = @logo, updated_at = GETUTCDATE() WHERE id = @id');

    const result = await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('SELECT * FROM companies WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company' });
  }
});

router.delete('/:id', authenticateToken, requirePermission('companies', 'can_edit'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM companies WHERE id = @id');
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

module.exports = router;
