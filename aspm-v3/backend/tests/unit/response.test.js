'use strict';

const R = require('../../utils/response');

function mockRes() {
  const res = {};
  res.req = { id: 'rid-123' };
  res.statusCode = 200;
  res.status = jest.fn(function (s) {
    res.statusCode = s;
    return res;
  });
  res.json = jest.fn(function (body) {
    res.body = body;
    return res;
  });
  return res;
}

describe('utils/response', () => {
  test('success returns 200 + envelope with request_id', () => {
    const res = mockRes();
    R.success(res, { ok: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ ok: true });
    expect(res.body.request_id).toBe('rid-123');
    expect(res.body.timestamp).toBeDefined();
  });

  test('paginated includes meta', () => {
    const res = mockRes();
    R.paginated(res, [1, 2, 3], 47, 2, 10);
    expect(res.body.meta).toEqual({ total: 47, page: 2, limit: 10, pages: 5 });
  });

  test('error defaults to 500', () => {
    const res = mockRes();
    R.error(res, 'boom');
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('boom');
  });

  test('badRequest returns 400 with optional details', () => {
    const res = mockRes();
    R.badRequest(res, 'bad', { fields: ['x'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.details).toEqual({ fields: ['x'] });
  });

  test('notFound returns 404', () => {
    const res = mockRes();
    R.notFound(res);
    expect(res.statusCode).toBe(404);
  });

  test('unauthorized returns 401', () => {
    const res = mockRes();
    R.unauthorized(res);
    expect(res.statusCode).toBe(401);
  });

  test('forbidden returns 403', () => {
    const res = mockRes();
    R.forbidden(res);
    expect(res.statusCode).toBe(403);
  });
});
