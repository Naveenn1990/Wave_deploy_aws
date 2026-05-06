/**
 * Firebase Analytics Controller
 * Handles all Firebase Analytics (GA4) API endpoints for admin dashboard
 */

const ga4Service = require('../services/ga4Service');
const { getDateRanges } = require('../config/ga4');
const NodeCache = require('node-cache');

// Cache for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Utility: Get date range from query or use defaults
 */
const getDateRange = (req) => {
  const { startDate, endDate, period } = req.query;

  if (period) {
    const ranges = getDateRanges();
    return ranges[period] || ranges.last30Days;
  }

  return {
    startDate: startDate || '30daysAgo',
    endDate: endDate || 'today',
  };
};

/**
 * Utility: Cache wrapper
 */
const getCachedOrFetch = async (cacheKey, fetchFunction) => {
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const data = await fetchFunction();
  cache.set(cacheKey, data);
  return { ...data, fromCache: false };
};

/**
 * GET /api/admin/analytics/dashboard-summary
 * Get overall dashboard summary metrics
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `dashboard_summary_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const engagement = await ga4Service.getUserEngagement(startDate, endDate);
      
      if (!engagement.data || engagement.data.length === 0) {
        return {
          activeUsers: 0,
          newUsers: 0,
          sessions: 0,
          screenPageViews: 0,
          engagementRate: 0,
          averageSessionDuration: 0,
          eventCount: 0,
        };
      }

      const metrics = engagement.data[0];
      
      return {
        activeUsers: metrics.activeUsers || 0,
        newUsers: metrics.newUsers || 0,
        sessions: metrics.sessions || 0,
        screenPageViews: metrics.screenPageViews || 0,
        engagementRate: (metrics.engagementRate * 100).toFixed(2) || 0,
        averageSessionDuration: Math.round(metrics.averageSessionDuration || 0),
        eventCount: metrics.eventCount || 0,
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/active-users
 * Get daily, weekly, and monthly active users
 */
exports.getActiveUsers = async (req, res) => {
  try {
    const ranges = getDateRanges();
    const cacheKey = 'active_users_all';

    const result = await getCachedOrFetch(cacheKey, async () => {
      // Get data for different periods
      const [daily, weekly, monthly] = await Promise.all([
        ga4Service.getActiveUsers(ranges.today.startDate, ranges.today.endDate),
        ga4Service.getActiveUsers(ranges.last7Days.startDate, ranges.last7Days.endDate),
        ga4Service.getActiveUsers(ranges.last30Days.startDate, ranges.last30Days.endDate),
      ]);

      // Calculate totals
      const calculateTotal = (data, metric) => {
        return data.data.reduce((sum, item) => sum + (item[metric] || 0), 0);
      };

      return {
        daily: {
          activeUsers: calculateTotal(daily, 'activeUsers'),
          newUsers: calculateTotal(daily, 'newUsers'),
          trend: daily.data,
        },
        weekly: {
          activeUsers: calculateTotal(weekly, 'activeUsers'),
          newUsers: calculateTotal(weekly, 'newUsers'),
          trend: weekly.data,
        },
        monthly: {
          activeUsers: calculateTotal(monthly, 'activeUsers'),
          newUsers: calculateTotal(monthly, 'newUsers'),
          trend: monthly.data,
        },
      };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Active Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active users',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/device-breakdown
 * Get device and platform analytics
 */
exports.getDeviceBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `device_breakdown_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const [devices, os, browsers] = await Promise.all([
        ga4Service.getDeviceBreakdown(startDate, endDate),
        ga4Service.getOperatingSystemBreakdown(startDate, endDate),
        ga4Service.getBrowserBreakdown(startDate, endDate),
      ]);

      // Group by platform
      const platformData = {};
      devices.data.forEach(item => {
        const platform = item.platform;
        if (!platformData[platform]) {
          platformData[platform] = {
            activeUsers: 0,
            sessions: 0,
            screenPageViews: 0,
          };
        }
        platformData[platform].activeUsers += item.activeUsers || 0;
        platformData[platform].sessions += item.sessions || 0;
        platformData[platform].screenPageViews += item.screenPageViews || 0;
      });

      return {
        platforms: platformData,
        devices: devices.data,
        operatingSystems: os.data.slice(0, 10),
        browsers: browsers.data.slice(0, 10),
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Device Breakdown Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device breakdown',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/audience
 * Get audience demographics and geography
 */
exports.getAudienceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `audience_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const [countries, cities, languages] = await Promise.all([
        ga4Service.getGeographicData(startDate, endDate, 'country'),
        ga4Service.getGeographicData(startDate, endDate, 'city'),
        ga4Service.getLanguageBreakdown(startDate, endDate),
      ]);

      return {
        topCountries: countries.data.slice(0, 20),
        topCities: cities.data.slice(0, 20),
        languages: languages.data.slice(0, 15),
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Audience Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audience analytics',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/traffic-trends
 * Get traffic trends over time
 */
exports.getTrafficTrends = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `traffic_trends_${startDate}_${endDate}`;

    const result = 
    await getCachedOrFetch(cacheKey, async () => {
      const trends = await ga4Service.getTrafficTrends(startDate, endDate);
      
      return {
        daily: trends.data,
        summary: {
          totalUsers: trends.data.reduce((sum, item) => sum + (item.activeUsers || 0), 0),
          totalSessions: trends.data.reduce((sum, item) => sum + (item.sessions || 0), 0),
          totalPageViews: trends.data.reduce((sum, item) => sum + (item.screenPageViews || 0), 0),
          totalEvents: trends.data.reduce((sum, item) => sum + (item.eventCount || 0), 0),
        },
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Traffic Trends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic trends',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/top-screens
 * Get most viewed screens/pages
 */
exports.getTopScreens = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const { limit = 20 } = req.query;
    const cacheKey = `top_screens_${startDate}_${endDate}_${limit}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const [screens, pages] = await Promise.all([
        ga4Service.getTopScreens(startDate, endDate, limit),
        ga4Service.getTopPages(startDate, endDate, limit),
      ]);

      return {
        screens: screens.data,
        pages: pages.data,
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Top Screens Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top screens',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/retention
 * Get user retention analytics
 */
exports.getRetentionAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `retention_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const retention = await ga4Service.getUserRetention(startDate, endDate);
      
      // Calculate retention rates for Day 1, 7, 30
      const calculateRetention = (day) => {
        const dayData = retention.data.filter(item => item.cohortNthDay === String(day));
        if (dayData.length === 0) return 0;
        
        const totalActive = dayData.reduce((sum, item) => sum + (item.cohortActiveUsers || 0), 0);
        const totalUsers = dayData.reduce((sum, item) => sum + (item.cohortTotalUsers || 1), 0);
        
        return ((totalActive / totalUsers) * 100).toFixed(2);
      };

      return {
        day1Retention: calculateRetention(1),
        day7Retention: calculateRetention(7),
        day30Retention: calculateRetention(30),
        rawData: retention.data,
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Retention Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retention analytics',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/notifications
 * Get notification analytics
 */
exports.getNotificationAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `notifications_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const notifications = await ga4Service.getNotificationAnalytics(startDate, endDate);
      
      // Parse notification events
      const notificationData = {
        opens: 0,
        clicks: 0,
        dismissals: 0,
        total: 0,
      };

      notifications.data.forEach(event => {
        const eventName = event.eventName.toLowerCase();
        const count = event.eventCount || 0;
        
        if (eventName.includes('open')) {
          notificationData.opens += count;
        } else if (eventName.includes('click')) {
          notificationData.clicks += count;
        } else if (eventName.includes('dismiss')) {
          notificationData.dismissals += count;
        }
        
        notificationData.total += count;
      });

      // Calculate click rate
      const clickRate = notificationData.opens > 0
        ? ((notificationData.clicks / notificationData.opens) * 100).toFixed(2)
        : 0;

      return {
        ...notificationData,
        clickRate,
        events: notifications.data,
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Notification Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification analytics',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/realtime
 * Get real-time active users
 */
exports.getRealtimeUsers = async (req, res) => {
  try {
    // Don't cache realtime data
    const realtime = await ga4Service.getRealtimeUsers();
    
    const platformData = {};
    realtime.data.forEach(item => {
      platformData[item.platform] = {
        activeUsers: item.activeUsers || 0,
        screenPageViews: item.screenPageViews || 0,
      };
    });

    res.json({
      success: true,
      data: {
        platforms: platformData,
        totalActiveUsers: realtime.data.reduce((sum, item) => sum + (item.activeUsers || 0), 0),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Realtime Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch realtime users',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/traffic-sources
 * Get traffic source analytics
 */
exports.getTrafficSources = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const cacheKey = `traffic_sources_${startDate}_${endDate}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const sources = await ga4Service.getTrafficSources(startDate, endDate);
      
      return {
        sources: sources.data,
        summary: {
          totalSessions: sources.data.reduce((sum, item) => sum + (item.sessions || 0), 0),
          totalUsers: sources.data.reduce((sum, item) => sum + (item.activeUsers || 0), 0),
        },
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Traffic Sources Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic sources',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/analytics/custom-events
 * Get custom event tracking
 */
exports.getCustomEvents = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const { events } = req.query; // Comma-separated event names
    const eventNames = events ? events.split(',') : [];
    
    const cacheKey = `custom_events_${startDate}_${endDate}_${events || 'all'}`;

    const result = await getCachedOrFetch(cacheKey, async () => {
      const customEvents = await ga4Service.getCustomEvents(startDate, endDate, eventNames);
      
      return {
        events: customEvents.data,
        summary: {
          totalEvents: customEvents.data.reduce((sum, item) => sum + (item.eventCount || 0), 0),
          uniqueEventTypes: customEvents.data.length,
        },
      };
    });

    res.json({
      success: true,
      data: result,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Custom Events Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom events',
      error: error.message,
    });
  }
};

/**
 * POST /api/admin/analytics/clear-cache
 * Clear analytics cache
 */
exports.clearCache = async (req, res) => {
  try {
    cache.flushAll();
    
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully',
    });
  } catch (error) {
    console.error('Clear Cache Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
};
