import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateEnquiry} from '../supabase/functions/_shared/validation.mjs';
const catalogue=JSON.parse(fs.readFileSync('supabase/functions/_shared/catalogue.json'));
const documentPath=Object.keys(catalogue.documents)[0];
const input={requestId:'88888888-8888-4888-8888-888888888888',kind:'tds_download',name:' Test Person ',mobile:'+91 90000 00000',email:'TEST@example.com',documentPath};
test('TDS requires all three contact fields and a known document',()=>{
 const result=validateEnquiry(input,catalogue.documents,catalogue.productIds);
 assert.equal(result.payload.name,'Test Person');assert.equal(result.payload.email,'test@example.com');
 for(const change of [{name:' '},{email:'invalid'},{mobile:'123'},{mobile:'abcdefghij'},{documentPath:'/../../private.pdf'},{documentPath:'https://example.org/file.pdf'},{productId:'fake'},{requestId:'bad'},{name:[]},{kind:'admin'}])assert.throws(()=>validateEnquiry({...input,...change},catalogue.documents,catalogue.productIds));
});
test('general and product enquiries require a message; optional mobile is validated when supplied',()=>{
 for(const kind of ['product_enquiry','general_enquiry']){
  assert.throws(()=>validateEnquiry({...input,kind},catalogue.documents,catalogue.productIds));
  const result=validateEnquiry({...input,kind,message:'Please advise.',mobile:''},catalogue.documents,catalogue.productIds);
  assert.equal(result.payload.documentPath,'');
 }
});
test('backend document registry matches resource library and all files exist',()=>{
 const resources=JSON.parse(fs.readFileSync('src/resources.json'));
 assert.deepEqual(Object.keys(catalogue.documents).sort(),[...new Set(resources.map(r=>r.local))].sort());
 for(const path of Object.keys(catalogue.documents))assert.ok(fs.existsSync('public'+path));
});
let handler;
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-server-key',RATE_LIMIT_SALT:'test-salt',ALLOWED_ORIGINS:'https://www.trubuild.in'};
globalThis.Deno={env:{get:key=>env[key]},serve:fn=>{handler=fn;}};
await import('../supabase/functions/enquiries/index.ts');
const req=body=>new Request('https://test.supabase.co/functions/v1/enquiries',{method:'POST',headers:{Origin:'https://www.trubuild.in','Content-Type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify(body)});
test('edge saves before signing, returns signed URL, hashes the address',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  calls.push({url,body:JSON.parse(options.body)});
  return Response.json(url.includes('/rpc/')?'test-reference':{signedURL:'/object/sign/tds/file.pdf?token=test'});
 });
 const response=await handler(req(input));const data=await response.json();
 assert.equal(response.status,200);assert.equal(data.id,'test-reference');assert.match(data.downloadUrl,/storage\/v1\/object\/sign/);
 assert.match(calls[0].url,/record_enquiry/);assert.equal(calls[0].body.p_rate_key.length,64);assert.ok(!JSON.stringify(calls).includes('192.0.2.1'));assert.equal(calls[1].body.expiresIn,120);
});
test('failed save and rate limit never issue a download',async t=>{
 let count=0;t.mock.method(globalThis,'fetch',async()=>{count++;return new Response('rate_limited',{status:400});});
 const response=await handler(req(input));assert.equal(response.status,429);assert.equal(count,1);
});
test('invalid origin, malformed body and invalid contact data never reach the database',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw new Error('must not call');});
 assert.equal((await handler(new Request('https://test.supabase.co',{method:'POST',headers:{Origin:'https://evil.example'}}))).status,403);
 assert.equal((await handler(req({...input,email:'invalid'}))).status,400);
 assert.equal((await handler(req({...input,message:'x'.repeat(17000)}))).status,413);
});
test('general enquiries save without accessing storage',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async url=>{calls.push(url);return Response.json('reference');});
 const response=await handler(req({...input,kind:'general_enquiry',message:'Please call me.'}));
 assert.equal(response.status,200);assert.equal(calls.length,1);assert.deepEqual(await response.json(),{id:'reference'});
});
