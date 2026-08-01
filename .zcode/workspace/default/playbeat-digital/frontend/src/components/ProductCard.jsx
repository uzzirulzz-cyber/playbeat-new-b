import { Link } from 'react-router-dom';
import { Rating } from './ui';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { formatPrice, discountPercent } from '../lib/format';

export const ProductCard = ({ product, currencySymbol = '$' }) => {
  const { add } = useCart();
  const { success, error } = useToast();
  const price = product.salePrice ?? product.price;
  const hasVariantPricing = !product.salePrice && product.variants?.length && Math.min(...product.variants.map((v) => v.salePrice ?? v.price)) < product.price;
  const displayPrice = product.variants?.length ? Math.min(...product.variants.map((v) => v.salePrice ?? v.price)) : price;
  const discount = product.variants?.length
    ? discountPercent(product.price, displayPrice)
    : discountPercent(product.price, product.salePrice);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const variantId = product.variants?.[0]?._id || null;
      await add(product._id, 1, variantId);
      success(`${product.name} added to cart`);
    } catch (err) {
      error(err.message || 'Could not add to cart');
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className="glass-card group flex flex-col overflow-hidden !p-0">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.images?.[0] || `https://picsum.photos/seed/${product.slug}/600/450`}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {product.trending && <span className="badge bg-accent/20 text-accent-light">🔥 Trending</span>}
          {discount > 0 && <span className="badge bg-rose-500/20 text-rose-300">-{discount}%</span>}
        </div>
        {product.deliveryType === 'instant' && (
          <span className="absolute bottom-3 right-3 badge bg-navy-900/80 text-electric-light border border-electric/30">⚡ Instant</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs text-electric-light/80 uppercase tracking-wide">{product.category?.name || 'Digital'}</span>
        <h3 className="mt-1 font-semibold text-slate-100 line-clamp-1 group-hover:text-electric-light transition">{product.name}</h3>
        <p className="mt-1 text-sm text-slate-400 line-clamp-2 flex-1">{product.shortDescription}</p>
        <div className="mt-3"><Rating value={product.ratings?.average || 0} count={product.ratings?.count} /></div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            {hasVariantPricing || product.variants?.length ? (
              <>
                <span className="text-xs text-slate-500">from </span>
                <span className="text-lg font-bold text-slate-100">{formatPrice(displayPrice, product.currency, currencySymbol)}</span>
              </>
            ) : (
              <>
                {product.salePrice && (
                  <span className="mr-2 text-sm text-slate-500 line-through">{formatPrice(product.price, product.currency, currencySymbol)}</span>
                )}
                <span className="text-lg font-bold text-slate-100">{formatPrice(price, product.currency, currencySymbol)}</span>
              </>
            )}
          </div>
          <button onClick={handleAdd} className="btn-primary !px-3 !py-2 text-xs">Add</button>
        </div>
      </div>
    </Link>
  );
};
