/**
 * Analytics Helper Utilities
 * Reusable utility functions for analytics processing
 */

/**
 * Calculate percentage change between two values
 */
exports.calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return (((current - previous) / previous) * 100).toFixed(2);
};

/**
 * Format large numbers with K, M, B suffixes
 */
exports.formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format duration in seconds to human-readable format
 */
exports.formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

/**
 * Group data by date
 */
exports.groupByDate = (data, dateField = 'date') => {
  const grouped = {};
  
  data.forEach(item => {
    const date = item[dateField];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });
  
  return grouped;
};

/**
 * Calculate moving average
 */
exports.calculateMovingAverage = (data, windowSize = 7) => {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(Math.round(average));
  }
  
  return result;
};

/**
 * Get date range labels
 */
exports.getDateRangeLabels = (startDate, endDate) => {
  const labels = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    labels.push(d.toISOString().split('T')[0]);
  }
  
  return labels;
};

/**
 * Calculate growth rate
 */
exports.calculateGrowthRate = (data, valueField) => {
  if (data.length < 2) return 0;
  
  const firstValue = data[0][valueField] || 0;
  const lastValue = data[data.length - 1][valueField] || 0;
  
  if (firstValue === 0) return lastValue > 0 ? 100 : 0;
  
  return (((lastValue - firstValue) / firstValue) * 100).toFixed(2);
};

/**
 * Aggregate metrics by dimension
 */
exports.aggregateByDimension = (data, dimension, metrics) => {
  const aggregated = {};
  
  data.forEach(item => {
    const key = item[dimension];
    if (!aggregated[key]) {
      aggregated[key] = {};
      metrics.forEach(metric => {
        aggregated[key][metric] = 0;
      });
    }
    
    metrics.forEach(metric => {
      aggregated[key][metric] += item[metric] || 0;
    });
  });
  
  return Object.entries(aggregated).map(([key, values]) => ({
    [dimension]: key,
    ...values,
  }));
};

/**
 * Sort data by metric
 */
exports.sortByMetric = (data, metric, descending = true) => {
  return [...data].sort((a, b) => {
    const aVal = a[metric] || 0;
    const bVal = b[metric] || 0;
    return descending ? bVal - aVal : aVal - bVal;
  });
};

/**
 * Filter data by threshold
 */
exports.filterByThreshold = (data, metric, threshold, operator = '>=') => {
  return data.filter(item => {
    const value = item[metric] || 0;
    switch (operator) {
      case '>=':
        return value >= threshold;
      case '>':
        return value > threshold;
      case '<=':
        return value <= threshold;
      case '<':
        return value < threshold;
      case '==':
        return value === threshold;
      default:
        return true;
    }
  });
};

/**
 * Calculate percentile
 */
exports.calculatePercentile = (data, metric, percentile) => {
  const values = data.map(item => item[metric] || 0).sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  return values[index] || 0;
};

/**
 * Normalize data to percentage
 */
exports.normalizeToPercentage = (data, metric) => {
  const total = data.reduce((sum, item) => sum + (item[metric] || 0), 0);
  
  return data.map(item => ({
    ...item,
    [`${metric}Percentage`]: total > 0 ? ((item[metric] / total) * 100).toFixed(2) : 0,
  }));
};

/**
 * Fill missing dates with zero values
 */
exports.fillMissingDates = (data, startDate, endDate, metrics) => {
  const dateMap = new Map();
  data.forEach(item => {
    dateMap.set(item.date, item);
  });
  
  const result = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (dateMap.has(dateStr)) {
      result.push(dateMap.get(dateStr));
    } else {
      const emptyData = { date: dateStr };
      metrics.forEach(metric => {
        emptyData[metric] = 0;
      });
      result.push(emptyData);
    }
  }
  
  return result;
};

/**
 * Calculate conversion rate
 */
exports.calculateConversionRate = (conversions, total) => {
  if (total === 0) return 0;
  return ((conversions / total) * 100).toFixed(2);
};

/**
 * Get top N items
 */
exports.getTopN = (data, metric, n = 10) => {
  return this.sortByMetric(data, metric, true).slice(0, n);
};

/**
 * Calculate average
 */
exports.calculateAverage = (data, metric) => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + (item[metric] || 0), 0);
  return (sum / data.length).toFixed(2);
};

/**
 * Calculate median
 */
exports.calculateMedian = (data, metric) => {
  const values = data.map(item => item[metric] || 0).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  
  if (values.length % 2 === 0) {
    return (values[mid - 1] + values[mid]) / 2;
  }
  return values[mid];
};
