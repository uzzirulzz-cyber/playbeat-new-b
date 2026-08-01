/**
 * Express application factory. Kept separate from the HTTP listener so the
 * same app can power both the local server and the Vercel serverless handler.
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const routes = require('./routes');
const paymentController = require('./controllers/payment.controller');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / server-to-server calls (no Origin header).
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(compression());
if (!env.isProd()) app.use(morgan('dev'));

// ── Payment webhooks need the exact raw body for signature verification.
//    They MUST be mounted before express.json(). ──────────────────────────
app.post(
  '/api/payments/webhook/stripe',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);
app.post(
  '/api/payments/webhook/lemonsqueezy',
  express.raw({ type: 'application/json' }),
  paymentController.lemonSqueezyWebhook
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use('/api', apiLimiter, routes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'PlayBeat Digital API', docs: '/api/health' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
