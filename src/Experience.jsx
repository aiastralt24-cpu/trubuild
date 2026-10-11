import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ArrowRight, Pause, Play } from 'lucide-react';
import './experience.css';

const chapters = [
  { name: 'The building', title: <>Protection<br/>in every<br/>{' '}<em>layer.</em></>, description: 'A closer look at the roof above you.' },
  { name: 'Beneath the surface', title: <>What you<br/>don’t see.<br/>{' '}<em>Matters.</em></>, description: 'A roof is a system. Each layer has a role to play.' },
  { name: 'Ready for the elements', title: <>Designed<br/>as a whole.<br/>{' '}<em>For a reason.</em></>, description: 'Exposure, drainage and the final finish all shape the right waterproofing system.' },
];
export default function Experience() {
  const story = useRef(null), viewport = useRef(null), engine = useRef(null), progress = useRef(0);
  const [active, setActive] = useState(0), [ready, setReady] = useState(false), [fallback, setFallback] = useState(false);
  const [reduced, setReduced] = useState(false), [paused, setPaused] = useState(false);
  const still = reduced || paused;
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update(); mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    let cancelled = false;
    import('./experienceScene.js').then(({ createExperienceScene }) => {
      if (cancelled) return;
      try {
        engine.current = createExperienceScene(viewport.current, () => { setReady(false); setFallback(true); });
        engine.current.set(progress.current, true);
        setReady(true);
      } catch { setFallback(true); }
    }).catch(() => { if (!cancelled) setFallback(true); });
    return () => { cancelled = true; engine.current?.dispose(); engine.current = null; };
  }, []);
  useEffect(() => {
    let frame;
    const update = () => {
      frame = null;
      if (still) { engine.current?.set(progress.current, true); return; }
      const el = story.current;
      const p = Math.max(0, Math.min(1, -el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - innerHeight)));
      progress.current = p; setActive(Math.round(p * 2)); engine.current?.set(p, false);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [still, ready]);
  function chapter(index) {
    progress.current = index / 2; setActive(index);
    if (still) engine.current?.set(index / 2, true);
    else window.scrollTo({ top: story.current.offsetTop + index / 2 * (story.current.offsetHeight - innerHeight), behavior: 'smooth' });
  }
  function toggleMotion() {
    const p = active / 2;
    progress.current = p;
    setPaused(value => !value);
    requestAnimationFrame(() => window.scrollTo({ top: story.current.offsetTop + (!paused && !reduced ? 0 : p * (story.current.offsetHeight - innerHeight)), behavior: 'instant' }));
  }
  return <div className={`experience${still ? ' exp-still' : ''}`}>
    <a href="#experience-details" className="exp-skip">Skip the animation</a>
    <section ref={story} className="exp-story" aria-label="Explore the roof system">
      <div className="exp-stage" data-chapter={active}>
        <header className="exp-header"><Link to="/" className="exp-brand" aria-label="TruBuild home"><span>TRU</span>BUILD</Link><Link to="/">Back to website <ArrowUpRight size={20}/></Link></header>
        <div className="exp-scene" ref={viewport} role="img" aria-label="Illustrative three-dimensional concrete house. The roof separates into structural slab, waterproofing layer and protective finish.">
          {!ready && <img className="exp-poster" src={active === 1 ? "/images/experience/roof-layers.webp" : "/images/experience/roof-poster.webp"} alt=""/>}
        </div>
        <div className="exp-copy">
          {chapters.map((c, i) => <div key={c.name} className={`exp-copy-panel ${active === i ? 'is-active' : ''}`} aria-hidden={active !== i}>
            {i === 0 ? <h1>{c.title}</h1> : <h2>{c.title}</h2>}
            <p>{c.description}</p>
            {i === 0 && <button className="exp-explore" onClick={() => chapter(1)} tabIndex={active === i ? 0 : -1}><ArrowDown size={29}/><span>{still ? 'Explore the layers' : 'Scroll to explore'}</span></button>}
            {i === 1 && <ol className="exp-layer-key"><li><span className="exp-dot finish"/>Protective finish</li><li><span className="exp-dot membrane"/>Waterproofing layer</li><li><span className="exp-dot slab"/>Structural slab</li></ol>}
            {i === 2 && <Link className="exp-text-link" to="/solutions/roof" tabIndex={active === i ? 0 : -1}>Explore roof solutions <ArrowUpRight size={20}/></Link>}
          </div>)}
        </div>
        <div className="exp-scene-note">An illustrative roof system.<br/><span>Layers and colour are shown for clarity.</span></div>
        <div className="exp-motion"><button onClick={toggleMotion} disabled={reduced} aria-pressed={still}>{still ? <Play size={14}/> : <Pause size={14}/>} {reduced ? 'Reduced motion' : paused ? 'Enable motion' : 'Pause motion'}</button>{fallback && <span>Static view</span>}</div>
        <nav className="exp-chapters" aria-label="Experience chapters">{chapters.map((c,i)=><button key={c.name} onClick={()=>chapter(i)} aria-current={active===i?'step':undefined}><span className="exp-chapter-number">0{i+1}</span><span>{c.name}</span><span className="exp-chapter-line"/></button>)}</nav>
      </div>
    </section>
    <section id="experience-details" className="exp-details">
      <div className="exp-details-heading"><span>BUILT AS A SYSTEM</span><h2>Good protection.<br/>{' '}<em>Considered together.</em></h2></div>
      <div className="exp-details-copy"><p>The surface, the waterproofing and the finish work as a complete build-up. The right specification starts with understanding your roof.</p><p className="exp-disclaimer">This is a conceptual illustration of a protected roof, not an installation detail or a performance test. Actual layers, thicknesses, curing and protection depend on the selected system. Check its current technical data sheet.</p><div className="exp-actions"><Link to="/solutions/roof">Find your roof system <ArrowUpRight size={20}/></Link><Link to="/advisor">Try the Product Advisor <ArrowRight size={18}/></Link></div></div>
    </section>
    <footer className="exp-footer"><span>TRUBUILD · BUILT FOR LIFE</span><Link to="/">Return to the website <ArrowUpRight size={16}/></Link><span>Experience / 01</span></footer>
  </div>;
}
