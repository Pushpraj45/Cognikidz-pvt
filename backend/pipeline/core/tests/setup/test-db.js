/**
 * Test Database Setup
 * Handles MongoDB connections for test environment
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

let isConnected = false;

/**
 * Connect to test database
 */
async function connectTestDB() {
  if (isConnected) {
    return;
  }

  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000, // Reduced for tests
      socketTimeoutMS: 10000, // Reduced for tests
      connectTimeoutMS: 5000, // Reduced for tests
      family: 4,
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: 10000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    isConnected = true;
    console.log('✅ Test database connected');
  } catch (error) {
    console.warn('⚠️ Test database connection failed:', error.message);
    console.warn('Tests will run in mock mode without database persistence');
    // Don't throw error - allow tests to run without DB
  }
}

/**
 * Disconnect from test database
 */
async function disconnectTestDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.warn('⚠️ Error disconnecting test database:', error.message);
  }
}

/**
 * Check if database is connected
 */
function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Clean up test data after tests complete
 */
async function cleanupTestData() {
  if (!isDBConnected()) {
    return;
  }

  try {
    // Clean up test-specific data from all relevant collections
    const collections = [
      'assessments', 
      'sessions', 
      'intakes', 
      'childprofiles',
      'users'
    ];
    
    for (const collection of collections) {
      try {
        const collectionExists = await mongoose.connection.db.listCollections({name: collection}).hasNext();
        if (collectionExists) {
          // Clean up test sessions and related data
          const result = await mongoose.connection.db.collection(collection).deleteMany({
            $or: [
              { sessionId: { $regex: /^session_.*test/ } },
              { sessionId: { $regex: /^test_session/ } },
              { userId: { $regex: /^test_user/ } },
              { userId: 'test_user_123' },
              { userId: 'test_user_456' },
              { userId: 'test_user_789' },
              { childName: { $regex: /^Test Child/ } },
              { childName: 'Emma Rodriguez' },
              { childName: 'Alex Johnson' },
              { childName: 'Sophie Williams' }
            ]
          });
          if (result.deletedCount > 0) {
            console.log(`✅ Cleaned up ${result.deletedCount} test records from ${collection}`);
          }
        }
      } catch (collectionError) {
        console.warn(`⚠️ Error cleaning collection ${collection}:`, collectionError.message);
      }
    }
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error.message);
  }
}

/**
 * Clean up specific session data
 */
async function cleanupSessionData(sessionIds) {
  if (!isDBConnected() || !sessionIds || sessionIds.length === 0) {
    return;
  }

  try {
    const collections = ['assessments', 'sessions'];
    
    for (const collection of collections) {
      try {
        const collectionExists = await mongoose.connection.db.listCollections({name: collection}).hasNext();
        if (collectionExists) {
          const result = await mongoose.connection.db.collection(collection).deleteMany({
            sessionId: { $in: sessionIds }
          });
          if (result.deletedCount > 0) {
            console.log(`✅ Cleaned up ${result.deletedCount} session records from ${collection}`);
          }
        }
      } catch (collectionError) {
        console.warn(`⚠️ Error cleaning session data from ${collection}:`, collectionError.message);
      }
    }
  } catch (error) {
    console.warn('⚠️ Session cleanup failed:', error.message);
  }
}

module.exports = {
  connectTestDB,
  disconnectTestDB,
  isDBConnected,
  cleanupTestData,
  cleanupSessionData
}; 