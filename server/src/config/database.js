const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'ProjectManagementDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

const getPool = async () => {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('Connected to MSSQL database');
  }
  return pool;
};

const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};

module.exports = { sql, getPool, closePool };
