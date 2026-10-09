import { build } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
await build({build:{ssr:'src/entry-server.jsx',outDir:'dist/.ssr',emptyOutDir:true},ssr:{noExternal:['react-router-dom','react-router']}});
const escape = value => value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
try {
  const { render, metadata, publicRoutes, safeJson, SITE_URL } = await import('../dist/.ssr/entry-server.js');
  const template = await fs.readFile('dist/index.html','utf8');
  for(const route of [...publicRoutes, '/compare', '/sources', '/404']) {
    const m = metadata(route);
    const head = `<title>${escape(m.title)}</title>\n<meta name="description" content="${escape(m.description)}" />\n<meta name="robots" content="${m.robots}" />\n<link rel="canonical" href="${escape(m.url)}" />\n` +
      Object.entries({'og:title':m.title,'og:description':m.description,'og:url':m.url,'og:image':m.image,'og:type':'website','og:site_name':'TruBuild','og:locale':'en_IN'}).map(([key,value])=>`<meta property="${key}" content="${escape(value)}" />`).join('\n') + '\n' +
      Object.entries({'twitter:card':'summary_large_image','twitter:title':m.title,'twitter:description':m.description,'twitter:image':m.image}).map(([key,value])=>`<meta name="${key}" content="${escape(value)}" />`).join('\n') +
      (m.schema ? `\n<script type="application/ld+json" id="page-schema">${safeJson(m.schema)}</script>` : '');
    const html = template.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta\s+name="description"[\s\S]*?\/>/,'').replace('</head>',head+'\n</head>').replace('<div id="root"></div>',`<div id="root" data-prerendered="true" data-route="${escape(route)}">${render(route)}</div>`);
    const destination = route === '/' ? 'dist/index.html' : route === '/404' ? 'dist/404.html' : path.join('dist',route,'index.html');
    await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,html);
  }
  // SPA fallback must not contain the prerendered home page or its canonical.
  await fs.writeFile('dist/200.html',template);
  await fs.writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicRoutes.map(route=>`  <url><loc>${escape(SITE_URL+route)}</loc></url>`).join('\n')}\n</urlset>\n`);
  await fs.writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log(`Prerendered ${publicRoutes.length} public routes with metadata and sitemap for ${SITE_URL}.`);
} finally {await fs.rm('dist/.ssr',{recursive:true,force:true});}
