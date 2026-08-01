/**
 * Secure admin seeder. Run with: npm run seed:admin
 * Production admin credentials MUST come from environment variables — they are
 * never hardcoded. Requires ADMIN_EMAIL and ADMIN_PASSWORD to be set.
 */
require('../config/env');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const env = require('../config/env');
const logger = require('../utils/logger');

const run = async () => {
  if (!env.adminSeed.email || !env.adminSeed.password) {
    console.error('\n[seed:admin] Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment before seeding.\n');
    process.exit(1);
  }
  if (env.isProd() && env.adminSeed.password.length < 12) {
    console.error('\n[seed:admin] Production admin password must be at least 12 characters.\n');
    process.exit(1);
  }

  await connectDB();

  const existing = await Admin.findOne({ email: env.adminSeed.email.toLowerCase() });
  if (existing) {
    existing.name = env.adminSeed.name;
    existing.role = 'superadmin';
    existing.active = true;
    await existing.setPassword(env.adminSeed.password);
    await existing.save();
    console.log(`\n[seed:admin] Super admin updated: ${existing.email}\n`);
  } else {
    const admin = new Admin({ name: env.adminSeed.name, email: env.adminSeed.email, role: 'superadmin' });
    await admin.setPassword(env.adminSeed.password);
    await admin.save();
    console.log(`\n[seed:admin] Super admin created: ${admin.email}\n`);
  }

  logger.info('Seed complete.');
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed:admin] Failed:', err.message);
  process.exit(1);
});
