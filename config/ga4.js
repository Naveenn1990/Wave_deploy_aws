/**
 * Google Analytics 4 (GA4) Configuration
 * Handles Firebase Analytics data fetching via GA4 Data API
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');
require('dotenv').config();

/**
 * Initialize GA4 Analytics Data Client
 * Uses service account credentials from firebase-admin.json
 */
let analyticsDataClient = null;

const initializeGA4Client = () => {
  try {
    if (!analyticsDataClient) {
      // Use the same Firebase service account credentials
      const keyFilePath = path.join(__dirname, '..', 'firebase-admin.json');
      
      analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: keyFilePath,
      });
      
      console.log('✅ GA4 Analytics Data Client initialized successfully');
    }
    return analyticsDataClient;
  } catch (error) {
    console.error('❌ Error initializing GA4 client:', error.message);
    throw new Error('Failed to initialize GA4 Analytics client');
  }
};

/**
 * Get GA4 Property ID from environment
 */
const getPropertyId = () => {
  const propertyId = process.env.GA4_PROPERTY_ID;
  
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID not found in environment variables');
  }
  
  // Remove any "properties/" prefix if accidentally included
  const cleanId = propertyId.replace(/^properties\//, '');
  
  // Validate that it's numeric
  if (!/^\d+$/.test(cleanId)) {
    throw new Error(`GA4_PROPERTY_ID must be numeric. Got: ${cleanId}`);
  }
  
  return cleanId;
};

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (start > end) {
    throw new Error('Start date must be before end date');
  }
  
  return { start, end };
};

/**
 * Format date for GA4 API (YYYY-MM-DD)
 */
const formatDateForGA4 = (date) => {
  if (typeof date === 'string') {
    return date;
  }
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get date ranges for common periods
 */
const getDateRanges = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  const last90Days = new Date(today);
  last90Days.setDate(last90Days.getDate() - 90);
  
  return {
    today: {
      startDate: formatDateForGA4(today),
      endDate: formatDateForGA4(today),
    },
    yesterday: {
      startDate: formatDateForGA4(yesterday),
      endDate: formatDateForGA4(yesterday),
    },
    last7Days: {
      startDate: formatDateForGA4(last7Days),
      endDate: formatDateForGA4(today),
    },
    last30Days: {
      startDate: formatDateForGA4(last30Days),
      endDate: formatDateForGA4(today),
    },
    last90Days: {
      startDate: formatDateForGA4(last90Days),
      endDate: formatDateForGA4(today),
    },
  };
};

module.exports = {
  initializeGA4Client,
  getPropertyId,
  validateDateRange,
  formatDateForGA4,
  getDateRanges,
};
