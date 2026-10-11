import fs from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { blogs } from '../src/blogs.mjs';
const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
for(const b of blogs){
  const route='/blogs/'+b.slug;
  const $=load(fs.readFileSync('dist'+route+'/index.html','utf8'));
  assert.equal($('h1').length,1,b.slug);
  assert.equal($('h1').text(),b.title);
  assert.equal($('link[rel=canonical]').attr('href'),'https://www.trubuild.in'+route);
  assert.equal($('meta[property="og:type"]').attr('content'),'article');
  assert.ok($('.guide-answer').text().includes(b.answer));
  for(const [,text] of b.sections) assert.ok($('.guide-body').text().includes(text));
  assert.equal($('.guide-products>a').length,b.productIds.length);
  assert.equal($('.guide-cover img').attr('src'),b.image);
  assert.equal($('.guide-cover img').attr('alt'),b.imageAlt);
  assert.equal($('meta[property="og:image"]').attr('content'),'https://www.trubuild.in'+b.image);
  const schema=JSON.parse($('#page-schema').text());
  assert.equal(schema['@graph'][0].headline,b.title);
  assert.ok(sitemap.includes('https://www.trubuild.in'+route));
  $('main a[href^="/"]').each((_,a)=>{const href=$(a).attr('href').split(/[?#]/)[0];assert.ok(fs.existsSync('dist'+(href==='/'?'':href)+'/index.html'),b.slug+' -> '+href);});
}
const index=load(fs.readFileSync('dist/blogs/index.html','utf8'));
assert.equal(index('.guide-card').length,50);
console.log('Blog checks passed: 50 complete HTML articles, matching schema, valid internal links, canonicals, pack shots and sitemap entries.');
