/**
 * Web Analytics Controller
 * Handles web-specific analytics endpoints
 */

const ga4Service = require('../services/ga4Service');
const NodeCache = require('node-cache');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

/**
 * Helper to get date range from query params
 */
const getDateRange = (req) => {
  const { period = 'last30Days' } = req.query;
  
  const ranges = {
    today: { startDate: 'today', endDate: 'today' },
    yesterday: { startDate: 'yesterday', endDate: 'yesterday' },
    last7Days: { startDate: '7daysAgo', endDate: 'today' },
    last30Days: { startDate: '30daysAgo', endDate: 'today' },
    last90Days: { startDate: '90daysAgo', endDate: 'today' },
  };

  return ranges[period] || ranges.last30Days;
};

/**
 * Helper to get cached data or fetch new
 */
const getCachedOrFetch = async (key, fetchFn) => {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await fetchFn();
  cache.set(key, data);
  return data;
};

/**
 * GET /api/admin/web-analytics/summary
 * Get web analytics summary
 */
exports.getWebSummary = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `web_summary_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const webData = await ga4Service.getWebAnalytics(startDate, endDate);
      
      if (webData.data.length === 0) {
        return {
          activeUsers: 0,
          sessions: 0,
          pageViews: 0,
          engagementRate: 0,
          avgSessionDuration: 0,
          hasData: false,
        };
      }

      const summary = webData.data[0];
      return {
        activeUsers: summary.activeUsers || 0,
        sessions: summary.sessions || 0,
        pageViews: summary.screenPageViews || 0,
        engagementRate: (summary.engagementRate * 100).toFixed(2) || 0,
        avgSessionDuration: Math.round(summary.averageSessionDuration || 0),
        hasData: true,
      };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Web Summary Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web analytics summary',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/web-analytics/pages
 * Get top web pages
 */
exports.getTopPages = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const limit = parseInt(req.query.limit) || 20;
    const cacheKey = `web_pages_${startDate}_${endDate}_${limit}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const pages = await ga4Service.getWebPageViews(startDate, endDate, limit);
      
      return {
        pages: pages.data.map(page => ({
          path: page.pagePath || '/',
          title: page.pageTitle || 'Untitled',
          views: page.screenPageViews || 0,
          users: page.activeUsers || 0,
          avgDuration: Math.round(page.averageSessionDuration || 0),
          bounceRate: page.bounceRate ? (page.bounceRate * 100).toFixed(2) : null,
        })),
        totalPages: pages.rowCount,
      };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Top Pages Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top pages',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/web-analytics/activity
 * Get web user activity over time
 */
exports.getWebActivity = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `web_activity_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const activity = await ga4Service.getWebUserActivity(startDate, endDate);
      
      return {
        daily: activity.data.map(day => ({
          date: day.date,
          users: day.activeUsers || 0,
          sessions: day.sessions || 0,
          pageViews: day.screenPageViews || 0,
          engagementRate: (day.engagementRate * 100).toFixed(2) || 0,
        })),
        summary: {
          totalUsers: activity.data.reduce((sum, day) => sum + (day.activeUsers || 0), 0),
          totalSessions: activity.data.reduce((sum, day) => sum + (day.sessions || 0), 0),
          totalPageViews: activity.data.reduce((sum, day) => sum + (day.screenPageViews || 0), 0),
        },
      };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Web Activity Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web activity',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/web-analytics/traffic-sources
 * Get web traffic sources
 */
exports.getWebTrafficSources = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `web_traffic_sources_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const sources = await ga4Service.getWebTrafficSources(startDate, endDate);
      
      return {
        sources: sources.data.map(source => ({
          source: source.sessionSource || 'direct',
          medium: source.sessionMedium || 'none',
          sessions: source.sessions || 0,
          users: source.activeUsers || 0,
          newUsers: source.newUsers || 0,
          engagementRate: (source.engagementRate * 100).toFixed(2) || 0,
        })),
        totalSources: sources.rowCount,
      };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Web Traffic Sources Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web traffic sources',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/web-analytics/devices
 * Get web device breakdown
 */
exports.getWebDevices = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `web_devices_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const devices = await ga4Service.getWebDeviceBreakdown(startDate, endDate);
      
      const deviceData = {};
      devices.data.forEach(device => {
        deviceData[device.deviceCategory] = {
          users: device.activeUsers || 0,
          sessions: device.sessions || 0,
          pageViews: device.screenPageViews || 0,
          avgDuration: Math.round(device.averageSessionDuration || 0),
        };
      });

      return { devices: deviceData };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Web Devices Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web device breakdown',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/web-analytics/browsers
 * Get web browser breakdown
 */
exports.getWebBrowsers = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `web_browsers_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const browsers = await ga4Service.getWebBrowserBreakdown(startDate, endDate);
      
      return {
        browsers: browsers.data.map(browser => ({
          name: browser.browser || 'Unknown',
          users: browser.activeUsers || 0,
          sessions: browser.sessions || 0,
          engagementRate: (browser.engagementRate * 100).toFixed(2) || 0,
        })),
      };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Web Browsers Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web browser breakdown',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/web-analytics/events
 * Get web user events
 */
exports.getWebEvents = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `web_events_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const events = await ga4Service.getWebUserEvents(startDate, endDate);
      
      return {
        events: events.data.map(event => ({
          name: event.eventName || 'unknown',
          count: event.eventCount || 0,
          countPerUser: parseFloat(event.eventCountPerUser || 0).toFixed(2),
        })),
        totalEvents: events.data.reduce((sum, e) => sum + (e.eventCount || 0), 0),
      };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Web Events Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web events',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/web-analytics/landing-pages
 * Get web landing pages
 */
exports.getWebLandingPages = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const limit = parseInt(req.query.limit) || 10;
    const cacheKey = `web_landing_${startDate}_${endDate}_${limit}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const pages = await ga4Service.getWebLandingPages(startDate, endDate, limit);
      
      return {
        pages: pages.data.map(page => ({
          path: page.landingPage || '/',
          sessions: page.sessions || 0,
          users: page.activeUsers || 0,
          engagementRate: (page.engagementRate * 100).toFixed(2) || 0,
        })),
      };
    });

    res.json({
      success: true,
      data: result,
      period: req.query.period || 'last30Days',
    });
  } catch (error) {
    console.error('Web Landing Pages Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web landing pages',
      error: error.message,
    });
  }
};

/**
 * POST /api/admin/web-analytics/clear-cache
 * Clear web analytics cache
 */
exports.clearCache = async (req, res) => {
  try {
    cache.flushAll();
    res.json({
      success: true,
      message: 'Web analytics cache cleared successfully',
    });
  } catch (error) {
    console.error('Clear Cache Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
};
