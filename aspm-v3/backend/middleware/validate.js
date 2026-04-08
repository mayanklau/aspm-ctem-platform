'use strict';

/**
 * Tiny wrapper around express-validator. Place after a chain of validators:
 *
 *   const { body } = require('express-validator');
 *   const validate = require('../middleware/validate');
 *
 *   router.post('/x',
 *     body('name').isString().isLength({ min: 1, max: 200 }),
 *     validate,
 *     handler
 *   );
 */

const { validationResult } = require('express-validator');
const R = require('../utils/response');

module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return R.badRequest(res, 'Validation failed', {
    fields: errors.array().map((e) => ({
      path: e.path || e.param,
      message: e.msg,
      value: e.value,
    })),
  });
};
