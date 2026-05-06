/**
 * Validation Middleware for Analytics Requests
 */

const Joi = require('joi');

/**
 * Validate date range query parameters
 */
exports.validateDateRange = (req, res, next) => {
  const schema = Joi.object({
    startDate: Joi.string().optional(),
    endDate: Joi.string().optional(),
    period: Joi.string()
      .valid('today', 'yesterday', 'last7Days', 'last30Days', 'last90Days')
      .optional(),
    limit: Joi.number().integer().min(1).max(1000).optional(),
    offset: Joi.number().integer().min(0).optional(),
  }).unknown(true);

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: error.details.map(detail => detail.message),
    });
  }

  next();
};

/**
 * Validate custom events query
 */
exports.validateCustomEvents = (req, res, next) => {
  const schema = Joi.object({
    events: Joi.string().optional(),
    startDate: Joi.string().optional(),
    endDate: Joi.string().optional(),
    period: Joi.string()
      .valid('today', 'yesterday', 'last7Days', 'last30Days', 'last90Days')
      .optional(),
  }).unknown(true);

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: error.details.map(detail => detail.message),
    });
  }

  next();
};
