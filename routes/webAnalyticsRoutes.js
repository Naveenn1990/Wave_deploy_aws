/**
 * Web Analytics Routes
 * Routes for web-specific analytics endpoints
 */

const express = require('express');
const router = express.Router();
const webAnalyticsController = require('../controllers/webAnalyticsController');
const { adminAuth } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/web-analytics/summary
 * @desc    Get web analytics summary
 * @access  Admin only
 * @query   period: today, yesterday, last7Days, last30Days, last90Days
 */
router.get('/summary', adminAuth, webAnalyticsController.getWebSummary);

/**
 * @route   GET /api/admin/web-analytics/pages
 * @desc    Get top web pages
 * @access  Admin only
 * @query   period, limit
 */
router.get('/pages', adminAuth, webAnalyticsController.getTopPages);

/**
 * @route   GET /api/admin/web-analytics/activity
 * @desc    Get web user activity over time
 * @access  Admin only
 * @query   period
 */
router.get('/activity', adminAuth, webAnalyticsController.getWebActivity);

/**
 * @route   GET /api/admin/web-analytics/traffic-sources
 * @desc    Get web traffic sources
 * @access  Admin only
 * @query   period
 */
router.get('/traffic-sources', adminAuth, webAnalyticsController.getWebTrafficSources);

/**
 * @route   GET /api/admin/web-analytics/devices
 * @desc    Get web device breakdown
 * @access  Admin only
 * @query   period
 */
router.get('/devices', adminAuth, webAnalyticsController.getWebDevices);

/**
 * @route   GET /api/admin/web-analytics/browsers
 * @desc    Get web browser breakdown
 * @access  Admin only
 * @query   period
 */
router.get('/browsers', adminAuth, webAnalyticsController.getWebBrowsers);

/**
 * @route   GET /api/admin/web-analytics/events
 * @desc    Get web user events
 * @access  Admin only
 * @query   period
 */
router.get('/events', adminAuth, webAnalyticsController.getWebEvents);

/**
 * @route   GET /api/admin/web-analytics/landing-pages
 * @desc    Get web landing pages
 * @access  Admin only
 * @query   period, limit
 */
router.get('/landing-pages', adminAuth, webAnalyticsController.getWebLandingPages);

/**
 * @route   POST /api/admin/web-analytics/clear-cache
 * @desc    Clear web analytics cache
 * @access  Admin only
 */
router.post('/clear-cache', adminAuth, webAnalyticsController.clearCache);

module.exports = router;
