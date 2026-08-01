/**
 * Serverless-friendly MongoDB connection.
 * The connection promise is cached on the Node.js global object so warm
 * Vercel function invocations reuse it instead of opening a new connection
 * per request. Retry logic handles transient Atlas failures.
 */
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

const globalCache = global.__playbeatMongoose || (global.__playbeatMongoose = { conn: null, promise: null });

const connectWithRetry = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    return conn;
  } catch (err) {
    if (attempt >= 5) throw err;
    const delay = Math.min(attempt * 1000, 5000);
    logger.warn(`MongoDB connect attempt ${attempt} failed (${err.message}); retrying in ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(attempt + 1);
  }
};

const connectDB = async () => {
  if (globalCache.conn && mongoose.connection.readyState === 1) return globalCache.conn;
  if (!globalCache.promise) {
    globalCache.promise = connectWithRetry().then((conn) => {
      globalCache.conn = conn;
      logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    }).catch((err) => {
      globalCache.promise = null;
      throw err;
    });
  }
  return globalCache.promise;
};

module.exports = connectDB;
