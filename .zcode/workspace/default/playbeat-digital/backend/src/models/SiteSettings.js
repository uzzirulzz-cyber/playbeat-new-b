const mongoose = require('mongoose');

/**
 * Singleton site settings document (key: 'site'). Secret values (SMTP
 * passwords, API keys) belong in environment variables — this document only
 * holds non-secret configuration editable from the admin panel.
 */
const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'PlayBeat Digital' },
    tagline: { type: String, default: 'Your Digital World. One Powerful Marketplace.' },
    logo: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    currencySymbol: { type: String, default: '$' },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    payments: {
      stripeEnabled: { type: Boolean, default: false },
      stripePublishableKey: { type: String, default: '' },
      lemonSqueezyEnabled: { type: Boolean, default: false },
      manualEnabled: { type: Boolean, default: true },
      manualLabel: { type: String, default: 'Bank Transfer / Manual Payment' },
      manualInstructions: { type: String, default: '' },
    },
    email: {
      fromName: { type: String, default: 'PlayBeat Digital' },
      fromEmail: { type: String, default: '' },
      orderNotificationsTo: { type: String, default: '' },
    },
    seo: {
      defaultTitle: { type: String, default: 'PlayBeat Digital — Your Digital World. One Powerful Marketplace.' },
      defaultDescription: {
        type: String,
        default:
          'Discover premium digital products, subscriptions, software, gaming products, hosting, marketing services and more.',
      },
      ogImage: { type: String, default: '' },
      twitterHandle: { type: String, default: '' },
    },
    social: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      discord: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },
    announcements: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSite = async function getSite() {
  let settings = await this.findOne({ key: 'site' });
  if (!settings) settings = await this.create({ key: 'site' });
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
