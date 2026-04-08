'use strict';

module.exports = {
  normalizeSeverity(raw = '') {
    const s = String(raw).toLowerCase().trim();
    if (s.includes('critical') || s === 'crit') return 'critical';
    if (s.includes('high'))   return 'high';
    if (s.includes('medium') || s.includes('moderate') || s.includes('med')) return 'medium';
    if (s.includes('low'))    return 'low';
    if (s.includes('info'))   return 'informational';
    return 'low';
  },
  severityScore(sev) {
    const m = { critical:5, high:4, medium:3, low:2, informational:1, info:1 };
    return m[(sev||'low').toLowerCase()] ?? 2;
  },
  normalizeStatus(raw = '') {
    const s = String(raw).toLowerCase();
    if (s.includes('progress') || s.includes('wip')) return 'in_progress';
    if (s.includes('resolv') || s.includes('fix') || s.includes('close')) return 'resolved';
    if (s.includes('accept')) return 'accepted_risk';
    if (s.includes('false') || s.includes('fp')) return 'false_positive';
    return 'open';
  },
  parseDate(v) {
    if (!v || String(v).trim() === '') return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  },
  parseDateTime(v) {
    if (!v || String(v).trim() === '') return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  },
  paginate(query, page = 1, limit = 50) {
    return { limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit) };
  },
  bool(v) {
    return ['yes','true','1','y'].includes(String(v || '').toLowerCase());
  }
};
