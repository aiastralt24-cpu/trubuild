import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { solutions, featured } from "./data";

const featuredSummaries = {
  "trubuild-rooftect-advanced":
    "PU-acrylate waterproof coating for exposed roofs.",
  "trubuild-aqualock-flexi":
    "Flexible cementitious waterproofing for concrete and masonry.",
  "trufix-110": "Cement-based grey tile adhesive for interior floors.",
};

const scenes = [
  {
    title: "Above it all.",
    label: "Roof & terrace",
    image: "/images/roof.webp",
    id: "roof",
    detail: "Protection for your most exposed spaces.",
  },
  {
    title: "Every detail.",
    label: "Tiling & grouting",
    image: "/images/tiles.webp",
    id: "tiling",
    detail: "Beautiful surfaces begin with the right foundation.",
  },
  {
    title: "Beyond the surface.",
    label: "Exterior walls",
    image: "/images/architecture.webp",
    id: "exterior",
    detail: "Prepare and protect the face of your building.",
  },
];
export default function Home() {
  const [scene, setScene] = useState(0);
  const active = scenes[scene];
  return (
    <div className="new-home">
      <section
        className="space-hero"
        aria-label="TruBuild construction solutions"
      >
        <div className="space-images" aria-hidden="true">
          {scenes.map((s, i) => (
            <img
              key={s.id}
              data-scene={s.id}
              src={s.image}
              alt=""
              className={scene === i ? "is-active" : ""}
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          ))}
        </div>
        <div className="space-shade" />
        <div className="space-topline">
          <span>TRUBUILD / CONSTRUCTION SOLUTIONS</span>
        </div>
        <div className="space-headline">
          <h1>
            Built to <span className="hero-word-accent">protect.</span>
            <br />
            Made to <span className="hero-word-accent">last.</span>
          </h1>
        </div>
        <div className="space-bottom">
          <div className="scene-note" aria-live="polite">
            <span>IN YOUR ELEMENT</span>
            <h2>{active.title}</h2>
            <Link to={"/solutions/" + active.id}>
              {active.detail} <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="scene-switch" aria-label="Explore application scenes">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setScene(i)}
                aria-pressed={scene === i}
              >
                <span>{s.label}</span>
                <Plus size={16} />
              </button>
            ))}
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
                src={
                  ["roof", "tiling", "exterior"].includes(s.id)
                    ? s.image
                    : `/images/application-${s.id}.webp`
                }
                alt=""
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
          <small>AI architectural concept</small>
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
          <img
            src="/images/about.avif"
            alt="TruBuild brand imagery"
            loading="lazy"
          />
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
