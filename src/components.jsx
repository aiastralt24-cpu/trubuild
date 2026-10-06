import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Menu,
  X,
  Plus,
  Check,
  MoveRight,
  FileDown,
} from "lucide-react";
import { solutions, shortDescription } from "./data";
export { ArrowUpRight, ArrowRight, Check, FileDown };
export function Button({ to, children, variant = "", ...props }) {
  return to ? (
    <Link className={"button " + variant} to={to} {...props}>
      {children}
      <ArrowUpRight size={18} />
    </Link>
  ) : (
    <button className={"button " + variant} {...props}>
      {children}
      <ArrowRight size={18} />
    </button>
  );
}
export function Header() {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef();
  const location = useLocation(),
    navigate = useNavigate();
  const [q, setQ] = useState("");
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 45);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    dialog.current?.close();
    document.body.style.overflow = "";
  }, [location.pathname, location.search]);
  function open() {
    setMenuOpen(true);
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
  }
  function close() {
    setMenuOpen(false);
    dialog.current.close();
    document.body.style.overflow = "";
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {location.pathname !== "/" && <div className="header-spacer" aria-hidden="true" />}
      <header className={`header${compact ? " compact" : ""}${location.pathname === "/" ? " header-home" : ""}`}>
        <Link to="/" className="logo" aria-label="TruBuild home">
          <img src="/images/wordmark-clean.webp" alt="TruBuild" />
        </Link>
        <span className="header-brandline">Construction solutions</span>
        <div className="header-actions">
          <Link to="/advisor" className="header-cta">
            Find a product
          </Link>
          <button
            className="menu-trigger header-menu"
            onClick={open}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <Menu size={19} />
          </button>
        </div>
      </header>
      <dialog
        ref={dialog}
        className="full-menu"
        aria-label="Site navigation"
        onClose={() => {
          setMenuOpen(false);
          document.body.style.overflow = "";
        }}
      >
        <div className="menu-top">
          <Link
            className="logo"
            to="/"
            onClick={close}
            aria-label="TruBuild home"
          >
            <img src="/images/wordmark-clean.webp" alt="TruBuild" />
          </Link>
          <button className="menu-trigger" onClick={close} autoFocus>
            Close <X />
          </button>
        </div>
        <div className="menu-body">
          <div>
            <p className="eyebrow">EXPLORE TRUBUILD</p>
            {[
              ["/", "Home"],
              ["/solutions", "Solutions"],
              ["/products", "Products"],
              ["/advisor", "Product Advisor"],
              ["/about", "About us"],
              ["/resources", "Resources"],
            ].map(([to, label]) => (
              <Link className="menu-nav-item" to={to} key={to} onClick={close}>
                {label}
                <ArrowUpRight />
              </Link>
            ))}
          </div>
          <aside>
            <form
              className="menu-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate("/products?search=" + encodeURIComponent(q));
                close();
              }}
            >
              <label htmlFor="menu-search">Find a product or solution</label>
              <div className="search-box">
                <Search />
                <input
                  id="menu-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Try roof, tile or Aqualock"
                />
                <button type="submit" aria-label="Search">
                  <ArrowRight />
                </button>
              </div>
            </form>
            <div className="menu-image">
              <img
                src="/images/architecture.webp"
                alt="Illustrative contemporary concrete architecture"
              />
              <span>Built for life.</span>
            </div>
            <Button to="/contact" onClick={close}>
              Start a business enquiry
            </Button>
            <a href="tel:18003099393" className="menu-phone">
              1800 309 9393
            </a>
          </aside>
        </div>
      </dialog>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <h2>
          Let’s build something
          <br />
          that <em>lasts.</em>
        </h2>
        <Button to="/contact" variant="light">
          Talk to our team
        </Button>
      </div>
      <div className="footer-grid">
        <div>
          <div className="logo">
            <img src="/images/wordmark-clean.webp" alt="TruBuild" />
          </div>
          <p>
            Advanced waterproofing.
            <br />
            Tiling & grouting. Built to perform.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/solutions">Our solutions</Link>
          <Link to="/products">Product catalogue</Link>
          <Link to="/advisor">Product Advisor</Link>
        </div>
        <div>
          <h3>TruBuild</h3>
          <Link to="/about">About us</Link>
          <Link to="/resources">Technical resources</Link>
          <Link to="/contact">Contact & enquiries</Link>
        </div>
        <div>
          <h3>Here to help</h3>
          <a href="tel:18003099393">1800 309 9393</a>
          <a href="mailto:customercare@astraladhesives.com">
            customercare@astraladhesives.com
          </a>
          <p>
            ‘Astral House’, 207/1, Behind Rajpath Club,
            <br />
            Off S.G. Highway, Ahmedabad 380059.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Astral TruBuild. A brand of Astral Limited.</span>
        <span>
          <a
            href="https://www.trubuild.in/privacy-policy/"
            target="_blank"
            rel="noreferrer"
          >
            Privacy policy ↗
          </a>
          <Link to="/sources">Content & image credits</Link>
        </span>
      </div>
    </footer>
  );
}
export function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {items.map((x, i) => (
        <React.Fragment key={i}>
          <span>/</span>
          {x.to ? (
            <Link to={x.to}>{x.label}</Link>
          ) : (
            <span aria-current="page">{x.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
export function PageIntro({ title, accent, description, eyebrow, children }) {
  return (
    <section className="page-intro">
      <div className="wrap">
        <Breadcrumb items={[{ label: eyebrow || title }]} />
        <div className="intro-row">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>
              {title}
              {accent && (
                <>
                  <br />
                  <em>{accent}</em>
                </>
              )}
            </h1>
          </div>
          <div className="intro-side">
            <p>{description}</p>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
export function AdvisorBanner() {
  return (
    <section className="advisor-banner">
      <div>
        <span className="eyebrow">THE TRUBUILD PRODUCT ADVISOR</span>
        <h2>
          The right product.
          <br />
          Without the guesswork.
        </h2>
        <p>
          Tell us what you’re working on. We’ll help you explore your options.
        </p>
      </div>
      <Button to="/advisor" variant="light">
        Find my solution
      </Button>
    </section>
  );
}
export function ProductCard({ product: p, compare, toggle }) {
  return (
    <article className="product-card">
      <Link className="product-media" to={"/products/" + p.id}>
        <span className="product-brand">ASTRAL TRUBUILD</span>
        <img
          loading="lazy"
          src={p.image}
          alt={"TruBuild " + p.name + " official packaging"}
        />
        <span className="circle-arrow">
          <ArrowUpRight size={22} />
        </span>
      </Link>
      <div className="product-info">
        <p className="eyebrow">{p.category}</p>
        <Link to={"/products/" + p.id}>
          <h3>{p.name}</h3>
        </Link>
        <p className="product-desc">{shortDescription(p)}</p>
        {toggle && (
          <button
            className={"compare-toggle " + (compare ? "selected" : "")}
            onClick={() => toggle(p.id)}
            aria-pressed={!!compare}
          >
            {compare ? <Check size={15} /> : <Plus size={15} />}{" "}
            {compare ? "Added to comparison" : "Compare product"}
          </button>
        )}
      </div>
    </article>
  );
}
export function ProductGrid({ items, compare = [], toggle }) {
  return (
    <div className="product-grid">
      {items.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          compare={compare.includes(p.id)}
          toggle={toggle}
        />
      ))}
    </div>
  );
}
export function SolutionCard({ solution: s }) {
  return (
    <Link
      to={"/solutions/" + s.id}
      className={"solution-card solution-" + s.id}
    >
      <img loading="lazy" src={s.image || "/images/architecture.webp"} alt="" />
      <div className="solution-shade" />
      <div className="solution-top">
        <ArrowUpRight />
      </div>
      <div className="solution-bottom">
        <h3>{s.name}</h3>
        <p>{s.summary}</p>
      </div>
    </Link>
  );
}
