// config/db.js
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async (retryCount = 0) => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Increased timeouts for better reliability
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Give more time for initial connection
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true, // Enable retry writes
      retryReads: true, // Enable retry reads
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      // Remove the problematic buffer options that are causing the error
      // bufferMaxEntries: 0, // This option is not supported
      // bufferCommands: false, // This option is not supported
    };

    logger.info(`Attempting to connect to MongoDB... (Attempt ${retryCount + 1})`);
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);

    // Retry logic for connection failures
    if (retryCount < 3) {
      logger.info(`Retrying MongoDB connection in 5 seconds... (${retryCount + 1}/3)`);
      setTimeout(() => {
        connectDB(retryCount + 1);
      }, 5000);
      return;
    }

    // Don't exit process in serverless environment
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      logger.error("MongoDB connection failed in production environment after 3 attempts");
      // For production, allow server to start without DB (graceful degradation)
      logger.warn("Starting server in degraded mode - some features may not work");
      return null;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
