import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { solutionContent } from '../src/solutionContent.mjs';
import { metadata, publicRoutes } from '../src/seo.mjs';
const products = JSON.parse(fs.readFileSync(new URL('../src/products.json',import.meta.url)));
test('all eight solution guides have distinct search intent and valid product references',()=>{
  const guides=Object.entries(solutionContent);
  assert.equal(guides.length,8);
  assert.equal(new Set(guides.map(([,s])=>s.title)).size,8);
  assert.equal(new Set(guides.map(([,s])=>s.description)).size,8);
  const questions=[];
  for(const [id,s] of guides){
    assert.ok(s.answer.length>180,id);assert.ok(s.faqs.length>=4,id);
    for(const productId of [...s.documents,...s.choices.map(c=>c[2])])assert.ok(products.some(p=>p.id===productId),productId);
    for(const related of s.related)assert.ok(solutionContent[related] && related!==id);
    for(const [question,answer] of s.faqs){assert.ok(answer.length>80);questions.push(question);}
  }
  assert.equal(new Set(questions).size,questions.length,'Avoid duplicating questions across intent pages');
});
test('metadata has canonical URLs, accurate FAQ schema and noindex for unknown routes',()=>{
  for(const [id,s] of Object.entries(solutionContent)){
    const m=metadata('/solutions/'+id);
    assert.equal(m.url,'https://www.trubuild.in/solutions/'+id);
    const faq=m.schema['@graph'].find(x=>x['@type']==='FAQPage');
    assert.deepEqual(faq.mainEntity.map(x=>[x.name,x.acceptedAnswer.text]),s.faqs);
    assert.equal(m.schema['@graph'].find(x=>x['@type']==='BreadcrumbList').itemListElement.length,3);
  }
  assert.match(metadata('/solutions/not-found').robots,/noindex/);
  assert.match(metadata('/solutions/roof/not-a-page').robots,/noindex/);
  assert.match(metadata('/compare').robots,/noindex/);
  assert.equal(new Set(publicRoutes).size,publicRoutes.length);
});
