export async function submitEnquiry(payload, signal) {
  const base=import.meta.env.VITE_SUPABASE_URL;
  const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!base || !key)throw new Error('Online enquiries are not connected yet. Please contact our team on 1800 309 9393.');
  const response=await fetch(`${base.replace(/\/$/,'')}/functions/v1/enquiries`,{
    method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify(payload),signal,
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error || 'We couldn’t submit your details. Please try again.');
  if(!data.id)throw new Error('Submission could not be confirmed. Please try again.');
  return data;
}
