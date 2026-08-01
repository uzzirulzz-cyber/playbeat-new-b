const crypto = require('crypto');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const API_BASE = 'https://api.lemonsqueezy.com/v1';

/**
 * Lemon Squeezy integration. Each product variant maps to a Lemon Squeezy
 * variant ID (stored on the product variant as lemonSqueezyVariantId).
 */
const lemonSqueezyService = {
  isConfigured: () => Boolean(env.lemonSqueezy.apiKey && env.lemonSqueezy.storeId),

  async createCheckout({ order, customerEmail, lemonVariantId }) {
    if (!this.isConfigured()) throw ApiError.badRequest('Lemon Squeezy is not configured');
    if (!lemonVariantId) throw ApiError.badRequest('Product is not mapped to a Lemon Squeezy variant');

    const response = await fetch(`${API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${env.lemonSqueezy.apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: customerEmail,
              custom: { order_id: order._id.toString() },
            },
            product_options: {
              redirect_url: `${env.clientUrl}/order/success?order=${order._id}`,
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: String(env.lemonSqueezy.storeId) } },
            variant: { data: { type: 'variants', id: String(lemonVariantId) } },
          },
        },
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      throw ApiError.badRequest(json.errors?.[0]?.detail || 'Lemon Squeezy checkout failed');
    }
    return { id: json.data.id, url: json.data.attributes.url };
  },

  /** Verify the X-Signature HMAC against the raw request body. */
  verifySignature(rawBody, signature) {
    if (!env.lemonSqueezy.webhookSecret) throw ApiError.badRequest('Lemon Squeezy webhook secret not configured');
    const digest = crypto
      .createHmac('sha256', env.lemonSqueezy.webhookSecret)
      .update(rawBody)
      .digest('hex');
    const a = Buffer.from(digest, 'utf8');
    const b = Buffer.from(String(signature || ''), 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },
};

module.exports = lemonSqueezyService;
