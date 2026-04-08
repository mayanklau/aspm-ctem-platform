'use strict';
const cron  = require('node-cron');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const SastParser    = require('../parsers/SastParser');
const DastParser    = require('../parsers/DastParser');
const ScaParser     = require('../parsers/ScaParser');
const BasParser     = require('../parsers/BasParser');
const CartParser    = require('../parsers/CartParser');
const FirewallParser= require('../parsers/FirewallParser');
const WafParser     = require('../parsers/WafParser');
const IpsParser     = require('../parsers/IpsParser');
const SiemParser    = require('../parsers/SiemParser');
const PtParser      = require('../parsers/PtParser');
const RedTeamParser = require('../parsers/RedTeamParser');
const AuditParser   = require('../parsers/AuditParser');
const ComplianceParser = require('../parsers/ComplianceParser');
const ScoringEngine = require('../scoring/ScoringEngine');

const CRONS = { hourly:'0 * * * *', daily:'0 6 * * *', weekly:'0 6 * * 1' };

const MODEL_MAP = {
  sast:'SastFinding',dast:'DastFinding',sca:'ScaFinding',bas:'BasFinding',cart:'CartFinding',
  firewall_pan:'FirewallRule',firewall_fortinet:'FirewallRule',firewall_checkpoint:'FirewallRule',
  firewall:'FirewallRule',waf:'WafRule',ips:'IpsSignature',siem:'SiemIncident',
  pt_external:'PtFinding',pt_internal:'PtFinding',pt_mobile:'PtFinding',
  redteam:'RedTeamFinding',audit:'AuditFinding',os_compliance:'OsComplianceFinding',db_compliance:'DbComplianceFinding'
};
const PT_TYPE = { pt_external:'external_webapp',pt_internal:'internal_webapp',pt_mobile:'mobile' };

class ApiIntegrationScheduler {
  constructor(models) { this.M = models; this.jobs = new Map(); }

  async startAll() {
    try {
      const cfgs = await this.M.IntegrationConfig.findAll({ where: { enabled: 1 } });
      cfgs.forEach(c => this.schedule(c));
      console.log('[Scheduler] Started', cfgs.length, 'jobs');
    } catch(e) { console.warn('[Scheduler] startAll:', e.message); }
  }

  schedule(cfg) {
    const cron_str = cfg.poll_cron || CRONS[cfg.poll_interval] || CRONS.daily;
    if (this.jobs.has(cfg.id)) this.jobs.get(cfg.id).stop();
    const job = cron.schedule(cron_str, () => this.runSync(cfg.id));
    this.jobs.set(cfg.id, job);
  }

  unschedule(id) { if (this.jobs.has(id)) { this.jobs.get(id).stop(); this.jobs.delete(id); } }

  async runSync(configId) {
    const cfg = await this.M.IntegrationConfig.findByPk(configId);
    if (!cfg || !cfg.enabled) return;

    const ingId = uuidv4();
    const hist = await this.M.IngestionHistory.create({
      id: ingId, report_type: cfg.report_type, source_type: 'api_sync', status: 'processing', started_at: new Date()
    });

    try {
      await cfg.update({ last_sync_status: 'running' });
      const rawData = await this._fetch(cfg);
      const records = await this._parse(cfg, rawData, ingId);
      const count   = await this._store(cfg.report_type, records);
      await hist.update({ total_records: records.length, inserted: count, status: 'success', completed_at: new Date() });
      await cfg.update({ last_sync_at: new Date(), last_sync_status: 'success', last_sync_count: count, last_error: null });

      // Trigger score recompute for affected app
      if (cfg.custom_params?.app_id) {
        const engine = new ScoringEngine(this.M);
        engine.computeApplicationScore(cfg.custom_params.app_id)
          .then(d => this.M.AppPostureScore.upsert(d)).catch(() => {});
      }
    } catch(e) {
      await hist.update({ status: 'failed', completed_at: new Date(), error_log: JSON.stringify([{ message: e.message }]) });
      await cfg.update({ last_sync_status: 'failed', last_error: e.message });
    }
  }

  async _fetch(cfg) {
    const headers = {}, creds = cfg.credentials || {};
    if (cfg.auth_type === 'api_key'  && creds.api_key)   headers['X-API-Key']     = creds.api_key;
    if (cfg.auth_type === 'bearer'   && creds.token)      headers['Authorization'] = `Bearer ${creds.token}`;
    if (cfg.auth_type === 'basic'    && creds.username)   headers['Authorization'] = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`;
    const params = { ...(cfg.custom_params || {}) };
    if (cfg.last_sync_at) params.updated_after = cfg.last_sync_at.toISOString();
    const r = await axios.get(cfg.endpoint_url, { headers, params, timeout: 30000 });
    return r.data;
  }

  // Parse raw JSON from API into records using same parsers as file upload
  async _parse(cfg, rawData, ingId) {
    const appId   = cfg.custom_params?.app_id || '';
    const appName = cfg.custom_params?.app_name || '';
    const rt = cfg.report_type;

    // Write to temp JSON, use parsers' JSON path
    const fs = require('fs'), path = require('path'), os = require('os');
    const tmpFile = path.join(os.tmpdir(), `${ingId}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(Array.isArray(rawData) ? rawData : rawData.data || rawData.results || [rawData]));

    let records = [];
    try {
      if (rt === 'sast')          records = await new SastParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'dast')     records = await new DastParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'sca')      records = await new ScaParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'bas')      records = await new BasParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'cart')     records = await new CartParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'waf')      records = await new WafParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'ips')      records = await new IpsParser().parse(tmpFile, ingId);
      else if (rt === 'siem')     records = await new SiemParser().parse(tmpFile, ingId);
      else if (rt.startsWith('pt_')) { const ptType = PT_TYPE[rt]; records = await new PtParser().parse(tmpFile, ptType, appId, appName, ingId); }
      else if (rt === 'redteam')  records = await new RedTeamParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'audit')    records = await new AuditParser().parse(tmpFile, appId, appName, ingId);
      else if (rt === 'os_compliance') records = await new ComplianceParser().parse(tmpFile, 'os', appId, ingId);
      else if (rt === 'db_compliance') records = await new ComplianceParser().parse(tmpFile, 'db', appId, ingId);
    } finally {
      fs.unlink(tmpFile, () => {});
    }
    return records;
  }

  async _store(reportType, records) {
    const modelKey = MODEL_MAP[reportType];
    const Model = this.M[modelKey];
    if (!Model || !records.length) return 0;
    await Model.bulkCreate(records, { ignoreDuplicates: true });
    return records.length;
  }
}

module.exports = ApiIntegrationScheduler;
