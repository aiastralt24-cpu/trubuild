import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search, ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { blogs, blogTopics, relatedBlogs, readingMinutes } from './blogs.mjs';
import { products, solutions, enquiryUrl } from './data';
import { NotFound } from './Catalogue';
import './blogs.css';
const topicName = id => blogTopics.find(t => t.id === id)?.name;
function GuideTopics({ selected, onChange }) {
  const row = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = row.current;
    const update = () => setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    document.fonts.ready.then(update);
    update();
    return () => { observer.disconnect(); el.removeEventListener('scroll', update); };
  }, []);
  useEffect(() => {
    const el = row.current;
    const active = el.querySelector('[aria-pressed="true"]');
    const bounds = el.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < bounds.left + 4 || item.right > bounds.right - 4) {
      el.scrollBy({ left: item.left - bounds.left - (bounds.width - item.width) / 2, behavior: 'instant' });
    }
  }, [selected]);
  const scroll = direction => row.current.scrollBy({ left: direction * row.current.clientWidth * 0.7, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  return <div className="guide-topic-bar">
    <div className="guide-topics" ref={row} role="group" aria-label="Filter by topic">{[{id:'all', name:'All guides'}, ...blogTopics].map(t => <button key={t.id} aria-pressed={selected === t.id} onClick={() => onChange(t.id)}>{t.name}</button>)}</div>
    <div className="guide-topic-controls">
      <button type="button" aria-label="Scroll topics left" disabled={!edges.left} onClick={() => scroll(-1)}><ChevronLeft size={18}/></button>
      <button type="button" aria-label="Scroll topics right" disabled={!edges.right} onClick={() => scroll(1)}><ChevronRight size={18}/></button>
    </div>
  </div>;
}
function GuideCard({ article }) {
  return <article className="guide-card">
    <Link to={'/blogs/' + article.slug} className="guide-card-image" tabIndex={-1} aria-hidden="true"><img src={article.thumbnail} alt="" loading="lazy" width="600" height="400"/><span><ArrowUpRight size={22}/></span></Link>
    <div className="guide-card-copy"><p className="guide-meta">{topicName(article.topic)} <span>{readingMinutes(article)} min read</span></p><h2><Link to={'/blogs/' + article.slug}>{article.title}</Link></h2><p>{article.answer}</p><Link className="guide-text-link" to={'/blogs/' + article.slug}>Read guide <ArrowUpRight size={17}/></Link></div>
  </article>;
}
export function BlogIndex() {
  const [params, setParams] = useSearchParams();
  const query = params.get('search') || '';
  const topic = params.get('topic') || 'all';
  const selected = blogTopics.some(t => t.id === topic) ? topic : 'all';
  const filtered = blogs.filter(b => (selected === 'all' || b.topic === selected) && [b.title, b.answer, topicName(b.topic), ...b.productIds.map(id => products.find(p => p.id === id)?.name || '')].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const change = (key, value) => { const next = new URLSearchParams(params); value && value !== 'all' ? next.set(key, value) : next.delete(key); setParams(next, { replace: true }); };
  return <div className="guides-page wrap">
    <header className="guides-intro"><p className="eyebrow">GUIDES & ADVICE</p><h1>Know your surface.<br/><em>Build with confidence.</em></h1><p>Practical answers for waterproofing, tiling and repair. Understand the application, choose your materials and plan the work.</p><span className="guide-count">50 focused guides · 7 topics</span></header>
    <section className="guides-browser" aria-label="Browse guides">
      <div className="guides-search"><Search size={22}/><label className="sr-only" htmlFor="guide-search">Search guides</label><input id="guide-search" type="search" value={query} onChange={e=>change('search', e.target.value)} placeholder="Search a question, surface or product"/></div>
      <GuideTopics selected={selected} onChange={value => change('topic', value)}/>
      <div className="guide-results"><p role="status">{filtered.length} {filtered.length===1?'guide':'guides'}{selected!=='all'?' in '+topicName(selected):''}</p>{(query || selected!=='all') && <button onClick={()=>setParams({})}>Clear filters</button>}</div>
      {filtered.length ? <div className="guides-grid">{filtered.map(b=><GuideCard key={b.slug} article={b}/>)}</div> : <div className="guide-empty"><h2>No guides match your search.</h2><p>Try a surface such as roof or a product such as Aqualock.</p><button onClick={()=>setParams({})}>Show all guides</button></div>}
    </section>
  </div>;
}
export function BlogDetail() {
  const { slug } = useParams();
  const article = blogs.find(b=>b.slug===slug);
  if (!article) return <NotFound/>;
  const relevant = article.productIds.map(id=>products.find(p=>p.id===id));
  const solution = solutions.find(s=>s.id===article.solution);
  return <div className="guide-detail wrap">
    <nav className="guide-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/blogs">Guides & advice</Link><span>/</span><span>{topicName(article.topic)}</span></nav>
    <header className="guide-heading"><p className="eyebrow">{topicName(article.topic)}</p><h1>{article.title}</h1><div className="guide-byline"><span>TruBuild</span><time dateTime={article.date}>9 October 2026</time><span>{readingMinutes(article)} min read</span></div></header>
    <div className="guide-layout"><article className="guide-body">
      <figure className="guide-cover"><img src={article.image} alt={article.imageAlt} width="1200" height="800" fetchPriority="high"/></figure>
      <div className="guide-answer"><span className="eyebrow">THE SHORT ANSWER</span><p>{article.answer}</p></div>
      {article.sections.map(([title, text], i)=><section id={'section-'+(i+1)} key={title}><h2>{title}</h2><p>{text}</p></section>)}
      <section className="guide-checklist" id="checklist"><h2>Before you start</h2><ul>{article.checklist.map(item=><li key={item}><Check size={20}/><span>{item}</span></li>)}</ul></section>
      <section id="question" className="guide-faq"><p className="eyebrow">A COMMON QUESTION</p><h2>{article.question}</h2><p>{article.response}</p></section>
      <section id="products"><h2>Products to explore</h2><p>Check the application scope and current technical instructions for your surface before specifying.</p><div className="guide-products">{relevant.map(p=><Link to={'/products/'+p.id} key={p.id}><img src={p.image} alt={p.name+' product pack'} width="120" height="140" loading="lazy"/><div><h3>{p.name}</h3><p>{p.subtitle || p.description}</p><span>Product details & TDS <ArrowUpRight size={16}/></span></div></Link>)}</div></section>
      <section className="guide-references"><h2>Technical references</h2><p>This guide draws on the product information and supplied technical documents maintained in the TruBuild catalogue. The full TDS sets the application requirements.</p><ul>{relevant.map(p=><li key={p.id}><Link to={'/products/'+p.id}>{p.name} — {p.tdsStatus==='replacement-pending'?'product information; request current TDS':'product information and technical data'}</Link></li>)}</ul><Link className="guide-text-link" to={'/solutions/'+solution.id}>Explore {solution.name.toLowerCase()} <ArrowUpRight size={17}/></Link></section>
    </article><aside className="guide-sidebar"><div className="guide-sidebar-inner"><p className="eyebrow">IN THIS GUIDE</p><nav aria-label="In this guide">{article.sections.map(([title],i)=><a href={'#section-'+(i+1)} key={title}>{title}</a>)}<a href="#checklist">Before you start</a><a href="#products">Products to explore</a></nav><Link className="guide-enquiry" to={enquiryUrl(relevant.map(p=>p.name).join(', '), article.title)}>Discuss your application <ArrowUpRight size={18}/></Link></div></aside></div>
    <section className="guide-related"><div className="guide-related-heading"><div><p className="eyebrow">KEEP EXPLORING</p><h2>More useful answers.</h2></div><Link to="/blogs" className="guide-text-link">All guides <ArrowUpRight size={18}/></Link></div><div className="guides-grid">{relatedBlogs(article).map(b=><GuideCard key={b.slug} article={b}/>)}</div></section>
    <Link className="guide-back" to="/blogs"><ArrowLeft size={18}/> Back to guides & advice</Link>
  </div>;
}
