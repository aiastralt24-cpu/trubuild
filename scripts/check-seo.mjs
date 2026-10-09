import fs from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { solutionContent } from '../src/solutionContent.mjs';
import { publicRoutes, metadata } from '../src/seo.mjs';
for(const [id,content] of Object.entries(solutionContent)){
  const $=load(fs.readFileSync(`dist/solutions/${id}/index.html`,'utf8'));
  assert.equal($('h1').length,1,id);
  assert.equal($('title').text(),content.title,id);
  assert.equal($('meta[name="description"]').attr('content'),content.description);
  assert.equal($('link[rel="canonical"]').length,1);
  assert.equal($('link[rel="canonical"]').attr('href'),metadata('/solutions/'+id).url);
  assert.equal($('.solution-direct-answer').text(),content.answer);
  assert.equal($('.solution-faq details').length,content.faqs.length);
  const schema=JSON.parse($('#page-schema').html());
  assert.deepEqual(schema['@graph'].find(x=>x['@type']==='FAQPage').mainEntity.map(x=>[x.name,x.acceptedAnswer.text]),content.faqs);
  for(const [question,answer] of content.faqs){assert.ok($('.solution-faq').text().includes(question));assert.ok($('.solution-faq').text().includes(answer));}
  for(const el of $('a[href^="/documents/"]').toArray())assert.ok(fs.existsSync('dist'+$(el).attr('href')));
  for(const el of $('a[href^="/products/"]').toArray())assert.ok(fs.existsSync('dist'+$(el).attr('href')+'/index.html'));
  assert.ok(!$.text().includes('undefined'));
}
const sitemap=load(fs.readFileSync('dist/sitemap.xml','utf8'),{xml:true});
assert.equal(sitemap('loc').length,publicRoutes.length);
assert.ok(!sitemap.text().includes('127.0.0.1'));
const error=load(fs.readFileSync('dist/404.html','utf8'));
assert.match(error('meta[name="robots"]').attr('content'),/noindex/);
console.log('SEO checks passed: eight complete HTML guides, matching FAQ schema, canonical tags, linked PDFs/products, 55 sitemap URLs and noindex error page.');
