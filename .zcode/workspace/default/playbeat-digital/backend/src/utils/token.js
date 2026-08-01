const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signCustomerToken = (user) =>
  jwt.sign({ sub: user._id.toString(), type: 'customer' }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const verifyCustomerToken = (token) => {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.type !== 'customer') throw new Error('Invalid token type');
  return payload;
};

const signAdminToken = (admin) =>
  jwt.sign({ sub: admin._id.toString(), type: 'admin', role: admin.role }, env.adminJwtSecret, {
    expiresIn: env.adminJwtExpiresIn,
  });

const verifyAdminToken = (token) => {
  const payload = jwt.verify(token, env.adminJwtSecret);
  if (payload.type !== 'admin') throw new Error('Invalid token type');
  return payload;
};

module.exports = {
  signCustomerToken,
  verifyCustomerToken,
  signAdminToken,
  verifyAdminToken,
};
