/**
 * Firebase Analytics Routes
 * All routes for Firebase Analytics (GA4) admin dashboard
 */

const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const analyticsController = require('../controllers/firebaseAnalyticsController');

/**
 * @route   GET /api/admin/firebase-analytics/dashboard-summary
 * @desc    Get overall dashboard summary metrics
 * @access  Admin
 * @query   startDate, endDate, period (today|yesterday|last7Days|last30Days|last90Days)
 */
router.get('/dashboard-summary', adminAuth, analyticsController.getDashboardSummary);

/**
 * @route   GET /api/admin/firebase-analytics/active-users
 * @desc    Get daily, weekly, and monthly active users
 * @access  Admin
 */
router.get('/active-users', adminAuth, analyticsController.getActiveUsers);

/**
 * @route   GET /api/admin/firebase-analytics/device-breakdown
 * @desc    Get device, OS, and browser analytics
 * @access  Admin
 * @query   startDate, endDate, period
 */
router.get('/device-breakdown', adminAuth, analyticsController.getDeviceBreakdown);

/**
 * @route   GET /api/admin/firebase-analytics/audience
 * @desc    Get audience demographics and geography
 * @access  Admin
 * @query   startDate, endDate, period
 */
router.get('/audience', adminAuth, analyticsController.getAudienceAnalytics);

/**
 * @route   GET /api/admin/firebase-analytics/traffic-trends
 * @desc    Get traffic trends over time
 * @access  Admin
 * @query   startDate, endDate, period
 */
router.get('/traffic-trends', adminAuth, analyticsController.getTrafficTrends);

/**
 * @route   GET /api/admin/firebase-analytics/top-screens
 * @desc    Get most viewed screens and pages
 * @access  Admin
 * @query   startDate, endDate, period, limit
 */
router.get('/top-screens', adminAuth, analyticsController.getTopScreens);

/**
 * @route   GET /api/admin/firebase-analytics/retention
 * @desc    Get user retention analytics (Day 1, 7, 30)
 * @access  Admin
 * @query   startDate, endDate, period
 */
router.get('/retention', adminAuth, analyticsController.getRetentionAnalytics);

/**
 * @route   GET /api/admin/firebase-analytics/notifications
 * @desc    Get notification analytics
 * @access  Admin
 * @query   startDate, endDate, period
 */
router.get('/notifications', adminAuth, analyticsController.getNotificationAnalytics);

/**
 * @route   GET /api/admin/firebase-analytics/realtime
 * @desc    Get real-time active users (last 30 minutes)
 * @access  Admin
 */
router.get('/realtime', adminAuth, analyticsController.getRealtimeUsers);

/**
 * @route   GET /api/admin/firebase-analytics/traffic-sources
 * @desc    Get traffic source analytics
 * @access  Admin
 * @query   startDate, endDate, period
 */
router.get('/traffic-sources', adminAuth, analyticsController.getTrafficSources);

/**
 * @route   GET /api/admin/firebase-analytics/custom-events
 * @desc    Get custom event tracking
 * @access  Admin
 * @query   startDate, endDate, period, events (comma-separated)
 */
router.get('/custom-events', adminAuth, analyticsController.getCustomEvents);

/**
 * @route   POST /api/admin/firebase-analytics/clear-cache
 * @desc    Clear analytics cache
 * @access  Admin
 */
router.post('/clear-cache', adminAuth, analyticsController.clearCache);

module.exports = router;
