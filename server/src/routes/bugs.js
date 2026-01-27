const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { task_id, status } = req.query;
    const pool = await getPool();
    let query = `
      SELECT b.*, t.title as task_title, pr.name as reported_by_name, pa.name as assigned_to_name
      FROM bug_reports b
      LEFT JOIN tasks t ON t.id = b.task_id
      LEFT JOIN profiles pr ON pr.id = b.reported_by
      LEFT JOIN profiles pa ON pa.id = b.assigned_to
      WHERE 1=1
    `;
    const request = pool.request();
    if (task_id) {
      query += ' AND b.task_id = @task_id';
      request.input('task_id', sql.UniqueIdentifier, task_id);
    }
    if (status) {
      query += ' AND b.status = @status';
      request.input('status', sql.NVarChar, status);
    }
    query += ' ORDER BY b.created_at DESC';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bugs' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const bug = await pool.request().input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT b.*, t.title as task_title, pr.name as reported_by_name, pa.name as assigned_to_name
              FROM bug_reports b LEFT JOIN tasks t ON t.id = b.task_id
              LEFT JOIN profiles pr ON pr.id = b.reported_by LEFT JOIN profiles pa ON pa.id = b.assigned_to WHERE b.id = @id`);
    if (bug.recordset.length === 0) return res.status(404).json({ error: 'Bug not found' });

    const attachments = await pool.request().input('bug_id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM bug_attachments WHERE bug_id = @bug_id');
    const comments = await pool.request().input('bug_id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT bc.*, pr.name as author_name FROM bug_comments bc LEFT JOIN profiles pr ON pr.id = bc.author_id WHERE bc.bug_id = @bug_id ORDER BY bc.created_at DESC');

    res.json({ ...bug.recordset[0], attachments: attachments.recordset, comments: comments.recordset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bug' });
  }
});

router.post('/', authenticateToken, requirePermission('bugs', 'can_edit'), async (req, res) => {
  try {
    const { task_id, title, description, steps_to_reproduce, expected_behavior, actual_behavior, severity, assigned_to } = req.body;
    if (!task_id || !title) return res.status(400).json({ error: 'Task and title required' });

    const pool = await getPool();
    const id = uuidv4();
    const bugCount = await pool.request().query('SELECT COUNT(*) as count FROM bug_reports');
    const bugId = `BUG-${String(bugCount.recordset[0].count + 1).padStart(4, '0')}`;

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('task_id', sql.UniqueIdentifier, task_id)
      .input('bug_id', sql.NVarChar, bugId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('steps_to_reproduce', sql.NVarChar, steps_to_reproduce)
      .input('expected_behavior', sql.NVarChar, expected_behavior)
      .input('actual_behavior', sql.NVarChar, actual_behavior)
      .input('severity', sql.NVarChar, severity || 'medium')
      .input('reported_by', sql.UniqueIdentifier, req.user.profile_id)
      .input('assigned_to', sql.UniqueIdentifier, assigned_to || null)
      .query(`INSERT INTO bug_reports (id, task_id, bug_id, title, description, steps_to_reproduce, expected_behavior, actual_behavior, severity, reported_by, assigned_to)
              VALUES (@id, @task_id, @bug_id, @title, @description, @steps_to_reproduce, @expected_behavior, @actual_behavior, @severity, @reported_by, @assigned_to)`);

    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM bug_reports WHERE id = @id');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create bug' });
  }
});

router.put('/:id', authenticateToken, requirePermission('bugs', 'can_edit'), async (req, res) => {
  try {
    const { title, description, steps_to_reproduce, expected_behavior, actual_behavior, status, severity, assigned_to } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('steps_to_reproduce', sql.NVarChar, steps_to_reproduce)
      .input('expected_behavior', sql.NVarChar, expected_behavior)
      .input('actual_behavior', sql.NVarChar, actual_behavior)
      .input('status', sql.NVarChar, status)
      .input('severity', sql.NVarChar, severity)
      .input('assigned_to', sql.UniqueIdentifier, assigned_to)
      .query(`UPDATE bug_reports SET title = COALESCE(@title, title), description = @description, steps_to_reproduce = @steps_to_reproduce,
              expected_behavior = @expected_behavior, actual_behavior = @actual_behavior, status = COALESCE(@status, status),
              severity = COALESCE(@severity, severity), assigned_to = @assigned_to, updated_at = GETUTCDATE() WHERE id = @id`);

    const result = await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('SELECT * FROM bug_reports WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bug' });
  }
});

router.delete('/:id', authenticateToken, requirePermission('bugs', 'can_edit'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM bug_reports WHERE id = @id');
    res.json({ message: 'Bug deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bug' });
  }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const pool = await getPool();
    const id = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('bug_id', sql.UniqueIdentifier, req.params.id)
      .input('content', sql.NVarChar, content)
      .input('author_id', sql.UniqueIdentifier, req.user.profile_id)
      .query('INSERT INTO bug_comments (id, bug_id, content, author_id) VALUES (@id, @bug_id, @content, @author_id)');

    const result = await pool.request().input('id', sql.UniqueIdentifier, id)
      .query('SELECT bc.*, pr.name as author_name FROM bug_comments bc LEFT JOIN profiles pr ON pr.id = bc.author_id WHERE bc.id = @id');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
