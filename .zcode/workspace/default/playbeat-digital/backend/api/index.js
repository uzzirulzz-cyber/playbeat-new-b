/**
 * Vercel serverless entry point.
 * Vercel runs the Express app as a single function. We disable Vercel's
 * built-in body parsing so Express can parse JSON itself and the Stripe /
 * Lemon Squeezy webhooks receive the exact raw body needed for signature
 * verification. The MongoDB connection is cached across invocations.
 */
const connectDB = require('../src/config/db');
const app = require('../src/app');

const handler = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
  }
  return app(req, res);
};

module.exports = handler;
module.exports.config = {
  api: { bodyParser: false, externalResolver: true },
};
