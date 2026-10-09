import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const products=JSON.parse(fs.readFileSync('src/products.json'));
const catalogue=JSON.parse(fs.readFileSync('supabase/functions/_shared/catalogue.json'));
const packaging=JSON.parse(fs.readFileSync('src/packaging.json'));
test('feedback pack sizes are consistent with displayed packaging',()=>{
 const expected={
 'trubuild-buildcrete':['1 kg','5 kg','20 kg','50 kg'],
 'trubuild-sbr-pro-334':['200 g','500 g','1 kg','5 kg','10 kg','20 kg','50 kg'],
 'trubuild-aquapoxy':['1 kg','10 kg'],
 'trubuild-walltect-top-coat':['1 L','4 L','20 L'],
 'trubuild-walltect-basecoat':['1 L','4 L','20 L'],
 'trubuild-rooftect-advanced':['1 L','4 L','10 L','20 L'],
 'trubuild-rooftect-prime':['1 L','4 L','10 L','20 L'],
 'trubuild-primesure-premium':['1 L'],
 'trufix-110':['20 kg','40 kg'],'trufix-220-grey':['20 kg','40 kg']};
 for(const[id,sizes]of Object.entries(expected)){const p=products.find(p=>p.id===id);assert.deepEqual(p.packSizes,sizes);assert.equal(p.packaging,sizes.join(', '));}
});
test('new product families retain separate identities and do not borrow technical sheets',()=>{
 const ids=['trubuild-trubond-hdpe-membrane','trubuild-walltect-advanced','trubuild-walltect-prime','trubuild-primesure-plus','trufix-330-plus-grey','trufix-330-plus-white','trubuild-stylo-duo'];
 for(const id of ids){const p=products.find(p=>p.id===id);assert.ok(p);assert.equal(p.tdsStatus,'replacement-pending');assert.equal(p.tds,null);assert.deepEqual(p.specs,[]);assert.ok(catalogue.productIds.includes(id));assert.ok(packaging[id]);}
 assert.ok(products.some(p=>p.id==='trubuild-trubond-ds-tape'));
 assert.equal(new Set(products.map(p=>p.id)).size,products.length);
});
test('Trushield uses the supplied black membrane reference throughout its gallery',()=>{
 const p=products.find(p=>p.id==='trubuild-trushield');assert.equal(p.image,'/images/packaging/trushield-black-reference.webp');assert.equal(packaging[p.id].images[0].src,p.image);
});
