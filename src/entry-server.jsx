import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { metadata, publicRoutes, safeJson, SITE_URL } from './seo.mjs';
export { publicRoutes, metadata, safeJson, SITE_URL };
export function render(url) {
  return renderToString(<StaticRouter location={url}><App /></StaticRouter>);
}
