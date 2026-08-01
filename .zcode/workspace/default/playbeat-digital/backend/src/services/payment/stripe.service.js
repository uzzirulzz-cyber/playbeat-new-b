const Stripe = require('stripe');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

let stripe = null;
const getStripe = () => {
  if (!env.stripe.secretKey) throw ApiError.badRequest('Stripe is not configured');
  if (!stripe) stripe = new Stripe(env.stripe.secretKey);
  return stripe;
};

const stripeService = {
  /** Create a Checkout Session for an order. Returns the hosted checkout URL. */
  async createCheckoutSession({ order, customerEmail }) {
    const client = getStripe();
    const session = await client.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: order._id.toString(),
      metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
      // Single consolidated line item so the Stripe charge always equals the
      // server-computed order total (discounts and tax already applied).
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: Math.round(order.total * 100),
            product_data: {
              name: `PlayBeat Digital — Order ${order.orderNumber}`,
              description: order.items
                .map((i) => `${i.qty}× ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`)
                .join(', ')
                .slice(0, 500),
            },
          },
        },
      ],
      success_url: `${env.clientUrl}/order/success?order=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.clientUrl}/order/failed?order=${order._id}&reason=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    return session;
  },

  /** Verify and parse a webhook event from the raw request body. */
  constructEvent(rawBody, signature) {
    const client = getStripe();
    if (!env.stripe.webhookSecret) throw ApiError.badRequest('Stripe webhook secret is not configured');
    return client.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  },

  async createRefund(paymentIntentId, amount) {
    const client = getStripe();
    return client.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  },

  isConfigured: () => Boolean(env.stripe.secretKey),
};

module.exports = stripeService;
