/**
 * GA4 Service - Firebase Analytics Data Fetching
 * Provides reusable methods to fetch analytics data from Google Analytics 4
 */

const { initializeGA4Client, getPropertyId, formatDateForGA4 } = require('../config/ga4');

class GA4Service {
  constructor() {
    this.client = null;
    this.propertyId = null;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (!this.client) {
      this.client = initializeGA4Client();
      const rawPropertyId = getPropertyId();
      // Ensure we only have the numeric ID, remove any "properties/" prefix if present
      const numericId = rawPropertyId.replace(/^properties\//, '');
      this.propertyId = `properties/${numericId}`;
    }
  }

  /**
   * Run a GA4 report with custom dimensions and metrics
   */
  async runReport(config) {
    await this.initialize();

    const {
      startDate = '30daysAgo',
      endDate = 'today',
      dimensions = [],
      metrics = [],
      dimensionFilter = null,
      metricFilter = null,
      orderBys = [],
      limit = 10000,
      offset = 0,
    } = config;

    try {
      const request = {
        property: this.propertyId,
        dateRanges: [
          {
            startDate: formatDateForGA4(startDate),
            endDate: formatDateForGA4(endDate),
          },
        ],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
        limit,
        offset,
      };

      // Add optional filters
      if (dimensionFilter) {
        request.dimensionFilter = dimensionFilter;
      }

      if (metricFilter) {
        request.metricFilter = metricFilter;
      }

      if (orderBys && orderBys.length > 0) {
        request.orderBys = orderBys;
      }

      const [response] = await this.client.runReport(request);
      return this.formatResponse(response);
    } catch (error) {
      console.error('GA4 Report Error:', error.message);
      throw new Error(`Failed to fetch GA4 report: ${error.message}`);
    }
  }

  /**
   * Format GA4 API response to a clean structure
   */
  formatResponse(response) {
    const rows = response.rows || [];
    const dimensionHeaders = response.dimensionHeaders || [];
    const metricHeaders = response.metricHeaders || [];

    const formattedData = rows.map(row => {
      const data = {};

      // Add dimensions
      dimensionHeaders.forEach((header, index) => {
        data[header.name] = row.dimensionValues[index].value;
      });

      // Add metrics
      metricHeaders.forEach((header, index) => {
        const value = row.metricValues[index].value;
        data[header.name] = isNaN(value) ? value : Number(value);
      });

      return data;
    });

    return {
      data: formattedData,
      rowCount: response.rowCount || 0,
      metadata: {
        dimensions: dimensionHeaders.map(h => h.name),
        metrics: metricHeaders.map(h => h.name),
      },
    };
  }

  /**
   * Get active users (daily, weekly, monthly)
   */
  async getActiveUsers(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['date'],
      metrics: ['activeUsers', 'newUsers'],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      metrics: [
        'activeUsers',
        'newUsers',
        'sessions',
        'engagementRate',
        'averageSessionDuration',
        'screenPageViews',
        'eventCount',
      ],
    });
  }

  /**
   * Get device breakdown (platform)
   */
  async getDeviceBreakdown(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['platform', 'deviceCategory'],
      metrics: ['activeUsers', 'sessions', 'screenPageViews'],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    });
  }

  /**
   * Get operating system breakdown
   */
  async getOperatingSystemBreakdown(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['operatingSystem', 'operatingSystemVersion'],
      metrics: ['activeUsers', 'sessions'],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    });
  }

  /**
   * Get browser breakdown (for web users)
   */
  async getBrowserBreakdown(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['browser', 'browserVersion'],
      metrics: ['activeUsers', 'sessions'],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    });
  }

  /**
   * Get geographic data (countries and cities)
   */
  async getGeographicData(startDate, endDate, dimension = 'country') {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: [dimension],
      metrics: ['activeUsers', 'sessions', 'newUsers'],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 50,
    });
  }

  /**
   * Get language breakdown
   */
  async getLanguageBreakdown(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['language'],
      metrics: ['activeUsers', 'sessions'],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    });
  }

  /**
   * Get top screens/pages
   */
  async getTopScreens(startDate, endDate, limit = 20) {
    try {
      // Try with both screen dimensions first
      return await this.runReport({
        startDate,
        endDate,
        dimensions: ['unifiedScreenName'],
        metrics: ['screenPageViews', 'activeUsers'],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit,
      });
    } catch (error) {
      // If unifiedScreenName fails, try with just screenName
      try {
        return await this.runReport({
          startDate,
          endDate,
          dimensions: ['screenName'],
          metrics: ['screenPageViews', 'activeUsers'],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit,
        });
      } catch (fallbackError) {
        // If both fail, try with pagePath for web properties
        return await this.runReport({
          startDate,
          endDate,
          dimensions: ['pagePath'],
          metrics: ['screenPageViews', 'activeUsers'],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit,
        });
      }
    }
  }

  /**
   * Get top pages (for web)
   */
  async getTopPages(startDate, endDate, limit = 20) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['pagePath', 'pageTitle'],
      metrics: ['screenPageViews', 'activeUsers', 'averageSessionDuration'],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    });
  }

  /**
   * Get traffic trends (daily breakdown)
   */
  async getTrafficTrends(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['date'],
      metrics: ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'eventCount'],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });
  }

  /**
   * Get user retention data
   * Note: Cohort analysis requires special configuration
   */
  async getUserRetention(startDate, endDate) {
    await this.initialize();

    try {
      // Use a simpler approach: compare new users vs returning users
      const request = {
        property: this.propertyId,
        dateRanges: [
          {
            startDate: formatDateForGA4(startDate),
            endDate: formatDateForGA4(endDate),
          },
        ],
        dimensions: [{ name: 'date' }, { name: 'newVsReturning' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      };

      const [response] = await this.client.runReport(request);
      return this.formatResponse(response);
    } catch (error) {
      console.error('Retention Analytics Error:', error.message);
      // Return empty data instead of throwing
      return {
        data: [],
        rowCount: 0,
        metadata: {
          dimensions: ['date', 'newVsReturning'],
          metrics: ['activeUsers'],
        },
      };
    }
  }

  /**
   * Get event data (for notification tracking)
   */
  async getEventData(startDate, endDate, eventName = null) {
    const config = {
      startDate,
      endDate,
      dimensions: ['eventName'],
      metrics: ['eventCount', 'eventCountPerUser'],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    };

    // Filter by specific event if provided
    if (eventName) {
      config.dimensionFilter = {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: eventName,
          },
        },
      };
    }

    return await this.runReport(config);
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(startDate, endDate) {
    // Get notification-related events
    const notificationEvents = await this.runReport({
      startDate,
      endDate,
      dimensions: ['eventName'],
      metrics: ['eventCount', 'eventCountPerUser'],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'notification',
          },
        },
      },
    });

    return notificationEvents;
  }

  /**
   * Get real-time active users (last 30 minutes)
   */
  async getRealtimeUsers() {
    await this.initialize();

    try {
      const [response] = await this.client.runRealtimeReport({
        property: this.propertyId,
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
        dimensions: [
          { name: 'platform' },
        ],
      });

      return this.formatResponse(response);
    } catch (error) {
      console.error('Realtime Report Error:', error.message);
      throw new Error(`Failed to fetch realtime data: ${error.message}`);
    }
  }

  /**
   * Get custom event tracking
   */
  async getCustomEvents(startDate, endDate, eventNames = []) {
    const config = {
      startDate,
      endDate,
      dimensions: ['eventName', 'platform'],
      metrics: ['eventCount', 'eventCountPerUser', 'eventValue'],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    };

    if (eventNames.length > 0) {
      config.dimensionFilter = {
        orGroup: {
          expressions: eventNames.map(name => ({
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                matchType: 'EXACT',
                value: name,
              },
            },
          })),
        },
      };
    }

    return await this.runReport(config);
  }

  /**
   * Get session source/medium (traffic sources)
   */
  async getTrafficSources(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
      metrics: ['sessions', 'activeUsers', 'newUsers'],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    });
  }

  /**
   * Get user demographics (age and gender)
   */
  async getUserDemographics(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['userAgeBracket', 'userGender'],
      metrics: ['activeUsers', 'sessions'],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    });
  }

  /**
   * Get web-specific analytics (filter by web platform)
   */
  async getWebAnalytics(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['platform'],
      metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagementRate', 'averageSessionDuration'],
      dimensionFilter: {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            matchType: 'EXACT',
            value: 'web',
          },
        },
      },
    });
  }

  /**
   * Get web page views (top pages on website)
   */
  async getWebPageViews(startDate, endDate, limit = 20) {
    try {
      return await this.runReport({
        startDate,
        endDate,
        dimensions: ['pagePath', 'pageTitle'],
        metrics: ['screenPageViews', 'activeUsers', 'averageSessionDuration', 'bounceRate'],
        dimensionFilter: {
          filter: {
            fieldName: 'platform',
            stringFilter: {
              matchType: 'EXACT',
              value: 'web',
            },
          },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit,
      });
    } catch (error) {
      // Fallback without bounceRate if not available
      return await this.runReport({
        startDate,
        endDate,
        dimensions: ['pagePath', 'pageTitle'],
        metrics: ['screenPageViews', 'activeUsers', 'averageSessionDuration'],
        dimensionFilter: {
          filter: {
            fieldName: 'platform',
            stringFilter: {
              matchType: 'EXACT',
              value: 'web',
            },
          },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit,
      });
    }
  }

  /**
   * Get web user activity (sessions over time for web only)
   */
  async getWebUserActivity(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['date', 'platform'],
      metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagementRate'],
      dimensionFilter: {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            matchType: 'EXACT',
            value: 'web',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });
  }

  /**
   * Get web traffic sources (where web users come from)
   */
  async getWebTrafficSources(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['sessionSource', 'sessionMedium'],
      metrics: ['sessions', 'activeUsers', 'newUsers', 'engagementRate'],
      dimensionFilter: {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            matchType: 'EXACT',
            value: 'web',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    });
  }

  /**
   * Get web device breakdown (desktop vs mobile vs tablet)
   */
  async getWebDeviceBreakdown(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['deviceCategory'],
      metrics: ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration'],
      dimensionFilter: {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            matchType: 'EXACT',
            value: 'web',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    });
  }

  /**
   * Get web browser breakdown
   */
  async getWebBrowserBreakdown(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['browser'],
      metrics: ['activeUsers', 'sessions', 'engagementRate'],
      dimensionFilter: {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            matchType: 'EXACT',
            value: 'web',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    });
  }

  /**
   * Get web user engagement events
   */
  async getWebUserEvents(startDate, endDate) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['eventName'],
      metrics: ['eventCount', 'eventCountPerUser'],
      dimensionFilter: {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            matchType: 'EXACT',
            value: 'web',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    });
  }

  /**
   * Get web landing pages (entry pages)
   */
  async getWebLandingPages(startDate, endDate, limit = 10) {
    return await this.runReport({
      startDate,
      endDate,
      dimensions: ['landingPage'],
      metrics: ['sessions', 'activeUsers', 'engagementRate'],
      dimensionFilter: {
        filter: {
          fieldName: 'platform',
          stringFilter: {
            matchType: 'EXACT',
            value: 'web',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    });
  }

  /**
   * Get web exit pages (where users leave)
   */
  async getWebExitPages(startDate, endDate, limit = 10) {
    try {
      return await this.runReport({
        startDate,
        endDate,
        dimensions: ['pagePath'],
        metrics: ['exits', 'screenPageViews'],
        dimensionFilter: {
          filter: {
            fieldName: 'platform',
            stringFilter: {
              matchType: 'EXACT',
              value: 'web',
            },
          },
        },
        orderBys: [{ metric: { metricName: 'exits' }, desc: true }],
        limit,
      });
    } catch (error) {
      // Fallback if exits metric not available
      return { data: [], rowCount: 0, metadata: {} };
    }
  }
}

// Export singleton instance
module.exports = new GA4Service();
