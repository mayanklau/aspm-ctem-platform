'use strict';
const { parse } = require('csv-parse/sync');
const xml2js    = require('xml2js');
const XLSX      = require('xlsx');
const fs        = require('fs');
const path      = require('path');
const { normalizeSeverity, severityScore, normalizeStatus, parseDate } = require('../../utils/helpers');

class BaseParser {
  constructor(type) { this.reportType = type; this.errors = []; }

  static readCsv(fp) {
    const txt = fs.readFileSync(fp, 'utf8');
    return parse(txt, { columns: true, skip_empty_lines: true, trim: true, relax_quotes: true, bom: true });
  }
  static async readXml(fp) {
    const txt = fs.readFileSync(fp, 'utf8');
    return xml2js.parseStringPromise(txt, { explicitArray: false, mergeAttrs: true });
  }
  static readJson(fp)  { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  static readXlsx(fp)  {
    const wb = XLSX.readFile(fp);
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  }
  static detect(fp) {
    const e = path.extname(fp).toLowerCase();
    return e === '.csv' ? 'csv' : e === '.xml' ? 'xml' : e === '.json' ? 'json' : ['.xlsx','.xls'].includes(e) ? 'xlsx' : 'unknown';
  }
  static norm = normalizeSeverity;
  static score = severityScore;
  static status = normalizeStatus;
  static date = parseDate;

  logErr(row, msg) { this.errors.push({ row, message: msg }); }
}

module.exports = BaseParser;
