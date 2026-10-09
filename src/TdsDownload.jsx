import { submitEnquiry } from "./enquiries.mjs";
import React, { useEffect, useRef, useState } from 'react';
import { FileDown, X, Check } from 'lucide-react';
import './tds-download.css';

export function TdsDownload({ product, document: sheet, onClose }) {
  const dialog = useRef(null);
  const abort = useRef(null);
  const request = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    const focused = window.document.activeElement;
    const overflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { abort.current?.abort(); window.document.body.style.overflow = overflow; focused?.focus(); };
  }, []);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = fields.get('name').trim();
    const mobile = fields.get('mobile').trim();
    const email = fields.get('email').trim();
    if (!name || !/^[+\d\s()-]+$/.test(mobile) || !/^\d{10,15}$/.test(mobile.replace(/\D/g, ''))) {
      setError('Enter your name and a valid mobile number, including the country code if needed.');
      return;
    }
    setBusy(true); setError('');
    abort.current = new AbortController();
    const timer = setTimeout(() => abort.current?.abort(), 20000);
    try {
      const payload = {kind:'tds_download',name,mobile,email,productId:product.id || '',productName:product.name,documentPath:sheet.local};
      const fingerprint = JSON.stringify(payload);
      if(request.current?.fingerprint !== fingerprint) request.current = {fingerprint,id:crypto.randomUUID()};
      const result = await submitEnquiry({...payload,requestId:request.current.id},abort.current.signal);
      if(!result.downloadUrl)throw new Error('The PDF is temporarily unavailable. Please try again.');
      const response = await fetch(result.downloadUrl, {signal:abort.current.signal});
      if (!response.ok) throw new Error('The PDF download failed. Please try again.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url; a.download = `${product.name.replace(/[^a-z0-9-]/gi,'-')}-TDS.pdf`;
      window.document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      form.reset(); setDone(true);
    } catch (e) {
      if (dialog.current?.open) setError(e.name === 'AbortError' ? 'The request timed out. Please try again.' : e.message);
    } finally { clearTimeout(timer); setBusy(false); }
  }
  return <dialog ref={dialog} className="tds-modal" aria-labelledby="tds-heading" onCancel={onClose}>
    <button className="tds-close" aria-label="Close TDS form" onClick={onClose}><X size={20}/></button>
    <div className="tds-symbol">{done ? <Check/> : <FileDown/>}</div>
    <p className="tds-product">{product.name} · Technical data sheet</p>
    <h2 id="tds-heading">{done ? 'Your download has started.' : 'Get the product details.'}</h2>
    {done ? <><p className="tds-intro">The PDF is ready in your browser’s downloads.</p><button className="tds-submit" onClick={onClose}>Done <Check size={18}/></button></> : <>
      <p className="tds-intro">Enter your details to download the TDS.</p>
      <form onSubmit={submit}>
        <label>Name<input name="name" autoComplete="name" required maxLength={100} placeholder="Your full name" autoFocus /></label>
        <label>Mobile number<input name="mobile" type="tel" inputMode="tel" autoComplete="tel" required maxLength={22} placeholder="Your mobile number" /></label>
        <label>Email ID<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label>
        {error && <p className="tds-error" role="alert">{error}</p>}
        <button className="tds-submit" type="submit" disabled={busy}>{busy ? 'Preparing your download…' : 'Download TDS'}<FileDown size={18}/></button>
        <p className="tds-preview">We’ll use these details to respond to your product enquiry. <a href="https://www.trubuild.in/privacy-policy/" target="_blank" rel="noreferrer">Privacy policy</a></p>
      </form>
    </>}
  </dialog>;
}

export function TdsLink({product, sheet, children, ...props}) {
  const [open,setOpen]=useState(false);
  if(sheet.pending)return <a href={sheet.url} {...props}>{children}</a>;
  return <><a href={sheet.local || sheet.url} {...props} onClick={event=>{event.preventDefault();setOpen(true);}}>{children}</a>{open && <TdsDownload product={product} document={sheet} onClose={()=>setOpen(false)}/>}</>;
}
