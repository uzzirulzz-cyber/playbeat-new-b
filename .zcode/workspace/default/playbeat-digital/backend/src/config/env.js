require('dotenv').config();

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 5000),

  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/playbeat',

  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-only-insecure-secret',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h',

  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  inventoryEncryptionKey: process.env.INVENTORY_ENCRYPTION_KEY || 'dev-only-inventory-key',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  lemonSqueezy: {
    apiKey: process.env.LEMON_SQUEEZY_API_KEY || '',
    storeId: process.env.LEMON_SQUEEZY_STORE_ID || '',
    webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '',
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'PlayBeat Digital <no-reply@playbeat.digital>',
  },

  adminSeed: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'PlayBeat Admin',
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
  },

  isProd() {
    return this.nodeEnv === 'production';
  },
};

if (env.isProd()) {
  const weak = [];
  if (!process.env.JWT_SECRET) weak.push('JWT_SECRET');
  if (!process.env.MONGODB_URI) weak.push('MONGODB_URI');
  if (!process.env.INVENTORY_ENCRYPTION_KEY) weak.push('INVENTORY_ENCRYPTION_KEY');
  if (weak.length) {
    // Fail fast rather than running production with insecure defaults.
    throw new Error(`Missing required production environment variables: ${weak.join(', ')}`);
  }
}

module.exports = env;
