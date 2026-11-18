import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Columns2 } from 'lucide-react';
import './home-visualizer.css';

export default function HomeVisualizer() {
  const section = useRef(null);
  const canvas = useRef(null);
  const [position, setPosition] = useState(48);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      try {
        const { renderRoom, rooms, defaultFinish } = await import('./visualizerEngine.mjs');
        const photo = new Image();
        photo.src = rooms[0].image;
        await photo.decode();
        if (cancelled || !canvas.current) return;
        canvas.current.width = 1200;
        canvas.current.height = Math.round(1200 * photo.naturalHeight / photo.naturalWidth);
        renderRoom(canvas.current, photo, rooms[0], {
          floor: { ...defaultFinish(), material: 'concrete', shade: 5, width: 4 },
          wall: null,
        });
        setReady(true);
      } catch {
        // The original room and studio link remain usable if rendering fails.
      }
    }, { rootMargin: '300px' });
    observer.observe(section.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, []);
  return (
    <section className="home-visualizer" ref={section} aria-labelledby="home-visualizer-title">
      <div className="home-visualizer-copy">
        <span className="mono-label">SEE IT IN YOUR SPACE</span>
        <h2 id="home-visualizer-title">See the finish<br />before you <em>choose.</em></h2>
        <p>Explore tile finishes, grout colours and layouts in a sample room—or your own photo.</p>
        <Link to="/visualizer" className="home-visualizer-cta">Try the visualizer <ArrowUpRight size={20} /></Link>
        <span className="home-visualizer-note">Your space. Your finish. A clearer choice.</span>
      </div>
      <div className="home-visualizer-demo">
        <div className="home-visualizer-image">
          <img src="/images/hero-interior-floor.webp" alt="Living room with the original warm stone floor" loading="lazy" width="1672" height="941" />
          <canvas ref={canvas} role="img" aria-label="Living room with concrete tiles and charcoal grout" style={{ clipPath: `inset(0 0 0 ${position}%)`, visibility: ready ? 'visible' : 'hidden' }} />
          {ready && <>
            <span className="home-visualizer-label original">Original</span>
            <span className="home-visualizer-label changed">With your finish</span>
            <div className="home-visualizer-divider" style={{ left: `${position}%` }}><span><Columns2 size={20} /></span></div>
            <input type="range" min="0" max="100" value={position} onChange={event => setPosition(Number(event.target.value))} aria-label="Compare original room and visualized finish" aria-valuetext={`${position}% original room`} />
          </>}
        </div>
        <div className="home-visualizer-caption"><span>{ready ? 'Drag to explore the difference' : 'Explore your room in the studio'}</span><span>Illustrative finishes</span></div>
      </div>
    </section>
  );
}
