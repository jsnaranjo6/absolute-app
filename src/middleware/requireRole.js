'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Gate a route to one or more roles. Must run after authenticate.
 * Usage: router.get('/x', authenticate, requireRole('manager','owner'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role', 'FORBIDDEN_ROLE'));
    }
    next();
  };
}

// Convenience: any staff-level role (everything above plain member).
const STAFF_ROLES = ['front_desk', 'trainer', 'manager', 'owner'];
const requireStaff = () => requireRole(...STAFF_ROLES);

module.exports = { requireRole, requireStaff, STAFF_ROLES };
