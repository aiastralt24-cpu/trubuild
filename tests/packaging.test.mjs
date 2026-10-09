import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('src/packaging.json'));
const products=JSON.parse(fs.readFileSync('src/products.json'));
test('packaging references resolve to supplied assets and current products',()=>{
 for(const [id,g] of Object.entries(data)){
  const p=products.find(p=>p.id===id);assert.ok(p,id);
  const sets=g.variants?.map(v=>v.images)||[g.images];
  assert.equal(p.image,sets[0][0].src);
  for(const images of sets) for(const im of images){assert.ok(fs.existsSync('public'+im.src),im.src);assert.ok(fs.existsSync('public'+im.thumbnail));assert.ok(im.label);}
 }
});
test('printed labels correct reversed filenames and kit components are not size variants',()=>{
 assert.equal(data['trubuild-plasterbond'].images[0].src,'/images/packaging/40.webp');
 assert.equal(data['trubuild-plasterbond-eco'].images[0].src,'/images/packaging/39.webp');
 assert.equal(data['trufix-440-grey'].images[0].src,'/images/packaging/70.webp');
 assert.deepEqual(data['trubuild-stylo-3k'].variants.map(v=>v.label),['5 kg']);
 assert.deepEqual(data['trubuild-aqualock'].variants.map(v=>v.label),['3 kg','15 kg','90 kg']);
 assert.deepEqual(data['trubuild-iw-plus-111'].variants.map(v=>v.label), ['20 L', '1 L']);
 assert.ok(products.find(p=>p.name==='CPS 111').aliases.includes('IW+ 111'));
});
