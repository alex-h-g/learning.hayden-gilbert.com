import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { SITE } from '../lib/paths';
import { StorageNotice } from './common';

const APP_LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/play', label: 'Play' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/formulas', label: 'Formulas' },
  { to: '/progress', label: 'Progress' },
];

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // On route change: scroll to top and move focus to the page for screen readers.
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
      <header className="site-header">
        <div className="container site-header-inner">
          <a className="brand" href={SITE.home}>
            <span className="brand-title">Learning</span>
            <span className="brand-sub">hayden-gilbert.com</span>
          </a>
          <nav aria-label="Learning site" className="site-nav">
            <a href={SITE.home}>Home</a>
            <a href={SITE.thai}>Learn Thai</a>
            <NavLink to="/" end={false} className="active" aria-current="true">Math Games</NavLink>
            <a href={SITE.allGames}>Other Games</a>
          </nav>
        </div>
        <div className="app-bar">
          <div className="container app-bar-inner">
            <NavLink to="/" className="app-name">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                <circle cx="8" cy="15" r="5" fill="#c6a8f8" />
                <rect x="11" y="3" width="9" height="9" rx="1" fill="#5b9df9" />
                <path d="M15 21 L21 21 L18 15 Z" fill="#f27ba1" />
              </svg>
              Basic Geometry
            </NavLink>
            <nav aria-label="Basic Geometry" className="app-nav">
              {APP_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="container main">
        <StorageNotice />
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            <strong>Basic Geometry</strong> is a free learning resource. No sign-up, no tracking, no ads. Your progress is stored only in this
            browser on this device — it isn’t uploaded, backed up or synced anywhere.
          </p>
          <p>
            <a href={SITE.home}>← Back to all learning resources</a> · <a href={SITE.thai}>Learn Thai</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
