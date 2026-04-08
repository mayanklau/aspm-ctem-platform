'use strict';

/**
 * ASPM/CTEM Platform — All API Routes
 *
 * Auth policy:
 *   - GET endpoints use auth.optional (read-only). Production deployments
 *     SHOULD swap these to auth.required by setting REQUIRE_READ_AUTH=true.
 *   - Every mutating endpoint (POST/PUT/PATCH/DELETE) uses auth.required.
 *   - The dev token endpoint is only mounted outside production.
 */

const auth = require('./middleware/auth');
const R = require('./utils/response');
const { uploadLimiter } = require('./middleware/rateLimit');

const uploadCtrl = require('./controllers/upload');
const scoringCtrl = require('./controllers/scoring');
const integrCtrl = require('./controllers/integrations');
const sastCtrl = require('./controllers/reports/sast');
const dastCtrl = require('./controllers/reports/dast');
const scaCtrl = require('./controllers/reports/sca');
const basCtrl = require('./controllers/reports/bas');
const cartCtrl = require('./controllers/reports/cart');
const firewallCtrl = require('./controllers/reports/firewall');
const wafCtrl = require('./controllers/reports/waf');
const ipsCtrl = require('./controllers/reports/ips');
const siemCtrl = require('./controllers/reports/siem');
const ptCtrl = require('./controllers/reports/pt');
const redteamCtrl = require('./controllers/reports/redteam');
const auditCtrl = require('./controllers/reports/audit');
const complianceCtrl = require('./controllers/reports/compliance');

// Read auth: configurable. Production deployments may set REQUIRE_READ_AUTH=true
// to force authentication on every API call.
const readAuth =
  String(process.env.REQUIRE_READ_AUTH || 'false').toLowerCase() === 'true'
    ? auth.required
    : auth.optional;

// Mutating auth: ALWAYS required.
const writeAuth = auth.required;

module.exports = function (app) {
  // ── Dev-only token issuance ─────────────────────────────────────────────
  // Lets developers bootstrap a JWT for local testing without standing up an
  // IdP. Mounted only outside production.
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/auth/dev-token', (req, res) => {
      const username = (req.body && req.body.username) || 'dev';
      const role = (req.body && req.body.role) || 'admin';
      const token = auth.signToken({ username, role }, { expiresIn: '8h' });
      return R.success(res, { token, username, role, expiresIn: '8h' });
    });
  }

  // ── Upload & Ingestion ──────────────────────────────────────────────────
  app.post('/api/reports/upload', uploadLimiter, writeAuth, uploadCtrl.uploadMiddleware, uploadCtrl.uploadReport);
  app.get('/api/reports/ingestion-history', readAuth, uploadCtrl.getIngestionHistory);
  app.get('/api/reports/ingestion/:id', readAuth, uploadCtrl.getIngestionById);

  // ── SAST ─────────────────────────────────────────────────────────────────
  app.get('/api/reports/sast', readAuth, sastCtrl.list);
  app.get('/api/reports/sast/summary', readAuth, sastCtrl.summary);
  app.get('/api/reports/sast/:id', readAuth, sastCtrl.getById);
  app.patch('/api/reports/sast/:id/status', writeAuth, sastCtrl.updateStatus);

  // ── DAST ─────────────────────────────────────────────────────────────────
  app.get('/api/reports/dast', readAuth, dastCtrl.list);
  app.get('/api/reports/dast/summary', readAuth, dastCtrl.summary);
  app.get('/api/reports/dast/:id', readAuth, dastCtrl.getById);
  app.patch('/api/reports/dast/:id/status', writeAuth, dastCtrl.updateStatus);

  // ── SCA ──────────────────────────────────────────────────────────────────
  app.get('/api/reports/sca', readAuth, scaCtrl.list);
  app.get('/api/reports/sca/summary', readAuth, scaCtrl.summary);
  app.get('/api/reports/sca/:id', readAuth, scaCtrl.getById);
  app.patch('/api/reports/sca/:id/status', writeAuth, scaCtrl.updateStatus);

  // ── BAS ──────────────────────────────────────────────────────────────────
  app.get('/api/reports/bas', readAuth, basCtrl.list);
  app.get('/api/reports/bas/summary', readAuth, basCtrl.summary);
  app.get('/api/reports/bas/:id', readAuth, basCtrl.getById);

  // ── CART ─────────────────────────────────────────────────────────────────
  app.get('/api/reports/cart', readAuth, cartCtrl.list);
  app.get('/api/reports/cart/:id', readAuth, cartCtrl.getById);

  // ── Firewall ─────────────────────────────────────────────────────────────
  app.get('/api/reports/firewall', readAuth, firewallCtrl.list);
  app.get('/api/reports/firewall/summary', readAuth, firewallCtrl.summary);
  app.get('/api/reports/firewall/:id', readAuth, firewallCtrl.getById);

  // ── WAF ──────────────────────────────────────────────────────────────────
  app.get('/api/reports/waf', readAuth, wafCtrl.list);
  app.get('/api/reports/waf/summary', readAuth, wafCtrl.summary);
  app.get('/api/reports/waf/:id', readAuth, wafCtrl.getById);

  // ── IPS ──────────────────────────────────────────────────────────────────
  app.get('/api/reports/ips', readAuth, ipsCtrl.list);
  app.get('/api/reports/ips/summary', readAuth, ipsCtrl.summary);
  app.get('/api/reports/ips/:id', readAuth, ipsCtrl.getById);

  // ── SIEM / ITSM ──────────────────────────────────────────────────────────
  app.get('/api/reports/siem', readAuth, siemCtrl.list);
  app.get('/api/reports/siem/killchain', readAuth, siemCtrl.killChainDistribution);
  app.get('/api/reports/siem/summary', readAuth, siemCtrl.summary);
  app.get('/api/reports/siem/:id', readAuth, siemCtrl.getById);
  app.patch('/api/reports/siem/:id/status', writeAuth, siemCtrl.updateStatus);

  // ── Penetration Testing ───────────────────────────────────────────────────
  app.get('/api/reports/pt', readAuth, ptCtrl.list);
  app.get('/api/reports/pt/summary', readAuth, ptCtrl.summary);
  app.get('/api/reports/pt/:id', readAuth, ptCtrl.getById);
  app.patch('/api/reports/pt/:id/status', writeAuth, ptCtrl.updateStatus);
  app.patch('/api/reports/pt/:id/retest', writeAuth, ptCtrl.updateRetest);

  // ── Red Team ─────────────────────────────────────────────────────────────
  app.get('/api/reports/redteam', readAuth, redteamCtrl.list);
  app.get('/api/reports/redteam/summary', readAuth, redteamCtrl.summary);
  app.get('/api/reports/redteam/:id', readAuth, redteamCtrl.getById);

  // ── Audit ─────────────────────────────────────────────────────────────────
  app.get('/api/reports/audit', readAuth, auditCtrl.list);
  app.get('/api/reports/audit/summary', readAuth, auditCtrl.summary);
  app.get('/api/reports/audit/:id', readAuth, auditCtrl.getById);
  app.patch('/api/reports/audit/:id/status', writeAuth, auditCtrl.updateStatus);

  // ── Compliance (OS + DB) ──────────────────────────────────────────────────
  app.get('/api/reports/compliance', readAuth, complianceCtrl.list);
  app.get('/api/reports/compliance/summary', readAuth, complianceCtrl.summary);
  app.get('/api/reports/compliance/:id', readAuth, complianceCtrl.getById);
  app.post('/api/reports/compliance/oracle-sync', writeAuth, complianceCtrl.oracleSync);

  // ── Scoring ───────────────────────────────────────────────────────────────
  app.get('/api/scores/applications', readAuth, scoringCtrl.getAllApplicationScores);
  app.get('/api/scores/application/:appId', readAuth, scoringCtrl.getApplicationScore);
  app.post('/api/scores/application/:appId/compute', writeAuth, scoringCtrl.recomputeApplicationScore);
  app.get('/api/scores/application/:appId/trend', readAuth, scoringCtrl.getScoreTrend);
  app.get('/api/scores/enterprise', readAuth, scoringCtrl.getEnterpriseScores);
  app.get('/api/scores/coverage', readAuth, scoringCtrl.getCoverageHeatmap);
  app.get('/api/scores/weightages', readAuth, scoringCtrl.getWeightages);
  app.put('/api/scores/weightages', writeAuth, auth.requireRole('admin'), scoringCtrl.updateWeightages);

  // ── Integrations ─────────────────────────────────────────────────────────
  app.get('/api/integrations', readAuth, integrCtrl.list);
  app.post('/api/integrations', writeAuth, auth.requireRole('admin'), integrCtrl.create);
  app.put('/api/integrations/:id', writeAuth, auth.requireRole('admin'), integrCtrl.update);
  app.delete('/api/integrations/:id', writeAuth, auth.requireRole('admin'), integrCtrl.delete);
  app.post('/api/integrations/:id/sync', writeAuth, integrCtrl.triggerSync);
  app.post('/api/integrations/test-connection', writeAuth, integrCtrl.testConnection);
};
