// config/db.js — MongoDB connection (local server + Vercel serverless)
const mongoose = require("mongoose");
const logger = require("../utils/logger");

function getMongoUri() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL;
  if (!uri) {
    throw new Error(
      "MongoDB URI not configured. Set MONGO_URI (or MONGODB_URI) in environment variables."
    );
  }
  return uri;
}

// Reuse connection across Vercel serverless invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
};

function attachConnectionListeners() {
  if (mongoose.connection.listenerCount("error") > 0) return;

  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = getMongoUri();
    logger.info("Attempting to connect to MongoDB...");

    cached.promise = mongoose
      .connect(uri, connectionOptions)
      .then((mongooseInstance) => {
        attachConnectionListeners();
        cached.conn = mongooseInstance.connection;
        logger.info(`MongoDB Connected: ${cached.conn.host}`);
        return cached.conn;
      })
      .catch((error) => {
        cached.promise = null;
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        throw error;
      });
  }

  return cached.promise;
};

const isDbReady = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.getMongoUri = getMongoUri;
module.exports.isDbReady = isDbReady;
