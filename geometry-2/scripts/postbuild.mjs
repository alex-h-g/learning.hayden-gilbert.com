// Post-build step: make every client-side route directly loadable on any
// static host, with or without rewrite rules.
//
// 1. Copies dist/index.html into dist/<route>/index.html for each route in
//    scripts/routes.json (a unit test checks the list covers every lesson/topic).
// 2. Writes dist/404.html (fallback for hosts that serve it).
// 3. Writes dist/.htaccess (Apache fallback) using the configured base path.
// 4. Checks all nine Gina poses are present.
import { copyFileSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const index = join(dist, 'index.html');
if (!existsSync(index)) {
  console.error('postbuild: dist/index.html not found — run vite build first.');
  process.exit(1);
}

const routes = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url), 'utf8'));
for (const r of routes) {
  mkdirSync(join(dist, r), { recursive: true });
  copyFileSync(index, join(dist, r, 'index.html'));
}
copyFileSync(index, join(dist, '404.html'));

let base = process.env.BASE_PATH ?? '/geometry-2/';
if (!base.endsWith('/')) base += '/';
writeFileSync(
  join(dist, '.htaccess'),
  `# Apache: serve the app for unknown paths under ${base}
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${base}
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.html [L]
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|woff2?)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
  <FilesMatch "index\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
`,
);

const poses = ['waving', 'thinking', 'explaining', 'curious', 'encouraging', 'celebrating', 'cheering', 'reassuring', 'neutral'];
const missing = poses.filter((p) => !existsSync(join(dist, 'gina', `gina-${p}.webp`)));
if (missing.length) {
  console.error(`postbuild: missing Gina poses: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`postbuild: ${routes.length} route copies, 404.html and .htaccess written; 9 Gina poses verified.`);
