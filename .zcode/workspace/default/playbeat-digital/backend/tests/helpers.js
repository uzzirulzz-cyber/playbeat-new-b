/**
 * Test bootstrap: spins up an in-memory MongoDB, exposes a supertest agent
 * against the Express app, and cleans collections between tests.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongoServer;
let app;

const setup = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = require('../src/app');
  return { app, request: () => request(app) };
};

const teardown = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
};

const clearDb = async () => {
  const collections = mongoose.connection.collections;
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(collections)) {
    // eslint-disable-next-line no-await-in-loop
    await collections[key].deleteMany({});
  }
};

const seedAdmin = async (User = require('../src/models/User')) => {
  const user = new User({ name: 'Test User', email: 'test@playbeat.digital' });
  await user.setPassword('password123');
  await user.save();
  return user;
};

module.exports = { setup, teardown, clearDb, seedAdmin };
