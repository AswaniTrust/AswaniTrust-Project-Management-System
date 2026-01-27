const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, status } = req.query;
    const pool = await getPool();
    let query = `
      SELECT t.*, p.name as project_name, p.type as project_type, c.name as company_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN companies c ON c.id = p.company_id
      WHERE 1=1
    `;
    const request = pool.request();
    if (project_id) {
      query += ' AND t.project_id = @project_id';
      request.input('project_id', sql.UniqueIdentifier, project_id);
    }
    if (status) {
      query += ' AND t.status = @status';
      request.input('status', sql.NVarChar, status);
    }
    query += ' ORDER BY t.created_at DESC';
    const result = await request.query(query);

    // Get assignees for each task
    for (let task of result.recordset) {
      const assignees = await pool.request().input('task_id', sql.UniqueIdentifier, task.id)
        .query('SELECT pr.id, pr.name, pr.email, pr.avatar_url FROM task_assignees ta INNER JOIN profiles pr ON pr.id = ta.assignee_id WHERE ta.task_id = @task_id');
      task.assignees = assignees.recordset;
    }
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const task = await pool.request().input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT t.*, p.name as project_name, c.name as company_name FROM tasks t
              LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN companies c ON c.id = p.company_id WHERE t.id = @id`);
    if (task.recordset.length === 0) return res.status(404).json({ error: 'Task not found' });

    const assignees = await pool.request().input('task_id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT pr.* FROM task_assignees ta INNER JOIN profiles pr ON pr.id = ta.assignee_id WHERE ta.task_id = @task_id');
    const comments = await pool.request().input('task_id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT tc.*, pr.name as author_name, pr.avatar_url as author_avatar FROM task_comments tc LEFT JOIN profiles pr ON pr.id = tc.author_id WHERE tc.task_id = @task_id ORDER BY tc.created_at DESC');

    res.json({ ...task.recordset[0], assignees: assignees.recordset, comments: comments.recordset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', authenticateToken, requirePermission('tasks', 'can_edit'), async (req, res) => {
  try {
    const { project_id, title, description, status, priority, due_date, assignee_ids } = req.body;
    if (!project_id || !title) return res.status(400).json({ error: 'Project and title required' });

    const pool = await getPool();
    const id = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('project_id', sql.UniqueIdentifier, project_id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || null)
      .input('status', sql.NVarChar, status || 'draft')
      .input('priority', sql.NVarChar, priority || 'medium')
      .input('due_date', sql.Date, due_date || null)
      .query('INSERT INTO tasks (id, project_id, title, description, status, priority, due_date) VALUES (@id, @project_id, @title, @description, @status, @priority, @due_date)');

    if (assignee_ids && assignee_ids.length > 0) {
      for (const assigneeId of assignee_ids) {
        await pool.request()
          .input('id', sql.UniqueIdentifier, uuidv4())
          .input('task_id', sql.UniqueIdentifier, id)
          .input('assignee_id', sql.UniqueIdentifier, assigneeId)
          .query('INSERT INTO task_assignees (id, task_id, assignee_id) VALUES (@id, @task_id, @assignee_id)');
      }
    }

    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM tasks WHERE id = @id');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', authenticateToken, requirePermission('tasks', 'can_edit'), async (req, res) => {
  try {
    const { title, description, status, priority, due_date, assignee_ids } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('status', sql.NVarChar, status)
      .input('priority', sql.NVarChar, priority)
      .input('due_date', sql.Date, due_date)
      .query('UPDATE tasks SET title = COALESCE(@title, title), description = @description, status = COALESCE(@status, status), priority = COALESCE(@priority, priority), due_date = @due_date, updated_at = GETUTCDATE() WHERE id = @id');

    if (assignee_ids) {
      await pool.request().input('task_id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM task_assignees WHERE task_id = @task_id');
      for (const assigneeId of assignee_ids) {
        await pool.request()
          .input('id', sql.UniqueIdentifier, uuidv4())
          .input('task_id', sql.UniqueIdentifier, req.params.id)
          .input('assignee_id', sql.UniqueIdentifier, assigneeId)
          .query('INSERT INTO task_assignees (id, task_id, assignee_id) VALUES (@id, @task_id, @assignee_id)');
      }
    }

    const result = await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('SELECT * FROM tasks WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', authenticateToken, requirePermission('tasks', 'can_edit'), async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM tasks WHERE id = @id');
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Task comments
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const pool = await getPool();
    const id = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('task_id', sql.UniqueIdentifier, req.params.id)
      .input('content', sql.NVarChar, content)
      .input('author_id', sql.UniqueIdentifier, req.user.profile_id)
      .query('INSERT INTO task_comments (id, task_id, content, author_id) VALUES (@id, @task_id, @content, @author_id)');

    const result = await pool.request().input('id', sql.UniqueIdentifier, id)
      .query('SELECT tc.*, pr.name as author_name FROM task_comments tc LEFT JOIN profiles pr ON pr.id = tc.author_id WHERE tc.id = @id');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
