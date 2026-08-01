import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { useSettings } from '../hooks/useSettings';
import { formatPrice } from '../lib/format';

const Hero = ({ section }) => {
  const { heading, subheading, backgroundImage, primaryCta, secondaryCta } = section.config || {};
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-950/80 to-transparent" />
      <div className="relative px-6 py-16 md:px-12 md:py-24 max-w-3xl">
        <h1 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight animate-fade-in">{heading}</h1>
        <p className="mt-4 text-lg text-slate-300 animate-fade-in">{subheading}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {primaryCta && <Link to={primaryCta.link} className="btn-primary">{primaryCta.label} →</Link>}
          {secondaryCta && <Link to={secondaryCta.link} className="btn-outline">{secondaryCta.label}</Link>}
        </div>
        <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
          <span className="flex items-center gap-2">🔒 Secure Payments</span>
          <span className="flex items-center gap-2">⚡ Instant Delivery</span>
          <span className="flex items-center gap-2">🛟 24/7 Support</span>
        </div>
      </div>
    </section>
  );
};

const ProductGrid = ({ products }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {products?.map((p) => <ProductCard key={p._id} product={p} />)}
  </div>
);

export const SectionRenderer = ({ section }) => {
  const { currencySymbol } = useSettings();
  const { config = {} } = section;

  switch (section.type) {
    case 'hero':
      return <Hero section={section} />;

    case 'trending':
    case 'featured_products':
      return (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-100">{section.title}</h2>
              {section.subtitle && <p className="text-slate-400 text-sm mt-1">{section.subtitle}</p>}
            </div>
            <Link to="/products" className="text-sm text-electric-light hover:underline">View all →</Link>
          </div>
          <ProductGrid products={config.products} />
        </section>
      );

    case 'featured_categories':
      return (
        <section>
          <h2 className="mb-5 font-display text-2xl font-bold text-slate-100">{section.title}</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {config.categories?.map((c) => (
              <Link key={c._id} to={`/categories/${c.slug}`} className="glass-card group text-center !p-4">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-electric/30 to-accent/20 text-2xl group-hover:scale-110 transition">
                  {c.icon ? <span>{iconGlyph(c.icon)}</span> : '🗂️'}
                </div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-electric-light line-clamp-2">{c.name}</div>
                {c.productCount !== undefined && <div className="text-xs text-slate-500">{c.productCount} items</div>}
              </Link>
            ))}
          </div>
        </section>
      );

    case 'banner':
      return (
        <section className="relative overflow-hidden rounded-3xl border border-white/10">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${config.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 to-transparent" />
          <div className="relative px-6 py-10 md:px-12 md:py-14 max-w-xl">
            {config.heading && <h3 className="font-display text-2xl md:text-3xl font-bold text-white">{config.heading}</h3>}
            {config.body && <p className="mt-2 text-slate-300">{config.body}</p>}
            {config.link && (
              <Link to={config.link} className="mt-5 btn-accent">{config.buttonText || 'Learn more'} →</Link>
            )}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section>
          <h2 className="mb-5 font-display text-2xl font-bold text-slate-100">{section.title}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {config.items?.map((t, i) => (
              <div key={i} className="glass-card">
                <div className="text-accent-light">{'★'.repeat(t.rating || 5)}</div>
                <p className="mt-3 text-slate-300">"{t.quote}"</p>
                <div className="mt-4 text-sm">
                  <div className="font-semibold text-slate-100">{t.name}</div>
                  <div className="text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="max-w-3xl">
          <h2 className="mb-5 font-display text-2xl font-bold text-slate-100">{section.title}</h2>
          <div className="space-y-3">
            {config.items?.map((item, i) => (
              <details key={i} className="glass group">
                <summary className="cursor-pointer list-none px-5 py-4 font-medium text-slate-100 flex items-center justify-between">
                  {item.question}
                  <span className="text-electric-light transition group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-4 text-slate-400 text-sm">{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
      );

    case 'custom_html':
      return <section dangerouslySetInnerHTML={{ __html: config.html || '' }} />;

    default:
      return null;
  }
};

const iconGlyph = (name) => {
  const map = { gamepad: '🎮', coins: '🪙', shield: '🛡️', gift: '🎁', terminal: '💻', users: '👥', server: '🖥️', megaphone: '📣', cube: '🧊', briefcase: '💼' };
  return map[name] || '🗂️';
};
