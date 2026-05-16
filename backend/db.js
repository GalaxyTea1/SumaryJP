const { Pool } = require('pg');
require('dotenv').config();

const useSslForDatabaseUrl = process.env.DB_SSL === 'true'
    || (process.env.DB_SSL !== 'false' && process.env.NODE_ENV !== 'test');

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: useSslForDatabaseUrl ? { rejectUnauthorized: false } : false
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
        }
);

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.stack);
});

module.exports = pool;
