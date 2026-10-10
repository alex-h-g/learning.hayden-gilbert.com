import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { SITE } from '../lib/paths';
import { useStore } from '../lib/store';
import { GinaImg, preloadGina } from './Gina';
import { Stars, StorageNotice } from './common';

const APP_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/progress', label: 'My Progress' },
  { to: '/guide', label: 'Revision Guide' },
  { to: '/reference', label: 'Formulas' },
  { to: '/converter', label: 'Unit converter' },
];

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  const { data } = useStore();

  useEffect(() => preloadGina(), []);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header no-print">
        <div className="container site-header-inner">
          <a className="brand" href={SITE.home}>
            <span className="brand-title">Learning</span>
            <span className="brand-sub">hayden-gilbert.com</span>
          </a>
          <nav aria-label="Learning site" className="site-nav">
            <a href={SITE.home}>Home</a>
            <a href={SITE.thai}>Learn Thai</a>
            <a href={SITE.math} className="active" aria-current="true">Math Games</a>
            <a href={SITE.allGames}>Other Games</a>
          </nav>
        </div>
        <div className="app-bar">
          <div className="container app-bar-inner">
            <Link to="/" className="app-name">
              <GinaImg pose="neutral" size="sm" className="app-avatar" />
              Geometry 2 <span className="app-sub">with Geometry Gina</span>
            </Link>
            <nav aria-label="Geometry 2" className="app-nav">
              {APP_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
              ))}
            </nav>
            <Link to="/progress" className="app-stars" title="Stars earned">
              <Stars n={data.stars} />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="container main">
        <StorageNotice />
        <Outlet />
      </main>

      <footer className="site-footer no-print">
        <div className="container footer-inner">
          <p><strong>Geometry 2</strong> is a free learning resource. No sign-up, no tracking, no ads. Your name and progress are stored only in this browser on this device — they aren’t uploaded or synced, so they won’t follow you to another device.</p>
          <p><a href={SITE.home}>← Back to all learning resources</a> · <a href="/basic-geometry/">Basic Geometry</a> · <a href={SITE.thai}>Learn Thai</a></p>
        </div>
      </footer>
    </div>
  );
}
