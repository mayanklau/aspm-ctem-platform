'use strict';

const helpers = require('../../utils/helpers');

describe('utils/helpers', () => {
  describe('normalizeSeverity', () => {
    test.each([
      ['Critical', 'critical'],
      ['CRIT', 'critical'],
      ['high', 'high'],
      ['Medium', 'medium'],
      ['moderate', 'medium'],
      ['LOW', 'low'],
      ['informational', 'informational'],
      ['info', 'informational'],
      ['', 'low'],
      [undefined, 'low'],
      ['banana', 'low'],
    ])('%s → %s', (input, expected) => {
      expect(helpers.normalizeSeverity(input)).toBe(expected);
    });
  });

  describe('severityScore', () => {
    test('maps severities to numeric scores', () => {
      expect(helpers.severityScore('critical')).toBe(5);
      expect(helpers.severityScore('high')).toBe(4);
      expect(helpers.severityScore('medium')).toBe(3);
      expect(helpers.severityScore('low')).toBe(2);
      expect(helpers.severityScore('informational')).toBe(1);
      expect(helpers.severityScore('info')).toBe(1);
      expect(helpers.severityScore('garbage')).toBe(2);
    });
  });

  describe('normalizeStatus', () => {
    test('maps free-form status strings to canonical values', () => {
      expect(helpers.normalizeStatus('In Progress')).toBe('in_progress');
      expect(helpers.normalizeStatus('WIP')).toBe('in_progress');
      expect(helpers.normalizeStatus('resolved')).toBe('resolved');
      expect(helpers.normalizeStatus('CLOSED')).toBe('resolved');
      expect(helpers.normalizeStatus('fixed')).toBe('resolved');
      expect(helpers.normalizeStatus('accepted risk')).toBe('accepted_risk');
      expect(helpers.normalizeStatus('false positive')).toBe('false_positive');
      expect(helpers.normalizeStatus('FP')).toBe('false_positive');
      expect(helpers.normalizeStatus('')).toBe('open');
    });
  });

  describe('parseDate / parseDateTime', () => {
    test('parses valid dates', () => {
      expect(helpers.parseDate('2025-01-15')).toBe('2025-01-15');
      expect(helpers.parseDateTime('2025-01-15T10:30:00Z')).toBeInstanceOf(Date);
    });
    test('returns null for empty / invalid input', () => {
      expect(helpers.parseDate('')).toBeNull();
      expect(helpers.parseDate(undefined)).toBeNull();
      expect(helpers.parseDate('not-a-date')).toBeNull();
      expect(helpers.parseDateTime('garbage')).toBeNull();
    });
  });

  describe('bool', () => {
    test('accepts common truthy strings', () => {
      ['yes', 'true', '1', 'Y'].forEach((v) => expect(helpers.bool(v)).toBe(true));
      ['no', 'false', '0', '', undefined].forEach((v) => expect(helpers.bool(v)).toBe(false));
    });
  });

  describe('paginate', () => {
    test('computes limit and offset from page/limit', () => {
      expect(helpers.paginate(null, 1, 50)).toEqual({ limit: 50, offset: 0 });
      expect(helpers.paginate(null, 3, 25)).toEqual({ limit: 25, offset: 50 });
    });
  });
});
