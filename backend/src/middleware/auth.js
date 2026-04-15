const jwt = require('jsonwebtoken');

/**
 * Protect middleware - verify JWT token
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Authorize middleware - check user roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.userType === 'admin' || req.user.role === 'admin') {
      return next();
    }

    // Check if user's role is in allowed roles
    const userRole = req.user.userType || req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for this action'
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};