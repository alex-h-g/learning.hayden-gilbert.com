/** Base path the app is served from, e.g. "/geometry-2/". Set at build time by Vite. */
export const BASE = import.meta.env.BASE_URL;

/** Router basename without trailing slash ("/geometry-2" or ""). */
export const ROUTER_BASENAME = BASE.replace(/\/$/, '');

/** Public URL of a file in /public, correct under any base path. */
export const asset = (p: string) => `${BASE}${p.replace(/^\//, '')}`;

/** Wider learning site. */
export const SITE = {
  home: 'https://learning.hayden-gilbert.com/',
  thai: 'https://learn-thai.hayden-gilbert.com/',
  math: 'https://learning.hayden-gilbert.com/#math',
  allGames: 'https://learning.hayden-gilbert.com/#all-games',
};
