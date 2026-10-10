/** Base path the app is served from, e.g. "/basic-geometry/". Set at build time by Vite. */
export const BASE = import.meta.env.BASE_URL;

/** Router basename without trailing slash ("/basic-geometry" or ""). */
export const ROUTER_BASENAME = BASE.replace(/\/$/, '');

/** Public URL of a file in /public, correct under any base path. */
export const asset = (p: string) => `${BASE}${p.replace(/^\//, '')}`;

export const CHEAT_SHEET_URL = asset('downloads/geometry-formula-cheat-sheet.pdf');
export const CHEAT_SHEET_FILENAME = 'geometry-formula-cheat-sheet.pdf';

/** Wider learning site. */
export const SITE = {
  home: 'https://learning.hayden-gilbert.com/',
  thai: 'https://learn-thai.hayden-gilbert.com/',
  allGames: 'https://learning.hayden-gilbert.com/#all-games',
};
