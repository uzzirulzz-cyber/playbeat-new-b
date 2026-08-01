import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Seo } from '../components/Seo';
import { SectionRenderer } from '../components/SectionRenderer';
import { Loader } from '../components/ui';

export default function Home() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/homepage')
      .then(({ data }) => setSections(data.data))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="glass-card text-center py-16">
        <h1 className="text-2xl font-bold text-slate-100">Couldn't load the homepage</h1>
        <p className="mt-2 text-slate-400">Is the API running? Run <code className="text-electric-light">npm run dev:api</code> and <code className="text-electric-light">npm run seed:demo</code>.</p>
        <Link to="/products" className="mt-6 btn-primary inline-flex">Browse products instead →</Link>
      </div>
    );
  }

  if (!sections) return <Loader full />;

  return (
    <>
      <Seo title="PlayBeat Digital — Your Digital World. One Powerful Marketplace." />
      <div className="flex flex-col gap-16">
        {sections.map((section) => (
          <SectionRenderer key={section._id} section={section} />
        ))}
      </div>
    </>
  );
}
