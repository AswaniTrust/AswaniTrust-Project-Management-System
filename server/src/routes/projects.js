const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { company_id } = req.query;
    const pool = await getPool();
    let query = 'SELECT p.*, c.name as company_name, c.logo as company_logo FROM projects p LEFT JOIN companies c ON c.id = p.company_id';
    const request = pool.request();
    if (company_id) {
      query += ' WHERE p.company_id = @company_id';
      request.input('company_id', sql.UniqueIdentifier, company_id);
    }
    query += ' ORDER BY p.created_at DESC';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const project = await pool.request().input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT p.*, c.name as company_name FROM projects p LEFT JOIN companies c ON c.id = p.company_id WHERE p.id = @id');
    if (project.recordset.length === 0) return res.status(404).json({ error: 'Project not found' });

    const members = await pool.request().input('project_id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT pm.id as membership_id, pr.id, pr.name, pr.email, pr.avatar_url, pr.designation FROM project_members pm INNER JOIN profiles pr ON pr.id = pm.member_id WHERE pm.project_id = @project_id');

    res.json({ ...project.recordset[0], members: members.recordset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', authenticateToken, requirePermission('projects', 'can_edit'), async (req, res) => {
  try {
    const { company_id, name, type, description } = req.body;
    if (!company_id || !name || !type) return res.status(400).json({ error: 'Company, name, and type required' });

    const pool = await getPool();
    const id = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('company_id', sql.UniqueIdentifier, company_id)
      .input('name', sql.NVarChar, name)
      .input('type', sql.NVarChar, type)
      .input('description', sql.NVarChar, description || null)
      .query('INSERT INTO projects (id, company_id, name, type, description) VALUES (@id, @company_id, @name, @type, @description)');

    const result = await pool.request().input('id', sql.UniqueIdentifier, id)
      .query('SELECT p.*, c.name as company_name FROM projects p LEFT JOIN companies c ON c.id = p.company_id WHERE p.id = @id');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', authenticateToken, requirePermission('projects', 'can_edit'), async (req, res) => {
  try {
    const { name, type, description, company_id } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('type', sql.NVarChar, type)
      .input('description', sql.NVarChar, description)
      .input('company_id', sql.UniqueIdentifier, company_id)
      .query('UPDATE projects SET name = COALESCE(@name, name), type = COALESCE(@type, type), description = @description, company_id = COALESCE(@company_id, company_id), updated_at = GETUTCDATE() WHERE id = @id');

    const result = await pool.request().input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT p.*, c.name as company_name FROM projects p LEFT JOIN companies c ON c.id = p.company_id WHERE p.id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', authenticateToken, requirePermission('projects', 'can_edit'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM projects WHERE id = @id');
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.post('/:id/members', authenticateToken, requirePermission('projects', 'can_edit'), async (req, res) => {
  try {
    const { member_id } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, uuidv4())
      .input('project_id', sql.UniqueIdentifier, req.params.id)
      .input('member_id', sql.UniqueIdentifier, member_id)
      .query('INSERT INTO project_members (id, project_id, member_id) VALUES (@id, @project_id, @member_id)');
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:memberId', authenticateToken, requirePermission('projects', 'can_edit'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('project_id', sql.UniqueIdentifier, req.params.id)
      .input('member_id', sql.UniqueIdentifier, req.params.memberId)
      .query('DELETE FROM project_members WHERE project_id = @project_id AND member_id = @member_id');
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
