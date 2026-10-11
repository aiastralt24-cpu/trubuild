import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { blogs, blogTopics, relatedBlogs } from '../src/blogs.mjs';
import products from '../src/products.json' with {type:'json'};
import { metadata, publicRoutes } from '../src/seo.mjs';
import { solutionContent } from '../src/solutionContent.mjs';
test('50 distinct editorial guides cover the agreed seven topics', () => {
  assert.equal(blogs.length,50);
  assert.equal(new Set(blogs.map(b=>b.slug)).size,50);
  assert.equal(new Set(blogs.map(b=>b.title)).size,50);
  assert.deepEqual(blogTopics.map(t=>blogs.filter(b=>b.topic===t.id).length),[10,8,10,6,6,6,4]);
  const paragraphs=blogs.flatMap(b=>b.sections.map(s=>s[1]));
  assert.equal(new Set(paragraphs).size,150);
});
test('every guide has real product assets, valid solution links and distinct related reading', () => {
  for(const b of blogs){
    assert.ok(solutionContent[b.solution],b.slug);
    assert.ok(b.sections.length===3 && b.checklist.length===3 && b.question && b.response);
    assert.ok([b.answer,...b.sections.flat(),...b.checklist,b.question,b.response].join(' ').split(/\s+/).length>=160,b.slug);
    for(const id of b.productIds){const p=products.find(p=>p.id===id);assert.ok(p,id);assert.ok(fs.existsSync('public'+p.image),p.image);}
    const related=relatedBlogs(b);assert.equal(related.length,3);assert.ok(related.every(r=>r.slug!==b.slug));
  }
});
test('all articles are crawlable routes with article metadata and accurate schema',()=>{
  for(const b of blogs){const path='/blogs/'+b.slug;assert.ok(publicRoutes.includes(path));const m=metadata(path);assert.equal(m.type,'article');assert.ok(m.robots.startsWith('index'));assert.equal(m.url,'https://www.trubuild.in'+path);const article=m.schema['@graph'].find(n=>n['@type']==='BlogPosting');assert.equal(article.headline,b.title);assert.equal(article.description,b.answer);}
  assert.equal(metadata('/blogs/missing').robots,'noindex, follow');
});

test('all 50 guides use distinct article imagery instead of repeated topic photos',()=>{
  assert.equal(new Set(blogs.map(b=>b.image)).size,50);
  assert.equal(new Set(blogs.map(b=>b.thumbnail)).size,50);
  for(const b of blogs){
    assert.ok(b.image.startsWith('/images/guides/'));
    assert.ok(b.imageAlt.length>25);
    assert.ok(fs.existsSync('public'+b.image),b.image);
    assert.ok(fs.existsSync('public'+b.thumbnail),b.thumbnail);
    assert.equal(metadata('/blogs/'+b.slug).image,'https://www.trubuild.in'+b.image);
    assert.ok(!products.some(p=>p.image===b.image));
  }
});
