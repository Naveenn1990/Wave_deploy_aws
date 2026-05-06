# Firebase Analytics Backend - Complete Folder Structure

## 📁 Project Structure

```
wave_backend/
│
├── config/                                 # Configuration files
│   ├── database.js                        # MongoDB connection
│   ├── firebase.js                        # Firebase Admin SDK config
│   ├── ga4.js                            # ✨ GA4 Analytics configuration
│   └── swagger.js                         # API documentation config
│
├── controllers/                           # Request handlers
│   ├── adminController.js                 # Admin operations
│   ├── adminAnalyticsController.js        # Existing analytics (MongoDB)
│   ├── firebaseAnalyticsController.js     # ✨ Firebase Analytics (GA4)
│   ├── authController.js                  # Authentication
│   ├── bookingController.js               # Booking operations
│   ├── userController.js                  # User operations
│   └── ...                                # Other controllers
│
├── routes/                                # API routes
│   ├── adminRoutes.js                     # Admin routes
│   ├── firebaseAnalyticsRoutes.js         # ✨ Firebase Analytics routes
│   ├── userRoutes.js                      # User routes
│   ├── partnerRoutes.js                   # Partner routes
│   └── ...                                # Other routes
│
├── services/                              # Business logic services
│   ├── ga4Service.js                      # ✨ GA4 Data API service
│   ├── emailService.js                    # Email service
│   ├── socketService.js                   # WebSocket service
│   └── invoiceService.js                  # Invoice generation
│
├── middleware/                            # Express middleware
│   ├── adminAuth.js                       # Admin authentication
│   ├── auth.js                            # General authentication
│   ├── validateAnalytics.js               # ✨ Analytics validation
│   ├── upload.js                          # File upload handling
│   └── ...                                # Other middleware
│
├── models/                                # MongoDB schemas
│   ├── User.js                            # User model
│   ├── Booking.js                         # Booking model
│   ├── Partner.js                         # Partner model
│   └── ...                                # Other models
│
├── utils/                                 # Utility functions
│   ├── analyticsHelper.js                 # ✨ Analytics utilities
│   ├── cloudinary.js                      # Image upload utilities
│   ├── payment.js                         # Payment utilities
│   └── sendOTP.js                         # OTP utilities
│
├── docs/                                  # ✨ Documentation
│   ├── FIREBASE_ANALYTICS_SETUP.md        # Setup guide
│   ├── API_DOCUMENTATION.md               # API reference
│   ├── ANALYTICS_README.md                # Module overview
│   ├── FOLDER_STRUCTURE.md                # This file
│   └── postman_collection.json            # Postman collection
│
├── uploads/                               # File uploads directory
│   ├── banners/
│   ├── profiles/
│   └── ...
│
├── node_modules/                          # Dependencies
│
├── .env                                   # Environment variables
├── .env.example                           # ✨ Environment template
├── .gitignore                             # Git ignore rules
├── firebase-admin.json                    # Firebase service account
├── package.json                           # NPM dependencies
├── package-lock.json                      # NPM lock file
└── server.js                              # Application entry point
```

## ✨ New Files Added

### Configuration
- **`config/ga4.js`** - GA4 Analytics Data API client initialization and configuration

### Services
- **`services/ga4Service.js`** - Reusable service methods for fetching GA4 analytics data

### Controllers
- **`controllers/firebaseAnalyticsController.js`** - API endpoint controllers for Firebase Analytics

### Routes
- **`routes/firebaseAnalyticsRoutes.js`** - Route definitions for analytics endpoints

### Middleware
- **`middleware/validateAnalytics.js`** - Request validation for analytics queries

### Utilities
- **`utils/analyticsHelper.js`** - Helper functions for analytics data processing

### Documentation
- **`docs/FIREBASE_ANALYTICS_SETUP.md`** - Complete setup guide
- **`docs/API_DOCUMENTATION.md`** - Detailed API reference
- **`docs/ANALYTICS_README.md`** - Module overview and usage
- **`docs/FOLDER_STRUCTURE.md`** - This file
- **`docs/postman_collection.json`** - Postman API collection

### Configuration Files
- **`.env.example`** - Environment variables template with GA4 configuration

## 📦 Dependencies Added

```json
{
  "@google-analytics/data": "^4.x.x",
  "node-cache": "^5.x.x"
}
```

## 🔧 Modified Files

### `server.js`
Added Firebase Analytics routes:
```javascript
const firebaseAnalyticsRoutes = require('./routes/firebaseAnalyticsRoutes');
app.use('/api/admin/firebase-analytics', firebaseAnalyticsRoutes);
```

### `.env`
Added GA4 configuration:
```env
GA4_PROPERTY_ID=properties/YOUR_PROPERTY_ID
```

## 📊 File Purposes

### Configuration Layer

#### `config/ga4.js`
- Initialize GA4 Analytics Data Client
- Manage service account credentials
- Provide date formatting utilities
- Handle property ID configuration

### Service Layer

#### `services/ga4Service.js`
- **Core Methods:**
  - `runReport()` - Execute custom GA4 reports
  - `formatResponse()` - Format API responses
  
- **User Metrics:**
  - `getActiveUsers()` - Fetch active user data
  - `getUserEngagement()` - Get engagement metrics
  - `getUserRetention()` - Calculate retention rates
  
- **Device Metrics:**
  - `getDeviceBreakdown()` - Platform distribution
  - `getOperatingSystemBreakdown()` - OS analytics
  - `getBrowserBreakdown()` - Browser data
  
- **Geographic Metrics:**
  - `getGeographicData()` - Country/city data
  - `getLanguageBreakdown()` - Language preferences
  
- **Content Metrics:**
  - `getTopScreens()` - Most viewed screens
  - `getTopPages()` - Most viewed pages
  
- **Traffic Metrics:**
  - `getTrafficTrends()` - Daily trends
  - `getTrafficSources()` - Source breakdown
  
- **Event Metrics:**
  - `getEventData()` - Event tracking
  - `getNotificationAnalytics()` - Notification data
  - `getCustomEvents()` - Custom event tracking
  
- **Real-time Metrics:**
  - `getRealtimeUsers()` - Live user count

### Controller Layer

#### `controllers/firebaseAnalyticsController.js`
- **Dashboard Endpoints:**
  - `getDashboardSummary()` - Overall metrics
  - `getActiveUsers()` - User activity
  
- **Device Endpoints:**
  - `getDeviceBreakdown()` - Device analytics
  
- **Audience Endpoints:**
  - `getAudienceAnalytics()` - Geographic data
  
- **Traffic Endpoints:**
  - `getTrafficTrends()` - Traffic patterns
  - `getTrafficSources()` - Source analysis
  
- **Content Endpoints:**
  - `getTopScreens()` - Screen/page views
  
- **Retention Endpoints:**
  - `getRetentionAnalytics()` - Retention rates
  
- **Notification Endpoints:**
  - `getNotificationAnalytics()` - Notification metrics
  
- **Real-time Endpoints:**
  - `getRealtimeUsers()` - Live users
  
- **Event Endpoints:**
  - `getCustomEvents()` - Custom tracking
  
- **Utility Endpoints:**
  - `clearCache()` - Cache management

### Route Layer

#### `routes/firebaseAnalyticsRoutes.js`
- Define all analytics API endpoints
- Apply admin authentication middleware
- Map routes to controller methods
- Document query parameters

### Middleware Layer

#### `middleware/validateAnalytics.js`
- Validate date range parameters
- Validate custom event queries
- Ensure proper query format
- Return validation errors

### Utility Layer

#### `utils/analyticsHelper.js`
- **Calculation Functions:**
  - `calculatePercentageChange()` - Growth calculation
  - `calculateGrowthRate()` - Rate calculation
  - `calculateConversionRate()` - Conversion metrics
  - `calculateAverage()` - Average calculation
  - `calculateMedian()` - Median calculation
  - `calculatePercentile()` - Percentile calculation
  
- **Formatting Functions:**
  - `formatNumber()` - Number formatting (K, M, B)
  - `formatDuration()` - Time formatting
  
- **Data Processing:**
  - `groupByDate()` - Date grouping
  - `aggregateByDimension()` - Data aggregation
  - `sortByMetric()` - Sorting
  - `filterByThreshold()` - Filtering
  - `normalizeToPercentage()` - Normalization
  - `fillMissingDates()` - Data completion
  
- **Analysis Functions:**
  - `calculateMovingAverage()` - Trend analysis
  - `getTopN()` - Top items extraction
  - `getDateRangeLabels()` - Date labels

## 🔐 Security Files

### `firebase-admin.json`
- Service account credentials
- **NEVER commit to version control**
- Required for GA4 API access
- Set file permissions to 600

### `.env`
- Environment variables
- Contains sensitive configuration
- **NEVER commit to version control**
- Use `.env.example` as template

## 📝 Documentation Files

### `FIREBASE_ANALYTICS_SETUP.md`
- Step-by-step setup instructions
- Configuration guide
- Troubleshooting tips
- Testing procedures

### `API_DOCUMENTATION.md`
- Complete API reference
- Request/response examples
- Query parameters
- Error responses

### `ANALYTICS_README.md`
- Module overview
- Feature list
- Quick start guide
- Usage examples

### `FOLDER_STRUCTURE.md`
- Project structure
- File purposes
- Dependencies
- Architecture overview

### `postman_collection.json`
- Ready-to-use Postman collection
- All API endpoints
- Example requests
- Environment variables

## 🚀 Usage Flow

```
Client Request
    ↓
Express Server (server.js)
    ↓
Route Handler (firebaseAnalyticsRoutes.js)
    ↓
Authentication Middleware (adminAuth.js)
    ↓
Validation Middleware (validateAnalytics.js)
    ↓
Controller (firebaseAnalyticsController.js)
    ↓
Cache Check (node-cache)
    ↓
Service Layer (ga4Service.js)
    ↓
GA4 Configuration (ga4.js)
    ↓
Google Analytics Data API
    ↓
Response Formatting
    ↓
Cache Storage
    ↓
JSON Response to Client
```

## 📊 Data Flow

```
Firebase Analytics (Mobile/Web)
    ↓
Google Analytics 4 (GA4)
    ↓
GA4 Data API
    ↓
Backend Service (ga4Service.js)
    ↓
Controller Processing
    ↓
Cache Layer (5 min TTL)
    ↓
Admin Dashboard (React)
```

## 🔄 Integration Points

### Existing System
- Uses existing `adminAuth` middleware
- Integrates with current admin routes
- Shares `firebase-admin.json` credentials
- Follows existing error handling patterns

### New Components
- Independent GA4 service layer
- Separate analytics routes
- Dedicated caching mechanism
- Modular utility functions

## 📈 Scalability

### Horizontal Scaling
- Stateless API design
- Cache can be replaced with Redis
- Service layer is reusable
- No database dependencies

### Performance
- 5-minute cache TTL
- Efficient data formatting
- Minimal API calls
- Optimized queries

## 🛠️ Maintenance

### Regular Tasks
- Monitor API quotas
- Clear cache when needed
- Update GA4 property ID if changed
- Rotate service account keys

### Updates
- Keep `@google-analytics/data` updated
- Review GA4 API changes
- Update documentation
- Test new features

---

**Note:** Files marked with ✨ are newly created for the Firebase Analytics module.
