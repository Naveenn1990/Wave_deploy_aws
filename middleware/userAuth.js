const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    console.log('Auth header received:', authHeader ? 'Yes' : 'No');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No token provided');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      const error = new Error('Empty token provided');
      error.statusCode = 401;
      throw error;
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified for user:', decoded.userId);
    } catch (jwtError) {
      const error = new Error(jwtError.message);
      error.statusCode = 401;
      throw error;
    }

    if (!decoded.userId) {
      const error = new Error('Invalid token format');
      error.statusCode = 401;
      throw error;
    }

    // Find user
    const user = await User.findById(decoded.userId)
      .select('-password -tempOTP -tempOTPExpiry');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === 'blocked') {
      const error = new Error('Account is blocked');
      error.statusCode = 401;
      throw error;
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", {
      error: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500
    });
    
    res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Authentication failed"
    });
  }
};
