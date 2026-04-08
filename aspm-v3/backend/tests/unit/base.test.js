'use strict';

const { escapeLike, safePagination, MAX_LIMIT } = require('../../controllers/_base');

describe('controllers/_base.escapeLike', () => {
  test('escapes percent and underscore', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
  });

  test('escapes backslashes', () => {
    expect(escapeLike('a\\b')).toBe('a\\\\b');
  });

  test('passes safe text through unchanged', () => {
    expect(escapeLike('SQL injection attempt')).toBe('SQL injection attempt');
  });

  test('coerces non-strings', () => {
    expect(escapeLike(42)).toBe('42');
  });

  test('the wildcard-only attack input is neutralised', () => {
    // Pre-fix, ?q=% would match every row. Post-fix it matches a literal %.
    expect(escapeLike('%')).toBe('\\%');
  });
});

describe('controllers/_base.safePagination', () => {
  test('defaults when nothing supplied', () => {
    expect(safePagination({})).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  test('parses sane values', () => {
    expect(safePagination({ page: '3', limit: '25' })).toEqual({
      page: 3,
      limit: 25,
      offset: 50,
    });
  });

  test('caps the limit at MAX_LIMIT', () => {
    expect(safePagination({ limit: '999999' }).limit).toBe(MAX_LIMIT);
  });

  test('rejects negative or non-numeric input', () => {
    expect(safePagination({ page: '-5', limit: 'abc' })).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });
});
