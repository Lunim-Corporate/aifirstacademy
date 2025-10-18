// db/index.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/certdb'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
