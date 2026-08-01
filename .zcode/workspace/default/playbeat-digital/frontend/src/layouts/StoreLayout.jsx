import { Outlet } from 'react-router-dom';
import { Header, Footer } from '../components/Header';
import { useSettings } from '../hooks/useSettings';

export const StoreLayout = () => {
  const { settings } = useSettings();
  return (
    <div className="flex min-h-screen flex-col">
      {settings?.announcements?.enabled && settings.announcements.message && (
        <div className="bg-gradient-to-r from-electric-dark/30 to-accent/20 text-center text-sm py-2 px-4 text-slate-100">
          {settings.announcements.message}
        </div>
      )}
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        <Outlet context={{ settings }} />
      </main>
      <Footer settings={settings} />
    </div>
  );
};
