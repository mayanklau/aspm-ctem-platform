'use strict';

/**
 * Attaches an X-Request-Id to every request and response. Re-uses an
 * inbound header if a trusted upstream (load balancer, API gateway) supplied
 * one, otherwise generates a UUID v4.
 */

const { v4: uuidv4 } = require('uuid');

const HEADER = 'x-request-id';

module.exports = function requestId(req, res, next) {
  const incoming = req.headers[HEADER];
  const id = incoming && /^[\w.-]{1,128}$/.test(incoming) ? incoming : uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
