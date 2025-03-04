exports.errorHandler = (res, error) => {
  console.error('Error:', error);
  
  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: error.message
  });
};
