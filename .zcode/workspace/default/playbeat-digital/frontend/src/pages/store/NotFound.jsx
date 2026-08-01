import { Link } from 'react-router-dom';
import { Seo } from '../../components/Seo';

export default function NotFound({ code = 404, message = "The page you're looking for doesn't exist." }) {
  return (
    <>
      <Seo title={`${code} — Not Found`} />
      <div className="glass-card mx-auto max-w-lg text-center py-16">
        <div className="font-display text-6xl font-bold bg-gradient-to-r from-electric to-accent bg-clip-text text-transparent">{code}</div>
        <p className="mt-4 text-slate-400">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn-primary">Back to Home</Link>
          <Link to="/products" className="btn-ghost">Browse Products</Link>
        </div>
      </div>
    </>
  );
}
