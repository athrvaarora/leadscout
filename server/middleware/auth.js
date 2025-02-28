const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Protect routes - middleware to verify the JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in the authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to get user from database
    try {
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      // Set user in request (convert Sequelize instance to plain object)
      req.user = user.get({ plain: true });
    } catch (dbError) {
      console.log('Database error in auth middleware:', dbError.message);
      // If we can't connect to the database, but the token is valid,
      // we'll create a minimal user object with just the ID from the token
      req.user = {
        id: decoded.id,
        name: decoded.name || 'User',
        email: decoded.email || 'user@example.com',
        role: decoded.role || 'user'
      };
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional auth middleware that doesn't require authentication
exports.optionalAuth = async (req, res, next) => {
  let token;

  console.log('optionalAuth middleware - headers:', req.headers);

  // Check if token exists in the authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found in Authorization header');
  }

  // If no token, continue as guest
  if (!token) {
    console.log('No token found, continuing as guest');
    req.user = null;
    return next();
  }

  try {
    // Verify token
    console.log('Attempting to verify token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecretkey');

    // Try to get user from database
    try {
      console.log('Looking up user in database with ID:', decoded.id);
      const user = await User.findByPk(decoded.id);
      // Set user in request (convert Sequelize instance to plain object)
      req.user = user ? user.get({ plain: true }) : null;
      console.log('User found:', req.user ? 'Yes' : 'No');
    } catch (dbError) {
      console.log('Database error in optionalAuth middleware:', dbError.message);
      // If we can't connect to the database, but the token is valid,
      // we'll create a minimal user object with just the ID from the token
      req.user = {
        id: decoded.id,
        name: decoded.name || 'User',
        email: decoded.email || 'user@example.com',
        role: decoded.role || 'user'
      };
      console.log('Created placeholder user due to DB error');
    }
    
    next();
  } catch (error) {
    // Continue as guest if token is invalid
    console.log('Invalid token, continuing as guest:', error.message);
    req.user = null;
    next();
  }
};