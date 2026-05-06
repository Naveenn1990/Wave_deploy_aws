# Firebase Analytics API Documentation

## Base URL
```
http://localhost:9000/api/admin/firebase-analytics
```

## Authentication
All endpoints require admin authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

---

## Common Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `startDate` | string | Start date in YYYY-MM-DD or GA4 format | `2026-04-01` or `30daysAgo` |
| `endDate` | string | End date in YYYY-MM-DD or GA4 format | `2026-05-06` or `today` |
| `period` | string | Predefined period | `today`, `yesterday`, `last7Days`, `last30Days`, `last90Days` |
| `limit` | number | Maximum number of results | `20` |

---

## Endpoints

### 1. Dashboard Summary

Get overall dashboard metrics summary.

**Endpoint:** `GET /dashboard-summary`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/dashboard-summary?period=last30Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 1250,
    "newUsers": 320,
    "sessions": 2100,
    "screenPageViews": 8500,
    "engagementRate": "65.50",
    "averageSessionDuration": 245,
    "eventCount": 15000,
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-06",
    "endDate": "2026-05-06"
  }
}
```

---

### 2. Active Users

Get daily, weekly, and monthly active users with trends.

**Endpoint:** `GET /active-users`

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/active-users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "daily": {
      "activeUsers": 450,
      "newUsers": 85,
      "trend": [
        { "date": "2026-05-06", "activeUsers": 450, "newUsers": 85 }
      ]
    },
    "weekly": {
      "activeUsers": 1200,
      "newUsers": 280,
      "trend": [...]
    },
    "monthly": {
      "activeUsers": 3500,
      "newUsers": 890,
      "trend": [...]
    },
    "fromCache": false
  }
}
```

---

### 3. Device Breakdown

Get platform, device, OS, and browser analytics.

**Endpoint:** `GET /device-breakdown`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/device-breakdown?period=last7Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": {
      "Android": {
        "activeUsers": 850,
        "sessions": 1500,
        "screenPageViews": 6000
      },
      "iOS": {
        "activeUsers": 320,
        "sessions": 550,
        "screenPageViews": 2200
      },
      "web": {
        "activeUsers": 80,
        "sessions": 120,
        "screenPageViews": 300
      }
    },
    "devices": [
      {
        "platform": "Android",
        "deviceCategory": "mobile",
        "activeUsers": 800,
        "sessions": 1400,
        "screenPageViews": 5500
      }
    ],
    "operatingSystems": [
      {
        "operatingSystem": "Android",
        "operatingSystemVersion": "13",
        "activeUsers": 450,
        "sessions": 800
      }
    ],
    "browsers": [
      {
        "browser": "Chrome",
        "browserVersion": "120.0",
        "activeUsers": 60,
        "sessions": 95
      }
    ],
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-29",
    "endDate": "2026-05-06"
  }
}
```

---

### 4. Audience Analytics

Get geographic and demographic data.

**Endpoint:** `GET /audience`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/audience?period=last30Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topCountries": [
      {
        "country": "India",
        "activeUsers": 950,
        "sessions": 1700,
        "newUsers": 280
      },
      {
        "country": "United States",
        "activeUsers": 180,
        "sessions": 320,
        "newUsers": 45
      }
    ],
    "topCities": [
      {
        "city": "Bangalore",
        "activeUsers": 420,
        "sessions": 750,
        "newUsers": 120
      }
    ],
    "languages": [
      {
        "language": "en-us",
        "activeUsers": 800,
        "sessions": 1400
      },
      {
        "language": "hi",
        "activeUsers": 350,
        "sessions": 600
      }
    ],
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-06",
    "endDate": "2026-05-06"
  }
}
```

---

### 5. Traffic Trends

Get daily traffic trends over time.

**Endpoint:** `GET /traffic-trends`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/traffic-trends?period=last7Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "daily": [
      {
        "date": "2026-04-29",
        "activeUsers": 420,
        "newUsers": 85,
        "sessions": 750,
        "screenPageViews": 3200,
        "eventCount": 5500
      },
      {
        "date": "2026-04-30",
        "activeUsers": 450,
        "newUsers": 92,
        "sessions": 800,
        "screenPageViews": 3400,
        "eventCount": 5800
      }
    ],
    "summary": {
      "totalUsers": 3100,
      "totalSessions": 5500,
      "totalPageViews": 23000,
      "totalEvents": 39000
    },
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-29",
    "endDate": "2026-05-06"
  }
}
```

---

### 6. Top Screens/Pages

Get most viewed screens and pages.

**Endpoint:** `GET /top-screens`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date
- `limit` (optional): Number of results (default: 20)

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/top-screens?period=last30Days&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "screens": [
      {
        "screenName": "HomeScreen",
        "unifiedScreenName": "home",
        "screenPageViews": 4500,
        "activeUsers": 1200,
        "averageSessionDuration": 180
      },
      {
        "screenName": "ServiceListScreen",
        "unifiedScreenName": "services",
        "screenPageViews": 3200,
        "activeUsers": 950,
        "averageSessionDuration": 145
      }
    ],
    "pages": [
      {
        "pagePath": "/",
        "pageTitle": "Home - WaveTech",
        "screenPageViews": 1200,
        "activeUsers": 320,
        "averageSessionDuration": 95
      }
    ],
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-06",
    "endDate": "2026-05-06"
  }
}
```

---

### 7. Retention Analytics

Get user retention for Day 1, 7, and 30.

**Endpoint:** `GET /retention`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/retention?period=last90Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "day1Retention": "45.50",
    "day7Retention": "28.30",
    "day30Retention": "12.80",
    "rawData": [
      {
        "cohort": "2026-04-01",
        "cohortNthDay": "1",
        "cohortActiveUsers": 180,
        "cohortTotalUsers": 400
      }
    ],
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-02-06",
    "endDate": "2026-05-06"
  }
}
```

---

### 8. Notification Analytics

Get notification open rates and click rates.

**Endpoint:** `GET /notifications`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/notifications?period=last30Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "opens": 2500,
    "clicks": 1800,
    "dismissals": 450,
    "total": 4750,
    "clickRate": "72.00",
    "events": [
      {
        "eventName": "notification_open",
        "eventCount": 2500,
        "eventCountPerUser": 2.1
      },
      {
        "eventName": "notification_click",
        "eventCount": 1800,
        "eventCountPerUser": 1.5
      }
    ],
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-06",
    "endDate": "2026-05-06"
  }
}
```

---

### 9. Real-time Users

Get currently active users (last 30 minutes).

**Endpoint:** `GET /realtime`

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/realtime" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": {
      "Android": {
        "activeUsers": 45,
        "screenPageViews": 120
      },
      "iOS": {
        "activeUsers": 18,
        "screenPageViews": 52
      },
      "web": {
        "activeUsers": 5,
        "screenPageViews": 12
      }
    },
    "totalActiveUsers": 68,
    "timestamp": "2026-05-06T10:30:00.000Z"
  }
}
```

---

### 10. Traffic Sources

Get traffic source breakdown (organic, direct, referral, etc.).

**Endpoint:** `GET /traffic-sources`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/traffic-sources?period=last30Days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "sessionSource": "google",
        "sessionMedium": "organic",
        "sessionCampaignName": "(not set)",
        "sessions": 1200,
        "activeUsers": 850,
        "newUsers": 280
      },
      {
        "sessionSource": "direct",
        "sessionMedium": "(none)",
        "sessionCampaignName": "(not set)",
        "sessions": 800,
        "activeUsers": 550,
        "newUsers": 120
      }
    ],
    "summary": {
      "totalSessions": 2100,
      "totalUsers": 1250
    },
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-06",
    "endDate": "2026-05-06"
  }
}
```

---

### 11. Custom Events

Get custom event tracking data.

**Endpoint:** `GET /custom-events`

**Query Parameters:**
- `period` (optional): Predefined period
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date
- `events` (optional): Comma-separated event names to filter

**Example Request:**
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/custom-events?period=last7Days&events=booking_completed,service_viewed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "eventName": "booking_completed",
        "platform": "Android",
        "eventCount": 450,
        "eventCountPerUser": 0.38,
        "eventValue": 125000
      },
      {
        "eventName": "service_viewed",
        "platform": "Android",
        "eventCount": 2800,
        "eventCountPerUser": 2.3,
        "eventValue": 0
      }
    ],
    "summary": {
      "totalEvents": 3250,
      "uniqueEventTypes": 2
    },
    "fromCache": false
  },
  "dateRange": {
    "startDate": "2026-04-29",
    "endDate": "2026-05-06"
  }
}
```

---

### 12. Clear Cache

Clear the analytics cache to force fresh data fetch.

**Endpoint:** `POST /clear-cache`

**Example Request:**
```bash
curl -X POST "http://localhost:9000/api/admin/firebase-analytics/clear-cache" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Analytics cache cleared successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid query parameters",
  "errors": ["startDate must be a valid date"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch dashboard summary",
  "error": "GA4_PROPERTY_ID not found in environment variables"
}
```

---

## Rate Limiting

Google Analytics Data API has the following quotas:
- **25,000 tokens per day** (free tier)
- **10 queries per second**

The backend implements caching (5 minutes TTL) to reduce API calls.

---

## Best Practices

1. **Use predefined periods** (`period` parameter) instead of custom dates when possible
2. **Cache responses** on the frontend for frequently accessed data
3. **Batch requests** when fetching multiple metrics
4. **Monitor API usage** in Google Cloud Console
5. **Use appropriate date ranges** - wider ranges take longer to process

---

## Support

For issues or questions, check:
1. Server logs for detailed error messages
2. Firebase Console for analytics data
3. Google Cloud Console for API status
