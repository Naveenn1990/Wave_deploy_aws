/**
 * GA4 Connection Test Script
 * Run this to verify your GA4 configuration is working
 * 
 * Usage: node test-ga4-connection.js
 */

require('dotenv').config();
const { initializeGA4Client, getPropertyId } = require('./config/ga4');

async function testGA4Connection() {
  console.log('\n🔍 Testing GA4 Configuration...\n');
  
  try {
    // Step 1: Check environment variable
    console.log('Step 1: Checking GA4_PROPERTY_ID environment variable...');
    const propertyId = getPropertyId();
    console.log(`✅ Property ID found: ${propertyId}`);
    console.log(`   Format: properties/${propertyId}\n`);
    
    // Step 2: Initialize client
    console.log('Step 2: Initializing GA4 client...');
    const client = initializeGA4Client();
    console.log('✅ GA4 client initialized successfully\n');
    
    // Step 3: Test a simple realtime report
    console.log('Step 3: Testing realtime report (last 30 minutes)...');
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });
    
    const activeUsers = response.rows?.[0]?.metricValues?.[0]?.value || 0;
    console.log(`✅ Realtime report successful!`);
    console.log(`   Active users (last 30 min): ${activeUsers}\n`);
    
    // Step 4: Test a historical report
    console.log('Step 4: Testing historical report (last 7 days)...');
    const [historicalResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
      ],
    });
    
    const totalUsers = historicalResponse.rows?.[0]?.metricValues?.[0]?.value || 0;
    const totalSessions = historicalResponse.rows?.[0]?.metricValues?.[1]?.value || 0;
    console.log(`✅ Historical report successful!`);
    console.log(`   Active users (7 days): ${totalUsers}`);
    console.log(`   Sessions (7 days): ${totalSessions}\n`);
    
    // Success summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Your GA4 configuration is working correctly.');
    console.log('You can now use the Firebase Analytics dashboard.\n');
    console.log('Dashboard URL: http://localhost:3000/admin/firebase-analytics\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify GA4_PROPERTY_ID in .env file (should be: 484998177)');
    console.error('2. Check firebase-admin.json exists in wave_backend folder');
    console.error('3. Ensure Google Analytics Data API is enabled:');
    console.error('   https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=610594970194');
    console.error('4. Verify service account has "Viewer" role in Google Analytics');
    console.error('5. Wait 5 minutes after enabling API for changes to propagate\n');
    
    process.exit(1);
  }
}

// Run the test
testGA4Connection();
