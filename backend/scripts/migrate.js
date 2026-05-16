const fs = require('fs');
const path = require('path');
const pool = require('../db');

const backendRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(backendRoot, 'migrations');

async function ensureMigrationTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename TEXT PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function getAppliedMigrations() {
    const result = await pool.query('SELECT filename FROM schema_migrations');
    return new Set(result.rows.map(row => row.filename));
}

async function runSqlFile(filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    if (!sql.trim()) return;
    await pool.query(sql);
}

async function runMigration(filename) {
    const filePath = path.join(migrationsDir, filename);

    await pool.query('BEGIN');
    try {
        await runSqlFile(filePath);
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await pool.query('COMMIT');
        console.log(`Applied migration: ${filename}`);
    } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
    }
}

async function migrate() {
    const vocabularyTable = await pool.query("SELECT to_regclass('public.vocabulary') AS table_name");
    if (!vocabularyTable.rows[0].table_name) {
        await runSqlFile(path.join(backendRoot, 'init.sql'));
    }

    await ensureMigrationTable();

    const applied = await getAppliedMigrations();
    const migrations = fs.readdirSync(migrationsDir)
        .filter(filename => /^\d+.*\.sql$/.test(filename))
        .sort();

    for (const filename of migrations) {
        if (!applied.has(filename)) {
            await runMigration(filename);
        }
    }
}

if (require.main === module) {
    migrate()
        .then(() => {
            console.log('Database migration complete.');
        })
        .catch((error) => {
            console.error('Database migration failed:', error);
            process.exitCode = 1;
        })
        .finally(() => pool.end());
}

module.exports = migrate;
