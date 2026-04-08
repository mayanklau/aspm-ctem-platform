'use strict';
require('dotenv').config();
const sequelize = require('../config/database');
const models = require('../models');

const WEIGHTAGE_DEFAULTS = [
  { report_type:'sast',          label:'SAST',                   weightage:7 },
  { report_type:'dast',          label:'DAST',                   weightage:7 },
  { report_type:'sca',           label:'SCA',                    weightage:6 },
  { report_type:'va',            label:'VA Scanner',             weightage:6 },
  { report_type:'bas',           label:'BAS',                    weightage:7 },
  { report_type:'cart',          label:'CART',                   weightage:6 },
  { report_type:'firewall',      label:'Firewall Rules',         weightage:5 },
  { report_type:'waf',           label:'WAF Config',             weightage:5 },
  { report_type:'ips',           label:'IPS Signatures',         weightage:5 },
  { report_type:'siem',          label:'SIEM / ITSM',            weightage:7 },
  { report_type:'pt_external',   label:'External Web App PT',    weightage:8 },
  { report_type:'pt_internal',   label:'Internal Web App PT',    weightage:6 },
  { report_type:'pt_mobile',     label:'Mobile PT',              weightage:8 },
  { report_type:'red_team',      label:'Red Team / Threat Hunt', weightage:8 },
  { report_type:'audit',         label:'Audit Findings',         weightage:5 },
  { report_type:'os_compliance', label:'OS Compliance',          weightage:5 },
  { report_type:'db_compliance', label:'DB Compliance',          weightage:5 },
];

const CPR_SEEDS = [
  { app_id:'APP-001', app_name:'Internet Banking Portal',   business_unit:'Retail Banking', domain:'Digital Channels', asset_criticality:'critical', cpr_score:4.5 },
  { app_id:'APP-002', app_name:'Mobile Banking App',        business_unit:'Retail Banking', domain:'Digital Channels', asset_criticality:'critical', cpr_score:5.2 },
  { app_id:'APP-003', app_name:'Core Banking System',       business_unit:'Operations',     domain:'Core Systems',     asset_criticality:'critical', cpr_score:6.1 },
  { app_id:'APP-004', app_name:'Payment Gateway',           business_unit:'Treasury',       domain:'Payments',         asset_criticality:'high',     cpr_score:5.8 },
  { app_id:'APP-005', app_name:'Loan Management System',    business_unit:'Lending',        domain:'Lending',          asset_criticality:'high',     cpr_score:6.5 },
];

async function seed() {
  await sequelize.authenticate();
  for (const w of WEIGHTAGE_DEFAULTS) {
    await models.ReportWeightage.findOrCreate({ where: { report_type: w.report_type }, defaults: w });
  }
  console.log('[seed] Weightages seeded');
  for (const c of CPR_SEEDS) {
    await models.CprScore.findOrCreate({ where: { app_id: c.app_id }, defaults: c });
  }
  console.log('[seed] CPR scores seeded');
  console.log('[seed] Complete');
  await sequelize.close();
}

seed().catch(e => { console.error('[seed] Error:', e.message); process.exit(1); });
