'use strict';

/**
 * ASPM & CTEM Platform — backend entry point.
 *
 * Exposes `createApp()` for tests (no port binding) and only calls
 * `bootstrap()` when run as the main module. Bootstrap handles:
 *
 *   1. Fail-fast env validation (JWT_SECRET in production)
 *   2. DB connect + schema sync
 *   3. Idempotent seed of report weightages and CPR defaults
 *   4. Scheduler start
 *   5. Graceful shutdown on SIGTERM / SIGINT
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const sequelize = require('./config/database');
const models = require('./models');

// ─── Env validation ─────────────────────────────────────────────────────────
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('[FATAL] JWT_SECRET is required in production. Refusing to start.');
  process.exit(1);
}

// ─── CORS allowlist ─────────────────────────────────────────────────────────
function buildCorsOptions() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || raw.trim() === '*') {
    if (isProd) {
      logger.warn('CORS_ORIGINS not set in production — falling back to deny-all');
      return { origin: false };
    }
    return { origin: true, credentials: true };
  }
  const allowlist = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl
      if (allowlist.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
  };
}

// ─── App factory ────────────────────────────────────────────────────────────
function createApp() {
  const app = express();

  // Trust the first proxy hop (load balancer / ingress) so req.ip is real
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Models accessible to controllers via req.app.get('models')
  app.set('models', models);

  // ── Pre-route middleware ─────────────────────────────────────────────────
  app.use(requestId);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors(buildCorsOptions()));
  app.use(compression());
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // HTTP access log → winston
  if (NODE_ENV !== 'test') {
    const fmt = isProd ? 'combined' : 'dev';
    app.use(morgan(fmt, { stream: logger.stream }));
  }

  // Static uploads (read-only). Consider serving these from object storage
  // in production; we expose them here for local convenience only.
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    index: false,
  }));

  // ── Health probes ────────────────────────────────────────────────────────
  app.get('/livez', (_req, res) => res.json({ status: 'ok' }));
  app.get('/healthz', (_req, res) =>
    res.json({ status: 'ok', time: new Date().toISOString() })
  );
  app.get('/readyz', async (_req, res) => {
    try {
      await sequelize.authenticate();
      return res.json({ status: 'ready', db: 'up' });
    } catch (e) {
      return res.status(503).json({ status: 'not_ready', db: 'down', error: e.message });
    }
  });

  // ── API routes ───────────────────────────────────────────────────────────
  app.use('/api', apiLimiter);
  require('./dependency')(app);

  // ── 404 + error handler (must be last) ───────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// ─── Seed data (idempotent) ─────────────────────────────────────────────────
const WEIGHTAGES = [
  { report_type: 'sast', label: 'SAST', weightage: 7 },
  { report_type: 'dast', label: 'DAST', weightage: 7 },
  { report_type: 'sca', label: 'SCA', weightage: 6 },
  { report_type: 'va', label: 'VA Scanner', weightage: 6 },
  { report_type: 'bas', label: 'BAS', weightage: 7 },
  { report_type: 'cart', label: 'CART', weightage: 6 },
  { report_type: 'firewall', label: 'Firewall Rules', weightage: 5 },
  { report_type: 'waf', label: 'WAF Config', weightage: 5 },
  { report_type: 'ips', label: 'IPS Signatures', weightage: 5 },
  { report_type: 'siem', label: 'SIEM / ITSM', weightage: 7 },
  { report_type: 'pt_external', label: 'External Web App PT', weightage: 8 },
  { report_type: 'pt_internal', label: 'Internal Web App PT', weightage: 6 },
  { report_type: 'pt_mobile', label: 'Mobile PT', weightage: 8 },
  { report_type: 'red_team', label: 'Red Team', weightage: 8 },
  { report_type: 'audit', label: 'Audit Findings', weightage: 5 },
  { report_type: 'os_compliance', label: 'OS Compliance', weightage: 5 },
  { report_type: 'db_compliance', label: 'DB Compliance', weightage: 5 },
];

const CPR_DEFAULTS = [
  { app_id: 'APP-001', app_name: 'Internet Banking Portal', business_unit: 'Retail Banking', domain: 'Digital Channels', asset_criticality: 'critical', cpr_score: 4.5 },
  { app_id: 'APP-002', app_name: 'Mobile Banking App', business_unit: 'Retail Banking', domain: 'Digital Channels', asset_criticality: 'critical', cpr_score: 5.2 },
  { app_id: 'APP-003', app_name: 'Core Banking System', business_unit: 'Operations', domain: 'Core Systems', asset_criticality: 'critical', cpr_score: 6.1 },
  { app_id: 'APP-004', app_name: 'Payment Gateway', business_unit: 'Treasury', domain: 'Payments', asset_criticality: 'high', cpr_score: 5.8 },
  { app_id: 'APP-005', app_name: 'Loan Management System', business_unit: 'Lending', domain: 'Lending', asset_criticality: 'high', cpr_score: 6.5 },
];

async function seedDefaults() {
  for (const w of WEIGHTAGES) {
    await models.ReportWeightage.findOrCreate({
      where: { report_type: w.report_type },
      defaults: w,
    });
  }
  for (const c of CPR_DEFAULTS) {
    await models.CprScore.findOrCreate({
      where: { app_id: c.app_id },
      defaults: c,
    });
  }
  logger.info(`Seeded ${WEIGHTAGES.length} weightages and ${CPR_DEFAULTS.length} CPR defaults`);
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────
async function bootstrap() {
  const app = createApp();
  const PORT = parseInt(process.env.PORT || '3001', 10);

  // Optional scheduler
  let scheduler;
  try {
    const ApiIntegrationScheduler = require('./services/integrations/ApiIntegrationScheduler');
    scheduler = new ApiIntegrationScheduler(models);
    app.set('scheduler', scheduler);
  } catch (e) {
    logger.warn(`[Scheduler] not started: ${e.message}`);
  }

  try {
    await sequelize.authenticate();
    logger.info('[DB] Connected to MySQL');
    await sequelize.sync({ alter: false });
    await seedDefaults();
  } catch (e) {
    logger.error(`[DB] connection or sync failed: ${e.message}`);
    process.exit(1);
  }

  if (scheduler) {
    scheduler.startAll().catch((e) => logger.error(`[Scheduler] start error: ${e.message}`));
  }

  const server = app.listen(PORT, () => logger.info(`[Server] listening on :${PORT}`));

  // ── Graceful shutdown ──────────────────────────────────────────────────
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`[Server] received ${signal}, shutting down gracefully…`);

    const forceTimer = setTimeout(() => {
      logger.error('[Server] graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 15000).unref();

    server.close(async (err) => {
      if (err) logger.error(`[Server] close error: ${err.message}`);
      try {
        if (scheduler && typeof scheduler.stopAll === 'function') {
          await scheduler.stopAll();
        }
      } catch (e) {
        logger.warn(`[Scheduler] stop error: ${e.message}`);
      }
      try {
        await sequelize.close();
        logger.info('[DB] connection closed');
      } catch (e) {
        logger.warn(`[DB] close error: ${e.message}`);
      }
      clearTimeout(forceTimer);
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error(`unhandledRejection: ${reason && reason.stack ? reason.stack : reason}`);
  });
  process.on('uncaughtException', (err) => {
    logger.error(`uncaughtException: ${err.stack || err.message}`);
    shutdown('uncaughtException');
  });

  return { app, server };
}

if (require.main === module) {
  bootstrap();
}

module.exports = { createApp, bootstrap };
