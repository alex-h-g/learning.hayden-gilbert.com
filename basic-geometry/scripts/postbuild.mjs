// Post-build step: make every client-side route directly loadable on any
// static host, with or without rewrite rules.
//
// 1. Copies dist/index.html into dist/<route>/index.html for each known route,
//    so /basic-geometry/play (and /play/) resolve to a real file.
// 2. Writes dist/404.html (GitHub Pages / Netlify style fallback).
// 3. Writes dist/.htaccess (Apache fallback) using the configured base path.
import { copyFileSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const index = join(dist, 'index.html');
if (!existsSync(index)) {
  console.error('postbuild: dist/index.html not found — run vite build first.');
  process.exit(1);
}

const routes = ['play', 'calculator', 'progress', 'formulas'];
for (const r of routes) {
  mkdirSync(join(dist, r), { recursive: true });
  copyFileSync(index, join(dist, r, 'index.html'));
}
copyFileSync(index, join(dist, '404.html'));

let base = process.env.BASE_PATH ?? '/basic-geometry/';
if (!base.endsWith('/')) base += '/';
writeFileSync(
  join(dist, '.htaccess'),
  `# Apache: serve the SPA for unknown paths under ${base}
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${base}
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.html [L]
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\\.pdf$">
    Header set Content-Disposition "attachment; filename=geometry-formula-cheat-sheet.pdf"
  </FilesMatch>
</IfModule>
`,
);

const pdf = join(dist, 'downloads', 'geometry-formula-cheat-sheet.pdf');
if (!existsSync(pdf) || readFileSync(pdf).subarray(0, 5).toString() !== '%PDF-') {
  console.error('postbuild: cheat-sheet PDF missing or invalid at public/downloads/geometry-formula-cheat-sheet.pdf');
  process.exit(1);
}
console.log(`postbuild: route copies (${routes.join(', ')}), 404.html and .htaccess written; PDF verified.`);
