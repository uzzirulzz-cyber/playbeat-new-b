import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { ProductCard } from '../../components/ProductCard';
import { Loader, EmptyState } from '../../components/ui';
import { useSettings } from '../../hooks/useSettings';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const { currencySymbol } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const featured = params.get('featured') || '';
  const page = parseInt(params.get('page') || '1', 10);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    if (featured) query.set('featured', featured);
    query.set('sort', sort);
    query.set('page', page);
    query.set('limit', 12);
    api
      .get(`/products?${query.toString()}`)
      .then(({ data }) => setData(data))
      .catch(() => setData({ data: [], pagination: { pages: 1 } }))
      .finally(() => setLoading(false));
  }, [q, category, featured, sort, page]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <>
      <Seo title="All Products" description="Browse the full PlayBeat Digital marketplace." />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-100">All Products</h1>
          <p className="text-slate-400 text-sm mt-1">{q ? `Results for "${q}"` : 'Premium digital products, delivered instantly.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => update('q', e.target.value)} placeholder="Search…" className="input !py-2 text-sm w-48" />
          <select value={sort} onChange={(e) => update('sort', e.target.value)} className="input !py-2 text-sm w-auto">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Loader /> : !data?.data?.length ? (
        <EmptyState title="No products found" description="Try a different search or category." />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.data.map((p) => <ProductCard key={p._id} product={p} currencySymbol={currencySymbol} />)}
          </div>
          {data.pagination?.pages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: data.pagination.pages }).map((_, i) => (
                <button key={i} onClick={() => update('page', i + 1)} className={`btn ${page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}>{i + 1}</button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
