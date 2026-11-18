import test from 'node:test';
import assert from 'node:assert/strict';
import {rooms,homography,invert} from '../src/visualizerEngine.mjs';
const room=id=>rooms.find(r=>r.id===id);
function inside([x,y],polygon){let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [a,b]=polygon[i],[c,d]=polygon[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;}
const covered=(surface,p)=>inside(p,surface.mask||surface.quad)&&!(surface.exclusions||[]).some(h=>inside(p,h));
test('previously exposed floor strips are included',()=>{
 for(const [id,x,y] of [['bedroom',100,560],['bedroom-suite',500,365],['kitchen',1380,590],['living-loft',1260,430],['outdoor',360,470],['pool',720,525]]) assert.ok(covered(room(id).floor,[x/1440,y/960]),id);
});
test('floor masks leave furniture and doorway faces untouched',()=>{
 for(const [id,x,y] of [['bedroom',300,410],['bedroom-suite',800,370],['kitchen',1000,510],['living-loft',1000,420],['outdoor',300,475]])assert.equal(covered(room(id).floor,[x/1440,y/960]),false,id);
});
test('pool floor and walls share their back junction exactly',()=>{
 const p=room('pool');assert.deepEqual(p.floor.quad[0],p.wall.quad[3]);assert.deepEqual(p.floor.quad[1],p.wall.quad[2]);assert.deepEqual(p.floor.quad[1],p.wall2.quad[3]);
});
test('wall masks preserve artwork and the pool light',()=>{
 assert.equal(covered(room('bedroom-suite').wall,[790/1440,100/960]),false);
 assert.equal(covered(room('living-loft').wall,[700/1440,150/960]),false);
 assert.equal(covered(room('pool').wall2,[1160/1440,440/960]),false);
});
test('every room surface has usable perspective and finite bounded outlines',()=>{
 for(const r of rooms)for(const key of ['floor','wall','wall2']){const s=r[key];if(!s)continue;assert.ok(invert(homography(s.quad)),r.id+key);for(const p of [s.mask,...s.exclusions||[],...s.foliage||[]].filter(Boolean)){assert.ok(p.length>=3);for(const xy of p)assert.ok(xy.length===2&&xy.every(v=>Number.isFinite(v)&&v>=0&&v<=1),r.id+key);}}
});
