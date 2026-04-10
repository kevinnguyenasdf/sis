const { Pool } = require('pg');

// Strip SSL params from connection string so the pool ssl option takes full control
const connectionString = process.env.DATABASE_URL?.replace(/[?&]ssl(mode)?=[^&]*/g, '').replace(/[?&]$/, '');

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Convert SQLite-style ? placeholders to PostgreSQL $1, $2, ...
function convertParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

module.exports = {
  query: async (sql, params = []) => {
    try {
      const result = await pool.query(convertParams(sql), params);
      return [result.rows];
    } catch (err) {
      // Remap pg unique violation to the code routes already check for
      if (err.code === '23505') err.code = 'ER_DUP_ENTRY';
      throw err;
    }
  },
};
