# Firebase Analytics (GA4) Backend Setup Guide

## Overview
This guide will help you integrate Firebase Analytics (Google Analytics 4) with your Node.js backend to fetch analytics data and display it in your admin dashboard.

## Prerequisites
1. Firebase project with Analytics enabled
2. Google Analytics 4 (GA4) property linked to Firebase
3. Firebase Admin SDK service account credentials
4. Node.js backend with Express.js

---

## Step 1: Get Your GA4 Property ID

### Method 1: From Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **wave-755af**
3. Click on **Project Settings** (gear icon)
4. Go to **Integrations** tab
5. Find **Google Analytics** section
6. You'll see your **Property ID** (format: `123456789`)

### Method 2: From Google Analytics
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Go to **Admin** (bottom left)
4. Under **Property** column, click **Property Settings**
5. Copy the **Property ID** (numeric value)

---

## Step 2: Configure Service Account Credentials

### You Already Have This!
Your project already has `firebase-admin.json` file which contains the service account credentials. This same file will be used for GA4 Data API.

### Verify Permissions
Make sure your service account has the following permissions:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **IAM & Admin** > **IAM**
4. Find your service account (from firebase-admin.json)
5. Ensure it has **Viewer** role or **Analytics Viewer** role

### Enable GA4 Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **wave-755af**
3. Go to **APIs & Services** > **Library**
4. Search for **"Google Analytics Data API"**
5. Click on it and click **Enable**

---

## Step 3: Update Environment Variables

Open your `.env` file and add:

```env
# Firebase Analytics (GA4) Configuration
GA4_PROPERTY_ID=properties/YOUR_PROPERTY_ID
```

**Example:**
```env
GA4_PROPERTY_ID=properties/123456789
```

**Note:** The format must be `properties/XXXXXXXXX` where XXXXXXXXX is your numeric property ID.

---

## Step 4: Install Dependencies

The required package has already been installed:
```bash
npm install @google-analytics/data node-cache
```

---

## Step 5: Test the Integration

### Start Your Server
```bash
npm start
```

### Test API Endpoints

#### 1. Test Dashboard Summary
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/dashboard-summary?period=last30Days" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 2. Test Active Users
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/active-users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 3. Test Device Breakdown
```bash
curl -X GET "http://localhost:9000/api/admin/firebase-analytics/device-breakdown?period=last7Days" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Step 6: Available API Endpoints

All endpoints require admin authentication and are prefixed with `/api/admin/firebase-analytics`

### Query Parameters (Common)
- `startDate` - Start date (YYYY-MM-DD or GA4 format like "30daysAgo")
- `endDate` - End date (YYYY-MM-DD or "today")
- `period` - Predefined period: `today`, `yesterday`, `last7Days`, `last30Days`, `last90Days`

### Endpoints List

| Endpoint | Description | Query Params |
|----------|-------------|--------------|
| `GET /dashboard-summary` | Overall metrics summary | period, startDate, endDate |
| `GET /active-users` | Daily/Weekly/Monthly active users | - |
| `GET /device-breakdown` | Platform, OS, Browser data | period, startDate, endDate |
| `GET /audience` | Countries, Cities, Languages | period, startDate, endDate |
| `GET /traffic-trends` | Daily traffic trends | period, startDate, endDate |
| `GET /top-screens` | Most viewed screens/pages | period, startDate, endDate, limit |
| `GET /retention` | Day 1, 7, 30 retention | period, startDate, endDate |
| `GET /notifications` | Notification analytics | period, startDate, endDate |
| `GET /realtime` | Real-time active users | - |
| `GET /traffic-sources` | Traffic source breakdown | period, startDate, endDate |
| `GET /custom-events` | Custom event tracking | period, startDate, endDate, events |
| `POST /clear-cache` | Clear analytics cache | - |

---

## Step 7: Example API Responses

### Dashboard Summary
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

### Active Users
```json
{
  "success": true,
  "data": {
    "daily": {
      "activeUsers": 450,
      "newUsers": 85,
      "trend": [...]
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
    }
  }
}
```

### Device Breakdown
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
    "devices": [...],
    "operatingSystems": [...],
    "browsers": [...]
  }
}
```

---

## Step 8: Troubleshooting

### Error: "GA4_PROPERTY_ID not found"
**Solution:** Add `GA4_PROPERTY_ID` to your `.env` file with format `properties/XXXXXXXXX`

### Error: "Failed to initialize GA4 client"
**Solution:** 
1. Verify `firebase-admin.json` exists in the root directory
2. Check file permissions
3. Ensure the service account has proper permissions

### Error: "Google Analytics Data API has not been used"
**Solution:**
1. Go to Google Cloud Console
2. Enable "Google Analytics Data API"
3. Wait 5-10 minutes for propagation

### Error: "Permission denied"
**Solution:**
1. Go to Google Analytics Admin
2. Add your service account email as a Viewer
3. Service account email is in `firebase-admin.json` under `client_email`

### No Data Returned
**Possible Causes:**
1. Firebase Analytics not properly configured in mobile app/website
2. No events tracked yet
3. Date range has no data
4. Property ID is incorrect

**Solution:**
1. Verify Firebase Analytics is sending events from your app
2. Check Firebase Console > Analytics > Events to see if data is coming in
3. Try a wider date range (e.g., `last30Days`)

---

## Step 9: Caching

Analytics data is cached for **5 minutes** to improve performance and reduce API calls.

### Clear Cache
```bash
curl -X POST "http://localhost:9000/api/admin/firebase-analytics/clear-cache" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Disable Caching (for development)
Edit `wave_backend/controllers/firebaseAnalyticsController.js`:
```javascript
// Change cache TTL to 0
const cache = new NodeCache({ stdTTL: 0, checkperiod: 60 });
```

---

## Step 10: Security Best Practices

1. **Never commit** `firebase-admin.json` to version control
2. **Always use** admin authentication middleware
3. **Limit** API rate limiting if needed
4. **Monitor** API usage in Google Cloud Console
5. **Rotate** service account keys periodically

---

## Step 11: Frontend Integration

### Example: Fetch Dashboard Summary (React)
```javascript
import axios from 'axios';

const fetchDashboardSummary = async () => {
  try {
    const response = await axios.get(
      'http://localhost:9000/api/admin/firebase-analytics/dashboard-summary',
      {
        params: { period: 'last30Days' },
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
};
```

### Example: Display Active Users
```javascript
const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  const fetchAnalytics = async () => {
    const response = await axios.get(
      'http://localhost:9000/api/admin/firebase-analytics/active-users',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    setAnalytics(response.data.data);
  };
  
  fetchAnalytics();
}, []);

return (
  <div>
    <h3>Daily Active Users: {analytics?.daily.activeUsers}</h3>
    <h3>Weekly Active Users: {analytics?.weekly.activeUsers}</h3>
    <h3>Monthly Active Users: {analytics?.monthly.activeUsers}</h3>
  </div>
);
```

---

## Step 12: Production Deployment

### Environment Variables
Ensure these are set in production:
```env
GA4_PROPERTY_ID=properties/YOUR_PROPERTY_ID
```

### Service Account File
- Upload `firebase-admin.json` to your server
- Set proper file permissions (600)
- Never expose publicly

### API Rate Limits
Google Analytics Data API has quotas:
- **25,000 tokens per day** (free tier)
- **10 queries per second**

Monitor usage in [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Dashboard

---

## Support

For issues or questions:
1. Check Firebase Console for analytics data
2. Verify API is enabled in Google Cloud Console
3. Check server logs for detailed error messages
4. Review Google Analytics Data API documentation

---

## Additional Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GA4 Dimensions & Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
