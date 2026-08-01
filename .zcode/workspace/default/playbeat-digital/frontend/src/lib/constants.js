// Mirrored subset of shared/constants.js for the frontend bundle.
export const ORDER_STATUS = ['pending', 'payment_pending', 'paid', 'processing', 'delivered', 'completed', 'cancelled', 'refunded', 'failed'];
export const PAYMENT_STATUS = ['pending', 'created', 'succeeded', 'failed', 'refunded', 'expired'];
export const INVENTORY_STATUS = ['available', 'reserved', 'sold', 'expired', 'disabled'];
export const INVENTORY_TYPES = ['license_key', 'activation_code', 'account', 'credentials', 'download_link', 'digital_file', 'manual'];
export const TICKET_STATUS = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
export const TICKET_PRIORITY = ['low', 'medium', 'high', 'urgent'];
export const TICKET_CATEGORIES = ['order', 'payment', 'delivery', 'account', 'product', 'refund', 'other'];
export const ADMIN_ROLES = ['superadmin', 'admin', 'manager', 'support'];
export const PRODUCT_STATUS = ['draft', 'active', 'archived'];
export const DELIVERY_TYPES = ['instant', 'manual'];
export const COUPON_TYPES = ['percent', 'fixed'];
export const SECTION_TYPES = ['hero', 'trending', 'featured_categories', 'featured_products', 'banner', 'testimonials', 'faq', 'custom_html'];

export const STATUS_LABELS = {
  payment_pending: 'Payment Pending',
  in_progress: 'In Progress',
};
export const pretty = (value) => STATUS_LABELS[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : value);

export const STATUS_TONES = {
  completed: 'bg-emerald-500/15 text-emerald-300',
  succeeded: 'bg-emerald-500/15 text-emerald-300',
  paid: 'bg-emerald-500/15 text-emerald-300',
  delivered: 'bg-emerald-500/15 text-emerald-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  published: 'bg-emerald-500/15 text-emerald-300',
  available: 'bg-emerald-500/15 text-emerald-300',
  pending: 'bg-amber-500/15 text-amber-300',
  payment_pending: 'bg-amber-500/15 text-amber-300',
  processing: 'bg-sky-500/15 text-sky-300',
  created: 'bg-sky-500/15 text-sky-300',
  open: 'bg-sky-500/15 text-sky-300',
  in_progress: 'bg-sky-500/15 text-sky-300',
  reserved: 'bg-amber-500/15 text-amber-300',
  cancelled: 'bg-rose-500/15 text-rose-300',
  failed: 'bg-rose-500/15 text-rose-300',
  refunded: 'bg-fuchsia-500/15 text-fuchsia-300',
  expired: 'bg-rose-500/15 text-rose-300',
  disabled: 'bg-slate-500/15 text-slate-300',
  draft: 'bg-slate-500/15 text-slate-300',
  archived: 'bg-slate-500/15 text-slate-300',
  sold: 'bg-fuchsia-500/15 text-fuchsia-300',
  blocked: 'bg-rose-500/15 text-rose-300',
};
