import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatPrice, formatDateTime } from '../../lib/format';
import { useSettings } from '../../hooks/useSettings';
import { pretty } from '../../lib/constants';

export default function AccountOrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { success, error } = useToast();
  const { currencySymbol } = useSettings();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/mine/${id}`).then(({ data }) => setOrder(data.data)).catch(() => setOrder(null));
  }, [id]);

  const copyAsset = (text) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard');
  };

  const payNow = async () => {
    try {
      const { data } = await api.post(`/payments/stripe/session/${id}`);
      if (data.data.sessionUrl) window.location.href = data.data.sessionUrl;
    } catch (err) { error(err.message); }
  };

  if (!order) return <Loader />;
  if (order === null) return <div className="glass-card text-center py-12">Order not found.</div>;

  const unpaid = order.paymentStatus !== 'succeeded' && order.paymentStatus !== 'refunded';

  return (
    <>
      <Seo title={`Order ${order.orderNumber}`} />
      <Link to="/account/orders" className="text-sm text-slate-400 hover:text-electric-light mb-4 inline-block">← All orders</Link>
      <div className="glass-card">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-100">{order.orderNumber}</h1>
            <p className="text-slate-400 text-sm">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={order.status} />
          </div>
        </div>

        {unpaid && order.paymentMethod === 'stripe' && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3">
            <span className="text-amber-200 text-sm">Payment pending. Complete it to receive your products.</span>
            <button onClick={payNow} className="btn-primary text-sm">Pay Now</button>
          </div>
        )}
        {unpaid && order.paymentMethod === 'manual' && (
          <div className="mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
            🏦 Manual payment received? Your order will be delivered once an admin verifies it.
          </div>
        )}

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center">
              <img src={item.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="font-medium text-slate-100">{item.name} {item.variantName && <span className="text-slate-400 text-sm">— {item.variantName}</span>}</div>
                <div className="text-sm text-slate-400">{item.qty} × {formatPrice(item.unitPrice, order.currency, currencySymbol)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatPrice(item.total, order.currency, currencySymbol)}</div>
                <StatusBadge status={item.deliveryStatus} label={pretty(item.deliveryStatus)} />
              </div>

              {item.deliveredAssets?.length > 0 && (
                <div className="sm:w-full mt-2 space-y-2">
                  {item.deliveredAssets.map((asset, ai) => (
                    <div key={ai} className="flex items-center gap-2 rounded-lg bg-navy-950/60 border border-white/10 p-2">
                      <span className="text-xs uppercase text-slate-500 w-28 shrink-0">{asset.label || asset.type}</span>
                      <code className="flex-1 text-accent-light text-sm break-all">{asset.payload}</code>
                      <button onClick={() => copyAsset(asset.payload)} className="btn-ghost !px-2 !py-1 text-xs">Copy</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 space-y-2 text-sm sm:w-64 sm:ml-auto">
          <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatPrice(order.subtotal, order.currency, currencySymbol)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-emerald-300"><span>Discount</span><span>−{formatPrice(order.discount, order.currency, currencySymbol)}</span></div>}
          {order.tax > 0 && <div className="flex justify-between text-slate-300"><span>Tax</span><span>{formatPrice(order.tax, order.currency, currencySymbol)}</span></div>}
          <div className="flex justify-between text-lg font-bold text-slate-100 border-t border-white/10 pt-2"><span>Total</span><span>{formatPrice(order.total, order.currency, currencySymbol)}</span></div>
        </div>
      </div>
    </>
  );
}
