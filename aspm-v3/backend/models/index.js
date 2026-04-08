'use strict';
const sequelize  = require('../config/database');
const { DataTypes } = require('sequelize');

const M = {};

function def(tableName, attrs) {
  return sequelize.define(tableName, attrs, { tableName, underscored: true, timestamps: true });
}

M.CprScore = def('cpr_scores', {
  id:               { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id:           { type: DataTypes.STRING(100), unique: true },
  app_name:         { type: DataTypes.STRING(200) },
  business_unit:    { type: DataTypes.STRING(200) },
  domain:           { type: DataTypes.STRING(200) },
  asset_criticality:{ type: DataTypes.ENUM('critical','high','medium','low'), defaultValue: 'medium' },
  env_score:        { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  vuln_score:       { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  cpr_score:        { type: DataTypes.DECIMAL(5,2), defaultValue: 5 },
});

M.ReportWeightage = def('report_weightages', {
  id:          { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  report_type: { type: DataTypes.STRING(50), unique: true },
  label:       { type: DataTypes.STRING(200) },
  weightage:   { type: DataTypes.DECIMAL(4,1) },
  max_weight:  { type: DataTypes.DECIMAL(4,1), defaultValue: 8 },
  enabled:     { type: DataTypes.TINYINT, defaultValue: 1 },
  updated_by:  { type: DataTypes.STRING(100) }
});

M.IngestionHistory = def('ingestion_history', {
  id:            { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  report_type:   { type: DataTypes.STRING(50) },
  source_type:   { type: DataTypes.ENUM('file_upload','api_sync','oracle_sync'), defaultValue: 'file_upload' },
  file_name:     { type: DataTypes.STRING(500) },
  file_size:     { type: DataTypes.BIGINT },
  uploaded_by:   { type: DataTypes.STRING(100) },
  total_records: { type: DataTypes.INTEGER, defaultValue: 0 },
  inserted:      { type: DataTypes.INTEGER, defaultValue: 0 },
  failed:        { type: DataTypes.INTEGER, defaultValue: 0 },
  status:        { type: DataTypes.ENUM('pending','processing','success','partial','failed'), defaultValue: 'pending' },
  error_log:     { type: DataTypes.JSON, defaultValue: [] },
  started_at:    { type: DataTypes.DATE },
  completed_at:  { type: DataTypes.DATE }
});

M.IntegrationConfig = def('integration_configs', {
  id:               { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:             { type: DataTypes.STRING(200) },
  report_type:      { type: DataTypes.STRING(50) },
  tool:             { type: DataTypes.STRING(100) },
  endpoint_url:     { type: DataTypes.STRING(500) },
  auth_type:        { type: DataTypes.ENUM('api_key','oauth2','basic','bearer'), defaultValue: 'api_key' },
  credentials:      { type: DataTypes.JSON },
  poll_interval:    { type: DataTypes.ENUM('hourly','daily','weekly','manual'), defaultValue: 'daily' },
  poll_cron:        { type: DataTypes.STRING(100) },
  enabled:          { type: DataTypes.TINYINT, defaultValue: 1 },
  last_sync_at:     { type: DataTypes.DATE },
  last_sync_status: { type: DataTypes.ENUM('success','failed','running','never_run'), defaultValue: 'never_run' },
  last_sync_count:  { type: DataTypes.INTEGER, defaultValue: 0 },
  last_error:       { type: DataTypes.TEXT },
  custom_params:    { type: DataTypes.JSON, defaultValue: {} }
});

M.AppPostureScore = def('app_posture_scores', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id:               { type: DataTypes.STRING(100), unique: true },
  app_name:             { type: DataTypes.STRING(200) },
  business_unit:        { type: DataTypes.STRING(200) },
  domain:               { type: DataTypes.STRING(200) },
  asset_criticality:    { type: DataTypes.ENUM('critical','high','medium','low'), defaultValue: 'medium' },
  sast_norm_score:      { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  dast_norm_score:      { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  sca_norm_score:       { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  va_norm_score:        { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  bas_norm_score:       { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  cart_norm_score:      { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  waf_norm_score:       { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  ips_norm_score:       { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  fw_norm_score:        { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  siem_norm_score:      { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  pt_ext_norm_score:    { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  pt_int_norm_score:    { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  pt_mobile_norm_score: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  red_team_norm_score:  { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  audit_norm_score:     { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  os_comp_norm_score:   { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  db_comp_norm_score:   { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  new_app_security_score: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  cpr_score:            { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  final_posture_score:  { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  reports_assessed:     { type: DataTypes.JSON, defaultValue: [] },
  reports_not_assessed: { type: DataTypes.JSON, defaultValue: [] },
  coverage_percentage:  { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  total_critical:       { type: DataTypes.INTEGER, defaultValue: 0 },
  total_high:           { type: DataTypes.INTEGER, defaultValue: 0 },
  total_medium:         { type: DataTypes.INTEGER, defaultValue: 0 },
  total_low:            { type: DataTypes.INTEGER, defaultValue: 0 },
  total_open:           { type: DataTypes.INTEGER, defaultValue: 0 },
  last_computed_at:     { type: DataTypes.DATE }
});

M.ScoreHistory = def('score_history', {
  id:                    { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id:                { type: DataTypes.STRING(100) },
  snapshot_date:         { type: DataTypes.DATEONLY },
  new_app_security_score:{ type: DataTypes.DECIMAL(5,2) },
  cpr_score:             { type: DataTypes.DECIMAL(5,2) },
  final_posture_score:   { type: DataTypes.DECIMAL(5,2) },
  total_critical:        { type: DataTypes.INTEGER },
  total_high:            { type: DataTypes.INTEGER },
  coverage_percentage:   { type: DataTypes.DECIMAL(5,2) }
});

// ── Report Finding Models ────────────────────────────────────────────────────
M.SastFinding = def('sast_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id: { type: DataTypes.STRING(100) }, app_name: { type: DataTypes.STRING(200) },
  tool: { type: DataTypes.STRING(50) }, scan_date: { type: DataTypes.DATEONLY },
  rule_id: { type: DataTypes.STRING(100) }, file_path: { type: DataTypes.STRING(500) },
  line_number: { type: DataTypes.INTEGER }, vulnerability_type: { type: DataTypes.STRING(200) },
  cwe_id: { type: DataTypes.STRING(20) },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'low' },
  severity_score: { type: DataTypes.DECIMAL(4,1) },
  title: { type: DataTypes.STRING(500) }, description: { type: DataTypes.TEXT },
  remediation: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open','in_progress','resolved','accepted_risk','false_positive'), defaultValue: 'open' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.DastFinding = def('dast_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id: { type: DataTypes.STRING(100) }, app_name: { type: DataTypes.STRING(200) },
  tool: { type: DataTypes.STRING(50) }, scan_date: { type: DataTypes.DATEONLY },
  alert_type: { type: DataTypes.STRING(200) }, cwe_id: { type: DataTypes.STRING(20) },
  affected_url: { type: DataTypes.STRING(1000) }, http_method: { type: DataTypes.STRING(10) },
  parameter: { type: DataTypes.STRING(200) }, attack: { type: DataTypes.TEXT },
  evidence: { type: DataTypes.TEXT },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'low' },
  severity_score: { type: DataTypes.DECIMAL(4,1) },
  title: { type: DataTypes.STRING(500) }, description: { type: DataTypes.TEXT }, solution: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open','in_progress','resolved','accepted_risk','false_positive'), defaultValue: 'open' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.ScaFinding = def('sca_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id: { type: DataTypes.STRING(100) }, app_name: { type: DataTypes.STRING(200) },
  tool: { type: DataTypes.STRING(50) }, scan_date: { type: DataTypes.DATEONLY },
  library_name: { type: DataTypes.STRING(300) }, library_version: { type: DataTypes.STRING(50) },
  cve_id: { type: DataTypes.STRING(50) }, cvss_score: { type: DataTypes.DECIMAL(4,1) },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'low' },
  severity_score: { type: DataTypes.DECIMAL(4,1) },
  title: { type: DataTypes.STRING(500) }, description: { type: DataTypes.TEXT },
  fixed_version: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.ENUM('open','in_progress','resolved','accepted_risk'), defaultValue: 'open' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.BasFinding = def('bas_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id: { type: DataTypes.STRING(100) }, app_name: { type: DataTypes.STRING(200) },
  tool: { type: DataTypes.STRING(50) }, simulation_date: { type: DataTypes.DATEONLY },
  technique_id: { type: DataTypes.STRING(50) }, tactic: { type: DataTypes.STRING(100) },
  kill_chain_phase: { type: DataTypes.STRING(100) },
  title: { type: DataTypes.STRING(500) }, description: { type: DataTypes.TEXT },
  result: { type: DataTypes.ENUM('success','partial','failed','blocked'), defaultValue: 'success' },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'medium' },
  severity_score: { type: DataTypes.DECIMAL(4,1) }, affected_asset: { type: DataTypes.STRING(200) },
  status: { type: DataTypes.ENUM('open','in_progress','resolved'), defaultValue: 'open' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.CartFinding = def('cart_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  app_id: { type: DataTypes.STRING(100) }, app_name: { type: DataTypes.STRING(200) },
  assessment_date: { type: DataTypes.DATEONLY }, readiness_area: { type: DataTypes.STRING(200) },
  control_domain: { type: DataTypes.STRING(200) }, control_id: { type: DataTypes.STRING(50) },
  title: { type: DataTypes.STRING(500) }, description: { type: DataTypes.TEXT }, gap: { type: DataTypes.TEXT },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'medium' },
  severity_score: { type: DataTypes.DECIMAL(4,1) }, recommendation: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open','in_progress','resolved'), defaultValue: 'open' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.FirewallRule = def('firewall_rules', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vendor: { type: DataTypes.ENUM('palo_alto','fortinet','checkpoint','other') },
  import_date: { type: DataTypes.DATEONLY }, documentation: { type: DataTypes.STRING(500) },
  rule_num: { type: DataTypes.INTEGER }, from_zone: { type: DataTypes.STRING(200) },
  source: { type: DataTypes.TEXT }, to_zone: { type: DataTypes.STRING(200) },
  destination: { type: DataTypes.TEXT }, service: { type: DataTypes.TEXT },
  action: { type: DataTypes.STRING(30) },
  enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  rule_name: { type: DataTypes.STRING(200) },
  log_enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  comment: { type: DataTypes.TEXT }, application: { type: DataTypes.TEXT },
  user_field: { type: DataTypes.STRING(200) }, schedule: { type: DataTypes.STRING(100) },
  tag: { type: DataTypes.TEXT }, profile: { type: DataTypes.STRING(200) },
  url_category: { type: DataTypes.TEXT }, vpn: { type: DataTypes.STRING(200) },
  section_header: { type: DataTypes.STRING(200) }, layer_name: { type: DataTypes.STRING(200) },
  layer_type: { type: DataTypes.STRING(100) }, layer_uid: { type: DataTypes.STRING(100) },
  rule_position: { type: DataTypes.INTEGER }, parent_rule_uid: { type: DataTypes.STRING(100) },
  risk_score: { type: DataTypes.DECIMAL(6,2), defaultValue: 0 },
  risk_flags: { type: DataTypes.JSON, defaultValue: [] },
  is_permissive: { type: DataTypes.TINYINT, defaultValue: 0 },
  is_undocumented: { type: DataTypes.TINYINT, defaultValue: 0 },
  is_no_log: { type: DataTypes.TINYINT, defaultValue: 0 },
  is_shadow: { type: DataTypes.TINYINT, defaultValue: 0 },
  hit_count: { type: DataTypes.INTEGER },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.WafRule = def('waf_rules', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vendor: { type: DataTypes.STRING(50) }, app_id: { type: DataTypes.STRING(100) },
  app_name: { type: DataTypes.STRING(200) }, rule_id: { type: DataTypes.STRING(100) },
  rule_name: { type: DataTypes.STRING(300) }, rule_type: { type: DataTypes.STRING(100) },
  pattern: { type: DataTypes.TEXT }, action: { type: DataTypes.STRING(30) },
  enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  exception_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  exceptions: { type: DataTypes.JSON, defaultValue: [] },
  whitelist_entries: { type: DataTypes.JSON, defaultValue: [] },
  whitelist_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  severity: { type: DataTypes.STRING(20) },
  gap_identified: { type: DataTypes.TINYINT, defaultValue: 0 },
  gap_description: { type: DataTypes.TEXT }, import_date: { type: DataTypes.DATEONLY },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.IpsSignature = def('ips_signatures', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vendor: { type: DataTypes.STRING(50) }, sig_id: { type: DataTypes.STRING(100) },
  sig_name: { type: DataTypes.STRING(300) }, category: { type: DataTypes.STRING(100) },
  severity: { type: DataTypes.STRING(20) }, action: { type: DataTypes.STRING(30) },
  enabled: { type: DataTypes.TINYINT, defaultValue: 1 }, protocol: { type: DataTypes.STRING(20) },
  cve_references: { type: DataTypes.JSON, defaultValue: [] }, description: { type: DataTypes.TEXT },
  policy_name: { type: DataTypes.STRING(200) },
  gap_flag: { type: DataTypes.TINYINT, defaultValue: 0 }, gap_reason: { type: DataTypes.STRING(500) },
  import_date: { type: DataTypes.DATEONLY },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.SiemIncident = def('siem_incidents', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  incident_id: { type: DataTypes.STRING(100), unique: true },
  ciso_incident_coordinator: { type: DataTypes.STRING(200) },
  date_created: { type: DataTypes.DATE }, days_open: { type: DataTypes.INTEGER },
  days_to_resolve: { type: DataTypes.INTEGER }, incident_details: { type: DataTypes.TEXT },
  incident_coordinator: { type: DataTypes.STRING(200) }, incident_status: { type: DataTypes.STRING(50) },
  incident_summary: { type: DataTypes.TEXT }, incident_validated_by: { type: DataTypes.STRING(200) },
  justification: { type: DataTypes.TEXT }, kill_chain: { type: DataTypes.STRING(200) },
  source: { type: DataTypes.STRING(200) }, team: { type: DataTypes.STRING(200) },
  threat_category: { type: DataTypes.STRING(200) }, title: { type: DataTypes.STRING(500) },
  validation_remarks: { type: DataTypes.TEXT }, date_assigned: { type: DataTypes.DATE },
  date_closed: { type: DataTypes.DATE }, date_resolved: { type: DataTypes.DATE },
  dest_hostname: { type: DataTypes.STRING(200) }, dest_ip: { type: DataTypes.STRING(50) },
  dest_port: { type: DataTypes.INTEGER }, incident_owner: { type: DataTypes.STRING(200) },
  overall_status: { type: DataTypes.STRING(50) }, priority: { type: DataTypes.STRING(30) },
  siem_rule_enhancements: { type: DataTypes.TEXT }, source_hostname: { type: DataTypes.STRING(200) },
  criticality: { type: DataTypes.STRING(50) }, closure_remark: { type: DataTypes.TEXT },
  to_be_blocked: { type: DataTypes.TINYINT, defaultValue: 0 },
  sla_breached: { type: DataTypes.TINYINT, defaultValue: 0 },
  risk_score: { type: DataTypes.DECIMAL(6,2), defaultValue: 0 },
  app_id: { type: DataTypes.STRING(100) },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.PtFinding = def('pt_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pt_type: { type: DataTypes.ENUM('external_webapp','internal_webapp','mobile','api') },
  app_id: { type: DataTypes.STRING(100) }, app_name: { type: DataTypes.STRING(200) },
  engagement_id: { type: DataTypes.STRING(100) }, engagement_date: { type: DataTypes.DATEONLY },
  assessor_name: { type: DataTypes.STRING(200) }, finding_title: { type: DataTypes.STRING(500) },
  description: { type: DataTypes.TEXT }, vulnerability_class: { type: DataTypes.STRING(100) },
  owasp_category: { type: DataTypes.STRING(100) }, owasp_mobile_cat: { type: DataTypes.STRING(100) },
  cwe_id: { type: DataTypes.STRING(20) }, cve_id: { type: DataTypes.STRING(50) },
  cvss_score: { type: DataTypes.DECIMAL(4,1) },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'medium' },
  severity_score: { type: DataTypes.DECIMAL(4,1) }, affected_url: { type: DataTypes.STRING(1000) },
  affected_parameter: { type: DataTypes.STRING(200) }, proof_of_concept: { type: DataTypes.TEXT },
  remediation: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open','in_progress','resolved','accepted_risk'), defaultValue: 'open' },
  retest_status: { type: DataTypes.ENUM('not_retested','fixed','persists','partially_fixed') },
  retest_date: { type: DataTypes.DATEONLY },
  platform: { type: DataTypes.ENUM('ios','android','both') },
  app_version: { type: DataTypes.STRING(50) }, jailbreak_required: { type: DataTypes.TINYINT },
  network_segment: { type: DataTypes.STRING(100) }, source_ip_range: { type: DataTypes.STRING(200) },
  source_type: { type: DataTypes.ENUM('file_upload','oracle_db'), defaultValue: 'file_upload' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.RedTeamFinding = def('red_team_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  engagement_id: { type: DataTypes.STRING(100) }, engagement_date: { type: DataTypes.DATEONLY },
  engagement_type: { type: DataTypes.ENUM('red_team','purple_team','threat_hunting','tabletop'), defaultValue: 'red_team' },
  app_id: { type: DataTypes.STRING(100) }, app_name: { type: DataTypes.STRING(200) },
  technique_id: { type: DataTypes.STRING(50) }, technique_name: { type: DataTypes.STRING(300) },
  tactic: { type: DataTypes.STRING(100) }, sub_technique: { type: DataTypes.STRING(100) },
  finding_title: { type: DataTypes.STRING(500) }, description: { type: DataTypes.TEXT },
  affected_asset: { type: DataTypes.STRING(200) }, evidence: { type: DataTypes.TEXT },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'high' },
  severity_score: { type: DataTypes.DECIMAL(4,1) },
  detection_gap: { type: DataTypes.TINYINT, defaultValue: 0 },
  prevention_gap: { type: DataTypes.TINYINT, defaultValue: 0 },
  remediation: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open','in_progress','resolved'), defaultValue: 'open' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.AuditFinding = def('audit_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  observation_id: { type: DataTypes.STRING(100) },
  audit_type: { type: DataTypes.ENUM('internal','external','regulatory','iso','rbi','sebi','cert_in'), defaultValue: 'internal' },
  audit_date: { type: DataTypes.DATEONLY }, app_id: { type: DataTypes.STRING(100) },
  app_name: { type: DataTypes.STRING(200) }, business_unit: { type: DataTypes.STRING(200) },
  observation_title: { type: DataTypes.STRING(500) }, observation_desc: { type: DataTypes.TEXT },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational'), defaultValue: 'medium' },
  severity_score: { type: DataTypes.DECIMAL(4,1) },
  repeat_finding: { type: DataTypes.TINYINT, defaultValue: 0 },
  due_date: { type: DataTypes.DATEONLY }, owner: { type: DataTypes.STRING(200) },
  management_response: { type: DataTypes.TEXT }, action_plan: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open','in_progress','closed','overdue'), defaultValue: 'open' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.OsComplianceFinding = def('os_compliance_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  asset_id: { type: DataTypes.STRING(100) }, hostname: { type: DataTypes.STRING(200) },
  ip_address: { type: DataTypes.STRING(50) }, os_type: { type: DataTypes.STRING(100) },
  os_version: { type: DataTypes.STRING(100) }, scan_date: { type: DataTypes.DATEONLY },
  benchmark_standard: { type: DataTypes.STRING(100) }, control_id: { type: DataTypes.STRING(50) },
  control_description: { type: DataTypes.STRING(1000) },
  compliance_status: { type: DataTypes.ENUM('pass','fail','not_applicable','error') },
  current_value: { type: DataTypes.STRING(500) }, expected_value: { type: DataTypes.STRING(500) },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational') },
  severity_score: { type: DataTypes.DECIMAL(4,1) }, remediation: { type: DataTypes.TEXT },
  exception_status: { type: DataTypes.ENUM('no_exception','approved','pending'), defaultValue: 'no_exception' },
  source_type: { type: DataTypes.ENUM('file_upload','oracle_db'), defaultValue: 'file_upload' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.DbComplianceFinding = def('db_compliance_findings', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  asset_id: { type: DataTypes.STRING(100) }, db_hostname: { type: DataTypes.STRING(200) },
  db_type: { type: DataTypes.ENUM('oracle','mssql','mysql','postgresql','mongodb','other') },
  db_version: { type: DataTypes.STRING(100) }, db_instance_name: { type: DataTypes.STRING(100) },
  ip_address: { type: DataTypes.STRING(50) }, scan_date: { type: DataTypes.DATEONLY },
  benchmark_standard: { type: DataTypes.STRING(100) }, control_id: { type: DataTypes.STRING(50) },
  control_description: { type: DataTypes.STRING(1000) },
  compliance_status: { type: DataTypes.ENUM('pass','fail','not_applicable','error') },
  current_value: { type: DataTypes.STRING(500) }, expected_value: { type: DataTypes.STRING(500) },
  severity: { type: DataTypes.ENUM('critical','high','medium','low','informational') },
  severity_score: { type: DataTypes.DECIMAL(4,1) }, remediation: { type: DataTypes.TEXT },
  exception_status: { type: DataTypes.ENUM('no_exception','approved','pending'), defaultValue: 'no_exception' },
  source_type: { type: DataTypes.ENUM('file_upload','oracle_db'), defaultValue: 'file_upload' },
  ingestion_id: { type: DataTypes.CHAR(36) }, raw_data: { type: DataTypes.JSON }
});

M.sequelize = sequelize;
module.exports = M;
