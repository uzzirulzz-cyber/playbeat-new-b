import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { ProductCard } from '../../components/ProductCard';
import { Loader, EmptyState } from '../../components/ui';
import { useSettings } from '../../hooks/useSettings';

export default function Category() {
  const { slug } = useParams();
  const { currencySymbol } = useSettings();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/products?category=${slug}&limit=24`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  }, [slug]);

  if (!data) return <Loader full />;

  return (
    <>
      <Seo title={slug.replace(/-/g, ' ')} />
      <h1 className="font-display text-3xl font-bold text-slate-100 mb-6 capitalize">{slug.replace(/-/g, ' ')}</h1>
      {!data.data?.length ? (
        <EmptyState title="No products in this category yet" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.data.map((p) => <ProductCard key={p._id} product={p} currencySymbol={currencySymbol} />)}
        </div>
      )}
    </>
  );
}
