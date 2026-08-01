/**
 * AES-256-GCM encryption for digital inventory payloads (license keys,
 * account credentials, download links...). Payloads are stored encrypted at
 * rest and only decrypted for the owning customer or an authorized admin.
 */
const crypto = require('crypto');
const env = require('../config/env');

const key = crypto.createHash('sha256').update(String(env.inventoryEncryptionKey)).digest();

const encrypt = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
};

const decrypt = (payload) => {
  const [ivB64, tagB64, dataB64] = String(payload).split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted payload');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
};

const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

module.exports = { encrypt, decrypt, randomToken };
