'use strict';
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const { upload } = require('../../services/upload/UploadService');
const R      = require('../../utils/response');
const logger = require('../../utils/logger');
const ScoringEngine = require('../../services/scoring/ScoringEngine');

const SastParser    = require('../../services/parsers/SastParser');
const DastParser    = require('../../services/parsers/DastParser');
const ScaParser     = require('../../services/parsers/ScaParser');
const BasParser     = require('../../services/parsers/BasParser');
const CartParser    = require('../../services/parsers/CartParser');
const FirewallParser= require('../../services/parsers/FirewallParser');
const WafParser     = require('../../services/parsers/WafParser');
const IpsParser     = require('../../services/parsers/IpsParser');
const SiemParser    = require('../../services/parsers/SiemParser');
const PtParser      = require('../../services/parsers/PtParser');
const RedTeamParser = require('../../services/parsers/RedTeamParser');
const AuditParser   = require('../../services/parsers/AuditParser');
const ComplianceParser = require('../../services/parsers/ComplianceParser');

const FW_VENDOR = { firewall_pan:'palo_alto', firewall_fortinet:'fortinet', firewall_checkpoint:'checkpoint' };
const PT_TYPE   = { pt_external:'external_webapp', pt_internal:'internal_webapp', pt_mobile:'mobile' };
const MODEL_MAP = {
  sast:'SastFinding',dast:'DastFinding',sca:'ScaFinding',bas:'BasFinding',cart:'CartFinding',
  firewall_pan:'FirewallRule',firewall_fortinet:'FirewallRule',firewall_checkpoint:'FirewallRule',
  waf:'WafRule',ips:'IpsSignature',siem:'SiemIncident',
  pt_external:'PtFinding',pt_internal:'PtFinding',pt_mobile:'PtFinding',
  redteam:'RedTeamFinding',audit:'AuditFinding',
  os_compliance:'OsComplianceFinding',db_compliance:'DbComplianceFinding'
};

module.exports = {
  uploadMiddleware: upload.single('file'),

  async uploadReport(req, res) {
    const models = req.app.get('models');
    if (!req.file) return R.badRequest(res, 'No file uploaded');
    const { reportType, appId, appName } = req.body;
    if (!reportType) return R.badRequest(res, 'reportType is required');

    const ingId = uuidv4();
    const hist = await models.IngestionHistory.create({
      id: ingId, report_type: reportType, source_type: 'file_upload',
      file_name: req.file.originalname, file_size: req.file.size,
      uploaded_by: req.user?.username || 'system', status: 'processing', started_at: new Date()
    });

    try {
      const fp = req.file.path;
      let parser, records = [];

      if (reportType === 'sast')        { parser = new SastParser();    records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType === 'dast')   { parser = new DastParser();    records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType === 'sca')    { parser = new ScaParser();     records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType === 'bas')    { parser = new BasParser();     records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType === 'cart')   { parser = new CartParser();    records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType.startsWith('firewall')) { parser = new FirewallParser(); records = await parser.parse(fp, FW_VENDOR[reportType] || 'other', ingId); }
      else if (reportType === 'waf')    { parser = new WafParser();     records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType === 'ips')    { parser = new IpsParser();     records = await parser.parse(fp, ingId); }
      else if (reportType === 'siem')   { parser = new SiemParser();    records = await parser.parse(fp, ingId); }
      else if (reportType.startsWith('pt_')) { parser = new PtParser(); records = await parser.parse(fp, PT_TYPE[reportType], appId, appName, ingId); }
      else if (reportType === 'redteam')      { parser = new RedTeamParser(); records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType === 'audit')        { parser = new AuditParser();   records = await parser.parse(fp, appId, appName, ingId); }
      else if (reportType === 'os_compliance'){ parser = new ComplianceParser(); records = await parser.parse(fp, 'os', appId, ingId); }
      else if (reportType === 'db_compliance'){ parser = new ComplianceParser(); records = await parser.parse(fp, 'db', appId, ingId); }
      else throw new Error(`Unknown report type: ${reportType}`);

      const modelKey = MODEL_MAP[reportType];
      const Model    = models[modelKey];
      let inserted   = 0;
      if (Model && records.length) {
        await Model.bulkCreate(records, { ignoreDuplicates: true });
        inserted = records.length;
      }
      const errors = parser?.errors || [];
      const status = errors.length && !inserted ? 'failed' : inserted < records.length ? 'partial' : 'success';
      await hist.update({ total_records: records.length, inserted, failed: errors.length, status, error_log: JSON.stringify(errors.slice(0, 20)), completed_at: new Date() });

      if (appId) {
        const engine = new ScoringEngine(models);
        engine.computeApplicationScore(appId).then(d => {
          const cpx = models.AppPostureScore;
          return cpx.findOne({ where: { app_id: appId } }).then(ex => ex ? ex.update(d) : cpx.create(d));
        }).catch(e => {
          logger.error(`scoring_recompute_failed app=${appId} ingestion=${ingId}: ${e.message}`);
        });
      }
      fs.unlink(fp, () => {});
      return R.success(res, { ingestion_id: ingId, total: records.length, inserted, failed: errors.length, parse_errors: errors.slice(0, 5) });
    } catch(err) {
      await hist.update({ status: 'failed', completed_at: new Date(), error_log: JSON.stringify([{ message: err.message }]) });
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return R.error(res, err.message);
    }
  },

  async getIngestionHistory(req, res) {
    const models = req.app.get('models');
    const { reportType, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (reportType) where.report_type = reportType;
    if (status)     where.status      = status;
    try {
      const { rows, count } = await models.IngestionHistory.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit) });
      return R.paginated(res, rows, count, page, limit);
    } catch(e) { return R.error(res, e.message); }
  },

  async getIngestionById(req, res) {
    const models = req.app.get('models');
    try { const r = await models.IngestionHistory.findByPk(req.params.id); return r ? R.success(res, r) : R.notFound(res); }
    catch(e) { return R.error(res, e.message); }
  }
};
