const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.YUGABYTE_CA_CERT?.replace(/\\n/g, '\n'),
  },
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
