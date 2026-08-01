import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, EmptyState } from '../../components/ui';

const ICONS = { gamepad: '🎮', coins: '🪙', shield: '🛡️', gift: '🎁', terminal: '💻', users: '👥', server: '🖥️', megaphone: '📣', cube: '🧊', briefcase: '💼' };

export default function Categories() {
  const [categories, setCategories] = useState(null);
  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data)).catch(() => setCategories([]));
  }, []);

  if (!categories) return <Loader full />;
  if (!categories.length) return <EmptyState title="No categories yet" description="Check back soon." />;

  return (
    <>
      <Seo title="Categories" description="Browse all PlayBeat Digital categories." />
      <h1 className="font-display text-3xl font-bold text-slate-100 mb-6">Categories</h1>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c._id} to={`/categories/${c.slug}`} className="glass-card group flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-electric/30 to-accent/20 text-3xl group-hover:scale-110 transition">
              {ICONS[c.icon] || '🗂️'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 group-hover:text-electric-light">{c.name}</h3>
              <p className="text-sm text-slate-400">{c.productCount} products</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
