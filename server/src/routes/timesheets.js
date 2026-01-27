const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;
    const pool = await getPool();
    let query = `
      SELECT te.*, p.name as project_name, t.title as task_title, pr.name as user_name
      FROM timesheet_entries te
      LEFT JOIN projects p ON p.id = te.project_id
      LEFT JOIN tasks t ON t.id = te.task_id
      LEFT JOIN users u ON u.id = te.user_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE 1=1
    `;
    const request = pool.request();
    
    if (user_id) {
      query += ' AND te.user_id = @user_id';
      request.input('user_id', sql.UniqueIdentifier, user_id);
    }
    if (start_date) {
      query += ' AND te.date >= @start_date';
      request.input('start_date', sql.Date, start_date);
    }
    if (end_date) {
      query += ' AND te.date <= @end_date';
      request.input('end_date', sql.Date, end_date);
    }
    query += ' ORDER BY te.date DESC, te.created_at DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const pool = await getPool();
    let query = `
      SELECT te.*, p.name as project_name, t.title as task_title
      FROM timesheet_entries te
      LEFT JOIN projects p ON p.id = te.project_id
      LEFT JOIN tasks t ON t.id = te.task_id
      WHERE te.user_id = @user_id
    `;
    const request = pool.request().input('user_id', sql.UniqueIdentifier, req.user.id);
    
    if (start_date) {
      query += ' AND te.date >= @start_date';
      request.input('start_date', sql.Date, start_date);
    }
    if (end_date) {
      query += ' AND te.date <= @end_date';
      request.input('end_date', sql.Date, end_date);
    }
    query += ' ORDER BY te.date DESC, te.start_time DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timesheets' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, description, entry_type, start_time, end_time, hours, minutes, total_minutes, project_id, task_id } = req.body;
    if (!date) return res.status(400).json({ error: 'Date required' });

    const pool = await getPool();
    const id = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('user_id', sql.UniqueIdentifier, req.user.id)
      .input('date', sql.Date, date)
      .input('description', sql.NVarChar, description)
      .input('entry_type', sql.NVarChar, entry_type)
      .input('start_time', sql.Time, start_time)
      .input('end_time', sql.Time, end_time)
      .input('hours', sql.Int, hours)
      .input('minutes', sql.Int, minutes)
      .input('total_minutes', sql.Int, total_minutes)
      .input('project_id', sql.UniqueIdentifier, project_id)
      .input('task_id', sql.UniqueIdentifier, task_id)
      .query(`INSERT INTO timesheet_entries (id, user_id, date, description, entry_type, start_time, end_time, hours, minutes, total_minutes, project_id, task_id)
              VALUES (@id, @user_id, @date, @description, @entry_type, @start_time, @end_time, @hours, @minutes, @total_minutes, @project_id, @task_id)`);

    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM timesheet_entries WHERE id = @id');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create timesheet entry' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { date, description, entry_type, start_time, end_time, hours, minutes, total_minutes, project_id, task_id } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('date', sql.Date, date)
      .input('description', sql.NVarChar, description)
      .input('entry_type', sql.NVarChar, entry_type)
      .input('start_time', sql.Time, start_time)
      .input('end_time', sql.Time, end_time)
      .input('hours', sql.Int, hours)
      .input('minutes', sql.Int, minutes)
      .input('total_minutes', sql.Int, total_minutes)
      .input('project_id', sql.UniqueIdentifier, project_id)
      .input('task_id', sql.UniqueIdentifier, task_id)
      .query(`UPDATE timesheet_entries SET date = COALESCE(@date, date), description = @description, entry_type = @entry_type,
              start_time = @start_time, end_time = @end_time, hours = @hours, minutes = @minutes, total_minutes = @total_minutes,
              project_id = @project_id, task_id = @task_id, updated_at = GETUTCDATE() WHERE id = @id`);

    const result = await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('SELECT * FROM timesheet_entries WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update timesheet entry' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM timesheet_entries WHERE id = @id');
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete timesheet entry' });
  }
});

module.exports = router;
