import { validateEnquiry } from '../_shared/validation.mjs';
import catalogue from '../_shared/catalogue.json' with { type: 'json' };

Deno.serve(async (req: Request) => {
  const origin=req.headers.get('origin') || '';
  const allowed=(Deno.env.get('ALLOWED_ORIGINS') || 'https://www.trubuild.in,https://trubuild.in').split(',').map(s=>s.trim());
  const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type,apikey','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{...cors,'Cache-Control':'no-store'}});
  if(!allowed.includes(origin))return new Response('Forbidden',{status:403});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return reply({error:'Method not allowed.'},405);
  if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'JSON required.'},415);
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),salt=Deno.env.get('RATE_LIMIT_SALT');
  if(!url||!key||!salt)return reply({error:'Enquiries are temporarily unavailable.'},503);
  let parsed;
  try {
    // Bound the actual body, including chunked requests without Content-Length.
    const reader=req.body?.getReader();let text='',size=0;const decoder=new TextDecoder();
    if(!reader)throw new Error('Invalid submission.');
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();return reply({error:'Submission too large.'},413);}text+=decoder.decode(value,{stream:true});}
    text+=decoder.decode();
    parsed=validateEnquiry(JSON.parse(text),catalogue.documents,catalogue.productIds);
  } catch(e){return reply({error:e instanceof SyntaxError?'Invalid submission.':(e as Error).message},400);}
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  try {
    // Hash the platform-forwarded address; never store the raw IP or log submitted contact data.
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+ip));
    const rateKey=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const saved=await fetch(`${url}/rest/v1/rpc/record_enquiry`,{method:'POST',headers,body:JSON.stringify({p_request_id:parsed.requestId,p_payload:parsed.payload,p_rate_key:rateKey})});
    if(!saved.ok){const detail=await saved.text();if(detail.includes('rate_limited'))return reply({error:'Too many requests. Please try again in ten minutes.'},429);if(detail.includes('request_conflict'))return reply({error:'The request changed. Please reopen the form and try again.'},409);throw new Error('save_failed');}
    const id=await saved.json();
    if(parsed.payload.kind!=='tds_download')return reply({id});
    const path=catalogue.documents[parsed.payload.documentPath as keyof typeof catalogue.documents].object;
    const signed=await fetch(`${url}/storage/v1/object/sign/tds/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers,body:JSON.stringify({expiresIn:120})});
    if(!signed.ok)return reply({error:'Your details were received, but this PDF is temporarily unavailable. Please try again.'},503);
    const data=await signed.json();
    return reply({id,downloadUrl:`${url}/storage/v1${data.signedURL}`});
  } catch {return reply({error:'We couldn’t complete your request. Please try again.'},503);}
});
