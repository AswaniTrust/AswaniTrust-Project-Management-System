const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, decoded.id)
      .query(`
        SELECT u.id, u.email, p.id as profile_id, p.name, p.avatar_url, p.designation, ur.role as user_role
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.id = @id
      `);

    if (result.recordset.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = result.recordset[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requirePermission = (permissionKey, type = 'can_view') => {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Auth required' });
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('role', sql.NVarChar, req.user.user_role)
        .input('permission_key', sql.NVarChar, permissionKey)
        .query(`SELECT ${type} as has_permission FROM role_permissions WHERE role = @role AND permission_key = @permission_key`);

      if (result.recordset.length === 0 || !result.recordset[0].has_permission) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = { generateToken, authenticateToken, requirePermission };
