const SiteSettings = require('../models/SiteSettings');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../middleware/audit');

/** Fields safe to expose publicly (no secrets, no internal config). */
const publicShape = (s) => ({
  siteName: s.siteName,
  tagline: s.tagline,
  logo: s.logo,
  contactEmail: s.contactEmail,
  supportEmail: s.supportEmail,
  currency: s.currency,
  currencySymbol: s.currencySymbol,
  payments: {
    stripeEnabled: s.payments.stripeEnabled,
    lemonSqueezyEnabled: s.payments.lemonSqueezyEnabled,
    manualEnabled: s.payments.manualEnabled,
    manualLabel: s.payments.manualLabel,
    manualInstructions: s.payments.manualInstructions,
  },
  seo: s.seo,
  social: s.social,
  announcements: s.announcements,
});

const UPDATABLE = [
  'siteName', 'tagline', 'logo', 'contactEmail', 'supportEmail',
  'currency', 'currencySymbol', 'taxPercent',
  'payments', 'email', 'seo', 'social', 'announcements',
];

const settingsController = {
  /** Public storefront settings. */
  publicGet: catchAsync(async (req, res) => {
    const settings = await SiteSettings.getSite();
    res.json({ success: true, data: publicShape(settings) });
  }),

  adminGet: catchAsync(async (req, res) => {
    const settings = await SiteSettings.getSite();
    res.json({ success: true, data: settings });
  }),

  adminUpdate: catchAsync(async (req, res) => {
    const settings = await SiteSettings.getSite();
    for (const key of UPDATABLE) {
      if (req.body[key] !== undefined) {
        if (typeof settings[key] === 'object' && settings[key] !== null && !Array.isArray(settings[key])) {
          settings[key] = { ...settings[key].toObject?.() || settings[key], ...req.body[key] };
          settings.markModified(key);
        } else {
          settings[key] = req.body[key];
        }
      }
    }
    await settings.save();
    await logAudit({ req, action: 'settings.update', resource: 'settings', meta: { keys: Object.keys(req.body) } });
    res.json({ success: true, data: settings });
  }),
};

module.exports = settingsController;
