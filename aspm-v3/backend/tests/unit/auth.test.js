'use strict';

process.env.JWT_SECRET = 'test-secret-do-not-use-elsewhere';
process.env.NODE_ENV = 'test';

const auth = require('../../middleware/auth');

function mockRes() {
  const res = {};
  res.req = { id: 'test-rid' };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
}

describe('middleware/auth', () => {
  test('signToken + verify roundtrip', () => {
    const token = auth.signToken({ username: 'mayank', role: 'admin' });
    expect(typeof token).toBe('string');

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    auth.required(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.username).toBe('mayank');
    expect(req.user.role).toBe('admin');
  });

  test('required rejects missing token', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    auth.required(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('required rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer not.a.real.token' } };
    const res = mockRes();
    const next = jest.fn();
    auth.required(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('optional permits anonymous', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    auth.optional(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  test('requireRole denies wrong role', () => {
    const token = auth.signToken({ username: 'reader', role: 'viewer' });
    const req = { headers: { authorization: `Bearer ${token}` }, user: undefined };
    const res = mockRes();
    auth.required(req, res, () => {});
    const adminOnly = auth.requireRole('admin');
    const next2 = jest.fn();
    adminOnly(req, res, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('requireRole permits matching role', () => {
    const token = auth.signToken({ username: 'mayank', role: 'admin' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    auth.required(req, res, () => {});
    const adminOnly = auth.requireRole('admin');
    const next2 = jest.fn();
    adminOnly(req, res, next2);
    expect(next2).toHaveBeenCalled();
  });
});
