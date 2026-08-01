import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { ProductCard } from '../../components/ProductCard';
import { Loader, EmptyState } from '../../components/ui';
import { useSettings } from '../../hooks/useSettings';

export default function AccountWishlist() {
  const { currencySymbol } = useSettings();
  const [items, setItems] = useState(null);
  useEffect(() => { api.get('/auth/wishlist').then(({ data }) => setItems(data.data)).catch(() => setItems([])); }, []);

  if (!items) return <Loader />;
  if (!items.length) return (
    <>
      <Seo title="Wishlist" />
      <EmptyState icon="❤️" title="Your wishlist is empty" description="Save products you love for later." action={<Link to="/products" className="btn-primary">Browse Products</Link>} />
    </>
  );

  return (
    <>
      <Seo title="Wishlist" />
      <h2 className="font-display text-xl font-bold text-slate-100 mb-4">My Wishlist</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => <ProductCard key={p._id} product={p} currencySymbol={currencySymbol} />)}
      </div>
    </>
  );
}
