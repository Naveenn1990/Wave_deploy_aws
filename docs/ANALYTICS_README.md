# Firebase Analytics Backend Module

## 📊 Overview

Complete production-ready backend module for fetching Firebase Analytics data via Google Analytics 4 (GA4) Data API and exposing it through REST APIs for your admin dashboard.

## 🏗️ Architecture

```
wave_backend/
├── config/
│   └── ga4.js                          # GA4 client configuration
├── services/
│   └── ga4Service.js                   # Reusable GA4 service methods
├── controllers/
│   └── firebaseAnalyticsController.js  # API endpoint controllers
├── routes/
│   └── firebaseAnalyticsRoutes.js      # Route definitions
├── middleware/
│   └── validateAnalytics.js            # Request validation
├── utils/
│   └── analyticsHelper.js              # Helper utilities
└── docs/
    ├── FIREBASE_ANALYTICS_SETUP.md     # Setup guide
    ├── API_DOCUMENTATION.md            # API reference
    └── ANALYTICS_README.md             # This file
```

## ✨ Features

### Dashboard Metrics
- ✅ Daily/Weekly/Monthly Active Users
- ✅ New Users vs Returning Users
- ✅ Total Sessions
- ✅ Average Engagement Time
- ✅ Screen/Page Views
- ✅ Event Count

### Device Analytics
- ✅ Platform breakdown (Android, iOS, Web)
- ✅ Device category analysis
- ✅ Operating system distribution
- ✅ Browser breakdown (for web users)

### Audience Analytics
- ✅ Top countries
- ✅ Top cities
- ✅ Language preferences
- ✅ Geographic distribution

### Retention Analytics
- ✅ Day 1 retention rate
- ✅ Day 7 retention rate
- ✅ Day 30 retention rate
- ✅ Cohort analysis

### Traffic Analytics
- ✅ Daily traffic trends
- ✅ Weekly traffic patterns
- ✅ Monthly traffic analysis
- ✅ Traffic source breakdown

### Screen/Page Analytics
- ✅ Most viewed screens (mobile)
- ✅ Most viewed pages (web)
- ✅ Screen engagement metrics
- ✅ Average time on screen

### Notification Analytics
- ✅ Notification opens
- ✅ Notification clicks
- ✅ Click-through rate
- ✅ Notification dismissals

### Real-time Analytics
- ✅ Currently active users
- ✅ Real-time platform breakdown
- ✅ Live page views

### Custom Events
- ✅ Track custom events
- ✅ Event count per user
- ✅ Event value tracking
- ✅ Platform-wise event breakdown

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd wave_backend
npm install
```

### 2. Configure Environment
Add to `.env`:
```env
GA4_PROPERTY_ID=properties/YOUR_PROPERTY_ID
```

### 3. Enable GA4 Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Google Analytics Data API"

### 4. Start Server
```bash
npm start
```

### 5. Test API
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/dashboard-summary?period=last30Days" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard-summary` | GET | Overall metrics summary |
| `/active-users` | GET | Daily/Weekly/Monthly active users |
| `/device-breakdown` | GET | Platform, OS, Browser data |
| `/audience` | GET | Geographic and demographic data |
| `/traffic-trends` | GET | Daily traffic trends |
| `/top-screens` | GET | Most viewed screens/pages |
| `/retention` | GET | User retention rates |
| `/notifications` | GET | Notification analytics |
| `/realtime` | GET | Real-time active users |
| `/traffic-sources` | GET | Traffic source breakdown |
| `/custom-events` | GET | Custom event tracking |
| `/clear-cache` | POST | Clear analytics cache |

**Base URL:** `/api/admin/firebase-analytics`

## 🔧 Configuration

### GA4 Service Configuration
File: `config/ga4.js`

```javascript
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Initialize client with service account
const client = new BetaAnalyticsDataClient({
  keyFilename: './firebase-admin.json',
});
```

### Cache Configuration
File: `controllers/firebaseAnalyticsController.js`

```javascript
// Cache for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
```

## 📊 Data Models

### Dashboard Summary Response
```typescript
{
  activeUsers: number;
  newUsers: number;
  sessions: number;
  screenPageViews: number;
  engagementRate: string;
  averageSessionDuration: number;
  eventCount: number;
}
```

### Active Users Response
```typescript
{
  daily: {
    activeUsers: number;
    newUsers: number;
    trend: Array<{date: string, activeUsers: number, newUsers: number}>;
  };
  weekly: {...};
  monthly: {...};
}
```

### Device Breakdown Response
```typescript
{
  platforms: {
    [platform: string]: {
      activeUsers: number;
      sessions: number;
      screenPageViews: number;
    };
  };
  devices: Array<DeviceData>;
  operatingSystems: Array<OSData>;
  browsers: Array<BrowserData>;
}
```

## 🛠️ Service Methods

### GA4Service Class
File: `services/ga4Service.js`

#### Core Methods
- `runReport(config)` - Run custom GA4 report
- `formatResponse(response)` - Format GA4 API response

#### User Metrics
- `getActiveUsers(startDate, endDate)` - Get active users
- `getUserEngagement(startDate, endDate)` - Get engagement metrics
- `getUserRetention(startDate, endDate)` - Get retention data

#### Device Metrics
- `getDeviceBreakdown(startDate, endDate)` - Get device data
- `getOperatingSystemBreakdown(startDate, endDate)` - Get OS data
- `getBrowserBreakdown(startDate, endDate)` - Get browser data

#### Geographic Metrics
- `getGeographicData(startDate, endDate, dimension)` - Get geo data
- `getLanguageBreakdown(startDate, endDate)` - Get language data

#### Content Metrics
- `getTopScreens(startDate, endDate, limit)` - Get top screens
- `getTopPages(startDate, endDate, limit)` - Get top pages

#### Traffic Metrics
- `getTrafficTrends(startDate, endDate)` - Get traffic trends
- `getTrafficSources(startDate, endDate)` - Get traffic sources

#### Event Metrics
- `getEventData(startDate, endDate, eventName)` - Get event data
- `getNotificationAnalytics(startDate, endDate)` - Get notification data
- `getCustomEvents(startDate, endDate, eventNames)` - Get custom events

#### Real-time Metrics
- `getRealtimeUsers()` - Get real-time active users

## 🔐 Security

### Authentication
All endpoints require admin authentication:
```javascript
router.get('/dashboard-summary', adminAuth, controller.getDashboardSummary);
```

### Authorization
Admin middleware checks JWT token:
```javascript
const { adminAuth } = require('../middleware/adminAuth');
```

### Service Account Security
- Never commit `firebase-admin.json` to version control
- Set proper file permissions (600)
- Rotate keys periodically

## ⚡ Performance

### Caching Strategy
- **Cache Duration:** 5 minutes
- **Cache Key Format:** `{endpoint}_{startDate}_{endDate}`
- **Cache Library:** node-cache

### Cache Benefits
- Reduces API calls to GA4
- Improves response time
- Stays within API quotas

### Clear Cache
```bash
POST /api/admin/firebase-analytics/clear-cache
```

## 📈 Usage Examples

### Frontend Integration (React)

#### Fetch Dashboard Summary
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const DashboardSummary = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          '/api/admin/firebase-analytics/dashboard-summary',
          {
            params: { period: 'last30Days' },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
        setData(response.data.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-summary">
      <div className="metric-card">
        <h3>Active Users</h3>
        <p>{data.activeUsers.toLocaleString()}</p>
      </div>
      <div className="metric-card">
        <h3>New Users</h3>
        <p>{data.newUsers.toLocaleString()}</p>
      </div>
      <div className="metric-card">
        <h3>Sessions</h3>
        <p>{data.sessions.toLocaleString()}</p>
      </div>
      <div className="metric-card">
        <h3>Engagement Rate</h3>
        <p>{data.engagementRate}%</p>
      </div>
    </div>
  );
};
```

#### Fetch Device Breakdown
```javascript
const DeviceAnalytics = () => {
  const [devices, setDevices] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      const response = await axios.get(
        '/api/admin/firebase-analytics/device-breakdown',
        {
          params: { period: 'last7Days' },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setDevices(response.data.data);
    };

    fetchDevices();
  }, []);

  return (
    <div>
      <h2>Platform Distribution</h2>
      {devices?.platforms && Object.entries(devices.platforms).map(([platform, data]) => (
        <div key={platform}>
          <h3>{platform}</h3>
          <p>Users: {data.activeUsers}</p>
          <p>Sessions: {data.sessions}</p>
        </div>
      ))}
    </div>
  );
};
```

#### Fetch Traffic Trends (Chart)
```javascript
import { Line } from 'react-chartjs-2';

const TrafficChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      const response = await axios.get(
        '/api/admin/firebase-analytics/traffic-trends',
        {
          params: { period: 'last30Days' },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const trends = response.data.data.daily;
      
      setChartData({
        labels: trends.map(d => d.date),
        datasets: [
          {
            label: 'Active Users',
            data: trends.map(d => d.activeUsers),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'Sessions',
            data: trends.map(d => d.sessions),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }
        ]
      });
    };

    fetchTrends();
  }, []);

  return chartData ? <Line data={chartData} /> : <div>Loading...</div>;
};
```

## 🧪 Testing

### Test Endpoints with cURL

#### Dashboard Summary
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/dashboard-summary?period=last30Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Active Users
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/active-users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Device Breakdown
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/device-breakdown?period=last7Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test with Postman

1. Import collection from `docs/postman_collection.json`
2. Set environment variable `ADMIN_TOKEN`
3. Run requests

## 🐛 Troubleshooting

### Common Issues

#### 1. "GA4_PROPERTY_ID not found"
**Solution:** Add to `.env`:
```env
GA4_PROPERTY_ID=properties/123456789
```

#### 2. "Failed to initialize GA4 client"
**Causes:**
- Missing `firebase-admin.json`
- Invalid service account credentials
- Insufficient permissions

**Solution:**
- Verify file exists
- Check service account has Viewer role
- Ensure correct project

#### 3. "Google Analytics Data API has not been used"
**Solution:**
1. Go to Google Cloud Console
2. Enable "Google Analytics Data API"
3. Wait 5-10 minutes

#### 4. No data returned
**Causes:**
- No analytics data in Firebase
- Wrong property ID
- Date range has no data

**Solution:**
- Check Firebase Console > Analytics
- Verify property ID
- Try wider date range

## 📚 Additional Resources

- [Setup Guide](./FIREBASE_ANALYTICS_SETUP.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [GA4 Data API Docs](https://developers.google.com/analytics/devguides/reporting/data/v1)

## 🤝 Support

For issues or questions:
1. Check server logs
2. Verify Firebase Console
3. Review Google Cloud Console
4. Check API quotas

## 📝 License

This module is part of the WaveTech Service platform.

---

**Built with ❤️ for WaveTech Service**
