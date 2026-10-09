import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { solutions, featured, products } from "./data";

const featuredSummaries = {
  "trubuild-rooftect-advanced":
    "PU-acrylate waterproof coating for exposed roofs.",
  "trubuild-aqualock-flexi":
    "Flexible cementitious waterproofing for concrete and masonry.",
  "trufix-110": "Cement-based grey tile adhesive for interior floors.",
};

const scenes = [
  { id: "roof", label: "Roof Waterproofing", image: "/images/hero-roof-coating.webp",
    lead: "Your roof.", accent: "Protected.", productId: "trubuild-rooftect-advanced",
    detail: "A seamless waterproof coating for exposed roofs and terraces." },
  { id: "tiling", label: "Interior Flooring", image: "/images/hero-interior-floor.webp",
    lead: "Your tiles.", accent: "Better bonded.", productId: "trufix-110",
    detail: "Grey cement-based tile adhesive for interior floors." },
  { id: "exterior", label: "Exterior Waterproofing", image: "/images/hero-exterior-home-v3.webp",
    lead: "Your walls.", accent: "Protected.", productId: "trubuild-walltect-top-coat",
    detail: "Waterproof protection for exterior walls." },
].map(scene => ({ ...scene, product: products.find(p => p.id === scene.productId) }));
export default function Home() {
  const [scene, setScene] = useState(0);
  const heroRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setPaused(motion.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion(); updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(heroRef.current);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);
  const playing = !paused && !hovered && !focused && visible && pageVisible;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setScene(current => (current + 1) % scenes.length), 6000);
    return () => window.clearTimeout(timer);
  }, [scene, playing]);
  const active = scenes[scene];
  const touchStart = useRef(null);
  const changeScene = (direction) => setScene(current => (current + direction + scenes.length) % scenes.length);
  return (
    <div className="new-home">
      <section ref={heroRef} className="product-hero" aria-label="TruBuild products and applications"
        onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={event => {
          if (!touchStart.current) return;
          const dx = event.changedTouches[0].clientX - touchStart.current.x;
          const dy = event.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) changeScene(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}>
        <div className="product-hero-background" aria-hidden="true">
          {scenes.map((item, index) => <img key={item.id} src={item.image} alt=""
            className={scene === index ? "is-active" : ""} fetchPriority={index === 0 ? "high" : "auto"} />)}
        </div>
        <div className="product-hero-stage">
          <div className="product-hero-copy" key={active.id} aria-live={playing ? "off" : "polite"} aria-atomic="true">
            <p className="product-hero-eyebrow">TRUBUILD / {active.label}</p>
            <h1>{active.lead}{" "}<br /><span>{active.accent}</span></h1>
            <p className="product-hero-description">{active.detail}</p>
            <div className="product-hero-actions">
            <Link className="product-hero-cta" to={"/products/" + active.product.id}>
              Explore {active.product.name} <ArrowUpRight size={20} />
            </Link>
            <Link className="product-hero-solution" to={"/solutions/" + active.id}>Explore the application <ArrowUpRight size={20} /></Link>
            </div>
          </div>
          <div className="product-hero-display">
            <div className="product-hero-halo" aria-hidden="true" />
            {scenes.map((item, index) => <img key={item.id} src={item.product.image}
              className={scene === index ? "is-active" : ""} width="500" height="500"
              alt={scene === index ? item.product.name + " official packaging" : ""}
              aria-hidden={scene !== index} />)}
            <span className="product-hero-caption">{active.product.name}</span>
          </div>
        </div>
        <div className="product-hero-navigation">
          <div className="product-hero-selectors" role="group" aria-label="Choose a featured product">
            {scenes.map((item, index) => <button key={item.id} type="button" aria-pressed={scene === index}
              onClick={() => setScene(index)}>
              <img src={item.product.image} alt="" width="48" height="48" />
              <span><small>{item.label}</small><strong>{item.product.name}</strong></span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>)}
          </div>
          <div className="product-hero-arrows">
            <button type="button" aria-label={paused ? "Start slideshow" : "Pause slideshow"} onClick={() => setPaused(value => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
            <button type="button" aria-label="Previous featured product" onClick={() => changeScene(-1)}><ChevronLeft size={20} /></button>
            <button type="button" aria-label="Next featured product" onClick={() => changeScene(1)}><ChevronRight size={20} /></button>
          </div>
        </div>
      </section>
      <section className="build-index" id="solutions">
        <div className="index-top">
          <span className="mono-label">FIND YOUR APPLICATION</span>
          <ArrowDown size={28} />
        </div>
        <div className="index-intro">
          <h2>
            Solutions for
            <br />
            <span className="headline-highlight">every space.</span>
          </h2>
          <p>
            From the first layer to the final finish.
            <br />
            Find a solution for the space you’re building.
          </p>
        </div>
        <div className="application-mosaic">
          {solutions.map((s) => (
            <Link
              key={s.id}
              to={"/solutions/" + s.id}
              className={"application-tile tile-" + s.id}
            >
              <img
                src={s.image}
                alt={s.imageAlt}
                loading="lazy"
              />
              <span className="application-tile-arrow">
                <ArrowUpRight size={21} />
              </span>
              <div className="application-tile-copy">
                <h3>{s.name}</h3>
                <p>{s.summary}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="index-foot">
          <span>Not sure where to begin?</span>
          <Link to="/advisor">
            Let’s find your product <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
      <section className="product-edit">
        <div className="edit-heading">
          <div>
            <span className="mono-label">THE MATERIAL DIFFERENCE</span>
            <h2>
              Find the
              <br />
              <span className="headline-highlight">right product.</span>
            </h2>
          </div>
          <Link className="text-link" to="/products">
            All products <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-lineup">
          {featured.map((p) => (
            <Link className="specimen" to={"/products/" + p.id} key={p.id}>
              <div className="specimen-top">
                <span>{p.category}</span>
                <span className="specimen-arrow">
                  <ArrowUpRight size={22} />
                </span>
              </div>
              <div className="specimen-image">
                <img
                  src={p.image}
                  alt={p.name + " official packaging"}
                  loading="lazy"
                />
              </div>
              <div className="specimen-bottom">
                <h3>{p.name.replace(/^TruBuild /i, "")}</h3>
                <p>{featuredSummaries[p.id]}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="advisor-studio">
        <div className="studio-visual">
          <img
            src="/images/architecture.webp"
            alt="Illustrative architectural courtyard"
            loading="lazy"
          />
          <span>EVERY LAYER COUNTS.</span>
        </div>
        <div className="studio-copy">
          <span className="mono-label">YOUR NEXT MOVE</span>
          <h2>
            Tell us about
            <br />
            <em>your project.</em>
          </h2>
          <p>
            Tell us about your surface, your space and your plans. The TruBuild
            Product Advisor helps you narrow down the options.
          </p>
          <Link to="/advisor" className="studio-cta">
            Find my solution <ArrowUpRight size={28} />
          </Link>
          <span className="studio-note">
            Guided selection. Clear reasons. Technical support when you need it.
          </span>
        </div>
      </section>
      <section
        className="discovery-panels"
        aria-label="Resources and our story"
      >
        <Link to="/resources" className="discovery-panel discovery-resources">
          <div className="discovery-copy">
            <span className="mono-label">THE RESOURCE LIBRARY</span>
            <h2>
              Build with
              <br />
              <span className="headline-highlight">confidence.</span>
            </h2>
            <p>
              Specifications, application guides and product data. Ready when
              you need them.
            </p>
            <span className="discovery-action">
              Explore resources <ArrowUpRight size={20} />
            </span>
          </div>
          <div className="document-art" aria-hidden="true">
            <div className="document-sheet sheet-back" />
            <div className="document-sheet sheet-front">
              <span className="document-brand">TRUBUILD</span>
              <span className="document-title">
                The technical
                <br />
                collection.
              </span>
              <div className="document-lines">
                <i />
                <i />
                <i />
              </div>
              <span className="document-format">
                DATA SHEETS & GUIDES <ArrowUpRight size={18} />
              </span>
            </div>
          </div>
        </Link>
        <Link to="/about" className="discovery-panel discovery-brand">
          <div className="discovery-copy">
            <span className="mono-label">PART OF ASTRAL</span>
            <h2>
              Get to know
              <br />
              <span className="headline-yellow">TruBuild.</span>
            </h2>
            <p>
              Meet TruBuild. Protection, preparation and finishing solutions for
              the spaces we share.
            </p>
            <span className="discovery-action">
              Our story <ArrowUpRight size={20} />
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
