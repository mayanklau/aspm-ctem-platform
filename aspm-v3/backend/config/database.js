'use strict';

/**
 * Sequelize instance — MySQL dialect.
 *
 * Everything is driven from environment variables. Connection pool sizing,
 * SSL, and slow-query logging are all tunable without code changes.
 *
 * In production we fail fast if DB_HOST / DB_USER / DB_NAME are missing so
 * the container crash-loops visibly instead of silently connecting to a
 * misconfigured default.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const {
  NODE_ENV = 'development',
  DB_HOST,
  DB_PORT = '3306',
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_POOL_MAX = '10',
  DB_POOL_MIN = '0',
  DB_POOL_ACQUIRE_MS = '30000',
  DB_POOL_IDLE_MS = '10000',
  DB_SSL = 'false',
  DB_SLOW_QUERY_MS = '500',
} = process.env;

const isProd = NODE_ENV === 'production';

if (isProd) {
  const missing = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(
      `[FATAL] Missing required env vars in production: ${missing.join(', ')}`
    );
    process.exit(1);
  }
}

const dialectOptions = {};
if (String(DB_SSL).toLowerCase() === 'true') {
  dialectOptions.ssl = { require: true, rejectUnauthorized: false };
}

const slowMs = parseInt(DB_SLOW_QUERY_MS, 10);

const sequelize = new Sequelize(
  DB_NAME || 'aspm_db',
  DB_USER || 'root',
  DB_PASS || '',
  {
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT, 10),
    dialect: 'mysql',
    dialectOptions,
    pool: {
      max: parseInt(DB_POOL_MAX, 10),
      min: parseInt(DB_POOL_MIN, 10),
      acquire: parseInt(DB_POOL_ACQUIRE_MS, 10),
      idle: parseInt(DB_POOL_IDLE_MS, 10),
    },
    define: { timestamps: true, underscored: true },
    logging: (sql, timingMs) => {
      if (NODE_ENV === 'development') {
        logger.debug(sql);
      } else if (typeof timingMs === 'number' && timingMs >= slowMs) {
        logger.warn(`slow_query ${timingMs}ms :: ${sql}`);
      }
    },
    benchmark: true,
  }
);

module.exports = sequelize;
