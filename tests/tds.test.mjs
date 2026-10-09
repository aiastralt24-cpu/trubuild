import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const products = read('../src/products.json');
const resources = read('../src/resources.json');
const manifest = read('../research/tds-audit/manifest.json');
const product = name => products.find(p => p.name === name);
const result = (name, property) => product(name).specs.find(r => r[0].startsWith(property))?.[2];
test('all 23 supplied sheets resolve to a unique product and byte-identical downloadable PDF', () => {
  assert.equal(manifest.length, 23);
  assert.equal(new Set(resources.map(r => r.local)).size, resources.length);
  for (const entry of manifest) {
    const p = products.find(p => p.id === entry.productId);
    const docs = resources.filter(r => r.productId === p.documentId);
    assert.equal(docs.length, 1, entry.file);
    assert.equal(docs[0].local, p.tds);
    const bytes = fs.readFileSync(new URL('../public' + p.tds, import.meta.url));
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash, entry.sha256);
    assert.equal(hash, p.tdsSha256);
    assert.equal(docs[0].bytes, bytes.length);
    assert.ok(p.specs.length > 0);
    assert.ok(p.specPages.length > 0);
    assert.ok(p.specs.every(row => row.length === 3 && row[0] && row[2] && row[2] !== 'Results'));
  }
});
test('critical mix ratios, limits and visually checked symbols survive extraction', () => {
  assert.match(result('Aqualock', 'Mixing ratio'), /^1:2/);
  assert.match(result('Aqualock Flexi', 'Mixing ratio'), /^1:1.4/);
  assert.equal(result('Plasterbond Eco', 'Bond strength'), '≥0.7 MPa');
  assert.equal(result('TRU PU', 'Elongation'), '≥600%');
  assert.equal(result('Sealmaster Flexi', 'MAF'), '±50%');
  assert.equal(result('SBR 333', '%Solid'), '38 ± 2');
  assert.equal(result('WRP 777', 'Density'), '1.01 ± 0.01');
  assert.match(product('TRU PU').applicationNotes.join(' '), /Not suitable for permanent immersion/);
  assert.ok(!product('TRU PU').applications.includes('Water Tanks and Other Areas'));
  assert.ok(!product('TCSR-555').applications.includes('Water Tanks and Other Areas'));
});
test('new names retain legacy search aliases and revised pack sizes', () => {
  assert.ok(product('Crackfill Paste').aliases.includes('CFP 425'));
  assert.ok(product('Crackfill Powder').aliases.includes('CFP 525'));
  assert.ok(product('SBR 333').aliases.includes('WPL 333'));
  assert.equal(product('Buildcrete').packaging, '1 kg, 5 kg, 20 kg, 50 kg');
  assert.equal(product('TCSR-555').packaging, '300 g set, 1.5 kg set, 7.5 kg set');
  assert.deepEqual(products.filter(p => p.imageKind === 'document').map(p => p.id).sort(), ['trubuild-trubond-ds-tape']);
});
