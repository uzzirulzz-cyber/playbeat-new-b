import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { ProductCard } from '../../components/ProductCard';
import { Rating, Loader, EmptyState } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { useSettings } from '../../hooks/useSettings';
import { formatPrice, discountPercent, formatDate } from '../../lib/format';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { currencySymbol } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then(({ data }) => {
      setData(data.data);
      setSelectedVariant(data.data.product.variants?.[0] || null);
    }).finally(() => setLoading(false));
    api.get(`/products/${slug}/reviews`).then(({ data }) => setReviews(data.data)).catch(() => {});
  }, [slug]);

  if (loading) return <Loader full />;
  if (!data) return <EmptyState title="Product not found" action={<Link to="/products" className="btn-primary">Back to products</Link>} />;

  const { product, related } = data;
  const price = selectedVariant ? selectedVariant.salePrice ?? selectedVariant.price : product.salePrice ?? product.price;
  const original = selectedVariant ? selectedVariant.price : product.price;
  const discount = discountPercent(original, selectedVariant?.salePrice ?? product.salePrice);

  const handleAdd = async (buyNow = false) => {
    if (!user) { navigate('/login', { state: { from: `/products/${slug}` } }); return; }
    try {
      await add(product._id, 1, selectedVariant?._id || null);
      if (buyNow) navigate('/cart');
      else success('Added to cart');
    } catch (err) { error(err.message); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/products/${slug}/reviews`, newReview);
      setReviews((r) => [data.data, ...r.filter((x) => x._id !== data.data._id)]);
      setNewReview({ rating: 5, title: '', comment: '' });
      success('Review submitted');
    } catch (err) { error(err.message); }
  };

  return (
    <>
      <Seo
        title={product.seo.title || product.name}
        description={product.seo.description || product.shortDescription}
        image={product.images?.[0]}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: product.name,
          image: product.images,
          description: product.shortDescription,
          offers: { '@type': 'Offer', price: price, priceCurrency: product.currency, availability: 'https://schema.org/InStock' },
          aggregateRating: product.ratings?.count ? { '@type': 'AggregateRating', ratingValue: product.ratings.average, reviewCount: product.ratings.count } : undefined,
        }}
      />
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="hover:text-electric-light">Home</Link> / <Link to="/products" className="hover:text-electric-light">Products</Link>
        {product.category && <> / <Link to={`/categories/${product.category.slug}`} className="hover:text-electric-light">{product.category.name}</Link></>}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="glass overflow-hidden rounded-2xl">
            <img src={product.images?.[activeImage] || product.images?.[0]} alt={product.name} className="aspect-[4/3] w-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${activeImage === i ? 'border-electric' : 'border-transparent'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-electric-light">{product.category?.name}</span>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-100">{product.name}</h1>
          <div className="mt-2"><Rating value={product.ratings?.average || 0} count={product.ratings?.count} size="lg" /></div>

          {product.variants?.length > 0 && (
            <div className="mt-6">
              <div className="label">Select option</div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-xl border px-4 py-2 text-sm transition ${selectedVariant?._id === v._id ? 'border-electric bg-electric/10 text-electric-light' : 'border-white/10 text-slate-300 hover:border-white/30'}`}
                  >
                    {v.name} — {formatPrice(v.salePrice ?? v.price, product.currency, currencySymbol)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-100">{formatPrice(price, product.currency, currencySymbol)}</span>
            {discount > 0 && <span className="text-lg text-slate-500 line-through">{formatPrice(original, product.currency, currencySymbol)}</span>}
            {discount > 0 && <span className="badge bg-rose-500/20 text-rose-300">Save {discount}%</span>}
          </div>

          <p className="mt-4 text-slate-300">{product.shortDescription}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {product.deliveryType === 'instant' ? (
              <span className="badge bg-electric/15 text-electric-light">⚡ Instant Delivery</span>
            ) : (
              <span className="badge bg-amber-500/15 text-amber-300">🕐 Manual Delivery</span>
            )}
            <span className="badge bg-white/10 text-slate-300">📦 Digital Product</span>
            {product.tags?.map((t) => <span key={t} className="badge bg-white/5 text-slate-400">#{t}</span>)}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => handleAdd(false)} className="btn-ghost flex-1">Add to Cart</button>
            <button onClick={() => handleAdd(true)} className="btn-accent flex-1">Buy Now</button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-slate-100 mb-3">Description</h2>
          <div className="glass-card prose prose-invert max-w-none text-slate-300 whitespace-pre-line">{product.description || product.shortDescription}</div>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-100 mb-3">Reviews</h2>
          <form onSubmit={submitReview} className="glass-card mb-4 space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setNewReview((r) => ({ ...r, rating: n }))} className={`text-xl ${n <= newReview.rating ? 'text-accent-light' : 'text-navy-600'}`}>★</button>
              ))}
            </div>
            <input className="input" placeholder="Title" value={newReview.title} onChange={(e) => setNewReview((r) => ({ ...r, title: e.target.value }))} />
            <textarea className="input" rows="2" placeholder="Your review" value={newReview.comment} onChange={(e) => setNewReview((r) => ({ ...r, comment: e.target.value }))} />
            <button className="btn-primary w-full text-sm">Submit Review</button>
          </form>
          <div className="space-y-3">
            {reviews.length === 0 && <p className="text-slate-500 text-sm">No reviews yet. Be the first!</p>}
            {reviews.map((r) => (
              <div key={r._id} className="glass-card">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100">{r.user?.name || 'Anonymous'}</span>
                  {r.verifiedPurchase && <span className="badge bg-emerald-500/15 text-emerald-300">✓ Verified</span>}
                </div>
                <Rating value={r.rating} />
                {r.title && <p className="mt-1 font-medium text-slate-200">{r.title}</p>}
                {r.comment && <p className="text-sm text-slate-400">{r.comment}</p>}
                <p className="mt-1 text-xs text-slate-600">{formatDate(r.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related?.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-100 mb-5">Related Products</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p._id} product={p} currencySymbol={currencySymbol} />)}
          </div>
        </section>
      )}
    </>
  );
}
