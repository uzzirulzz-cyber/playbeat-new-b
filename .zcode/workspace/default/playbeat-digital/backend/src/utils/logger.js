/**
 * Minimal structured logger. Swap for pino/winston if log shipping is needed.
 */
const ts = () => new Date().toISOString();

const logger = {
  info: (msg, meta) => console.log(`[${ts()}] INFO  ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[${ts()}] WARN  ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[${ts()}] ERROR ${msg}`, meta || ''),
};

module.exports = logger;
