const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getPool, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// Upload file
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { project_id, task_id } = req.body;
    const pool = await getPool();
    const id = uuidv4();
    const url = `/uploads/${req.file.filename}`;

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar, req.file.originalname)
      .input('url', sql.NVarChar, url)
      .input('type', sql.NVarChar, req.file.mimetype)
      .input('size', sql.BigInt, req.file.size)
      .input('uploaded_by', sql.UniqueIdentifier, req.user.profile_id)
      .input('project_id', sql.UniqueIdentifier, project_id || null)
      .input('task_id', sql.UniqueIdentifier, task_id || null)
      .query(`INSERT INTO documents (id, name, url, type, size, uploaded_by, project_id, task_id)
              VALUES (@id, @name, @url, @type, @size, @uploaded_by, @project_id, @task_id)`);

    res.status(201).json({ id, name: req.file.originalname, url, type: req.file.mimetype, size: req.file.size });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, task_id } = req.query;
    const pool = await getPool();
    let query = 'SELECT d.*, p.name as uploader_name FROM documents d LEFT JOIN profiles p ON p.id = d.uploaded_by WHERE 1=1';
    const request = pool.request();
    
    if (project_id) {
      query += ' AND d.project_id = @project_id';
      request.input('project_id', sql.UniqueIdentifier, project_id);
    }
    if (task_id) {
      query += ' AND d.task_id = @task_id';
      request.input('task_id', sql.UniqueIdentifier, task_id);
    }
    query += ' ORDER BY d.created_at DESC';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const doc = await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('SELECT url FROM documents WHERE id = @id');
    
    if (doc.recordset.length > 0) {
      const filePath = path.join(__dirname, '../..', doc.recordset[0].url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    
    await pool.request().input('id', sql.UniqueIdentifier, req.params.id).query('DELETE FROM documents WHERE id = @id');
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
