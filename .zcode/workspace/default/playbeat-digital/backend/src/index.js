/**
 * Local / traditional server entry point.
 * On Vercel the app is served via api/index.js instead.
 */
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');
const { startReservationExpiryJob } = require('./jobs/expireReservations');

const start = async () => {
  await connectDB();
  startReservationExpiryJob();
  app.listen(env.port, () => {
    logger.info(`PlayBeat API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
};

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
