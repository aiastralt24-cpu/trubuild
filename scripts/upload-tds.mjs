import fs from 'node:fs/promises';
const base=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!base||!key)throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the local process environment. Never use a VITE_ prefix for this server key.');
const {documents}=JSON.parse(await fs.readFile('supabase/functions/_shared/catalogue.json','utf8'));
for(const [local,doc] of Object.entries(documents)){
 const body=await fs.readFile('public'+local);
 const response=await fetch(`${base.replace(/\/$/,'')}/storage/v1/object/tds/${doc.object.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/pdf','x-upsert':'true'},body});
 if(!response.ok)throw new Error(`Upload failed for ${doc.object}: HTTP ${response.status}`);
 console.log(`Uploaded ${doc.object}`);
}
