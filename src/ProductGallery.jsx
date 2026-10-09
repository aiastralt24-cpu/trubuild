import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import packaging from './packaging.json';
import './product-gallery.css';

export function ProductGallery({ product, variant = 0 }) {
  const data = packaging[product.id];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const touch = useRef(null);
  const images = data?.variants?.[variant]?.images || data?.images || [{src:product.image,label:product.imageKind === 'document' ? 'Technical data sheet preview' : 'Packaging'}];
  const current = images[active] || images[0];
  const step = (n) => setActive(i => (i + n + images.length) % images.length);
  useEffect(() => {
    if (!zoom) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { document.body.style.overflow = previous; trigger.current?.focus(); };
  }, [zoom]);
  const swipe = {
    onTouchStart:e => {touch.current = {x:e.touches[0].clientX,y:e.touches[0].clientY};},
    onTouchEnd:e => {if(!touch.current)return; const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y; if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy))step(dx<0?1:-1);touch.current=null;},
  };
  return <div className={"pack-gallery" + (images.length > 1 ? " has-thumbnails" : "")}>
    <div className="pack-stage" {...swipe}>
      <button ref={trigger} className="pack-enlarge" onClick={() => setZoom(true)} aria-label={`Enlarge ${product.name}: ${current.label}`}>
        <img src={current.src} alt={`${product.name} — ${current.label}`} />
        <span><Maximize2 size={16}/> View larger</span>
      </button>
      {images.length > 1 && <div className="pack-navigation"><button onClick={() => step(-1)} aria-label="Previous product image"><ChevronLeft/></button><span aria-live="polite">{current.label}</span><button onClick={() => step(1)} aria-label="Next product image"><ChevronRight/></button></div>}
    </div>

    {images.length > 1 && <div className="pack-thumbnails" aria-label="Product images">{images.map((im,i)=><button key={im.src} aria-pressed={active===i} onClick={()=>setActive(i)}><img src={im.thumbnail || im.src} alt="" loading="lazy"/><span>{im.label}</span></button>)}</div>}
    {data?.note && <p className="pack-note">{data.note}</p>}
    {zoom && <dialog ref={dialog} className="pack-lightbox" aria-label={`${product.name} image viewer`} onCancel={()=>setZoom(false)} onKeyDown={e=>{if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);}}>
      <button className="pack-close" aria-label="Close image viewer" onClick={()=>setZoom(false)} autoFocus><X/> Close</button>
      <div className="pack-zoom-image" {...swipe}><img src={current.src} alt={`${product.name} — ${current.label}`}/></div>
      <div className="pack-navigation"><button disabled={images.length<2} onClick={()=>step(-1)} aria-label="Previous enlarged image"><ChevronLeft/></button><span>{current.label}</span><button disabled={images.length<2} onClick={()=>step(1)} aria-label="Next enlarged image"><ChevronRight/></button></div>
    </dialog>}
  </div>;
}

export function ProductColour({product, products}) {
  const family = product.id.replace(/-(grey|white)$/, '');
  if(family === product.id) return null;
  const siblings=products.filter(p=>p.id.replace(/-(grey|white)$/, '')===family);
  if(siblings.length<2)return null;
  return <div className="pack-colours"><span>Colour</span>{siblings.map(p=><Link key={p.id} to={'/products/'+p.id} aria-current={p.id===product.id?'page':undefined}>{p.id.endsWith('-grey')?'Grey':'White'}</Link>)}</div>;
}

export function PackSizeSelector({ product, variant, onChange }) {
  const data = packaging[product.id];
  const options = product.packSizes || data?.variants?.map(v => v.label);
  if (!options?.length) return null;
  return <fieldset className="pack-sizes"><legend>Pack size</legend><div>{options.map((label,i)=><button key={label} aria-pressed={variant===i} onClick={()=>onChange(i)}>{label}</button>)}</div>{product.packSizes && <p className="pack-note">Packaging image is representative; the selected pack size may not be pictured.</p>}</fieldset>;
}

export function StickyProductEnquiry({ product, selectedPack, actionRef, href }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = actionRef.current;
    if (!element) return;
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(element.getBoundingClientRect().bottom < 80));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [actionRef]);
  return visible ? <aside className="product-enquiry-dock" aria-label="Product enquiry">
    <div><strong>{product.name}</strong><span>{selectedPack || 'Technical advice for your project'}</span></div>
    <Link className="button" to={href}>Enquire <ChevronRight size={18}/></Link>
  </aside> : null;
}
