'use strict';
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    multipleStatements: true
  });

  // Create DB if not exists
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'aspm_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${process.env.DB_NAME || 'aspm_db'}\``);

  const sqlFiles = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of sqlFiles) {
    console.log('[migrate] Running', file);
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await conn.query(sql);
    console.log('[migrate]', file, '✓');
  }

  await conn.end();
  console.log('[migrate] All migrations complete');
}

run().catch(e => { console.error('[migrate] Error:', e.message); process.exit(1); });
