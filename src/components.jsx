import { searchIndex } from "./searchData";
import { search } from "./searchEngine.mjs";
import "./navigation.css";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Plus,
  Minus,
  Menu,
  X,
  Check,
  Columns2,
  Facebook,
  Instagram,
  Youtube,
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
const menuSections = [
  {
    id: "products",
    label: "Products",
    title: "Explore products",
    description: "Find the right material for every stage of your build.",
    links: [
      ["Roof waterproofing", "/products?application=Roof%20Waterproofing"],
      ["Tile adhesives", "/products?category=Cementitious%20Tile%20Adhesives"],
      ["Cementitious grouts", "/products?category=Cementitious%20Grouts"],
      ["Epoxy grouts", "/products?category=Epoxy%20Tile%20Grouts"],
      ["Repair & bonding", "/products?application=Concrete%20and%20Mortar"],
      ["Sealants", "/products?category=Professional%20Sealants"],
      ["Protective coatings", "/products?category=Protective%20Coatings"],
      ["Sheet membranes", "/products?category=Sheet%20Membranes"],
    ],
    more: [
      ["View all products", "/products"],
      ["Compare products", "/compare"],
    ],
  },
  {
    id: "applications",
    label: "Applications",
    title: "Start with your space",
    description:
      "Explore solutions for the surface and conditions you are working with.",
    links: solutions.map((item) => [item.name, "/solutions/" + item.id]),
    more: [["View all applications", "/solutions"]],
  },
  {
    id: "tools",
    label: "Tools & Resources",
    title: "Plan with confidence",
    description:
      "Visualise your finish, estimate quantities and find technical guidance.",
    links: [
      ["Tile & grout studio", "/visualizer"],
      ["Project calculator", "/calculator"],
      ["Technical data sheets", "/resources"],
      ["Guides & advice", "/blogs"],
      ["Product comparison", "/compare"],
      ["Product advisor", "/advisor"],
    ],
  },
  {
    id: "about",
    label: "About TruBuild",
    title: "Built for life",
    description:
      "Discover TruBuild and the construction solutions behind your next project.",
    links: [
      ["Our story", "/about"],
      ["Explore TruBuild", "/"],
      ["Our product range", "/products"],
    ],
  },
  {
    id: "contact",
    label: "Contact",
    title: "Let’s talk about your project",
    description:
      "Get help with product selection, application guidance or an enquiry.",
    links: [
      ["Start an enquiry", "/contact"],
      ["Product guidance", "/advisor"],
    ],
  },
];
function MenuSectionLinks({ section, close }) {
  return (
    <>
      <p className="eyebrow">{section.title}</p>
      <p className="menu-panel-description">{section.description}</p>
      <div className="menu-category-links">
        {section.links.map(([label, to]) => (
          <Link key={label} to={to} onClick={close}>
            {label}
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </div>
      {section.more && (
        <div className="menu-panel-more">
          {section.more.map(([label, to]) => (
            <Link key={label} to={to} onClick={close}>
              {label}
              <ArrowRight size={17} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
export function Header() {
  const [compact, setCompact] = useState(false);
  const [context, setContext] = useState("Construction solutions");
  const headerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef();
  const location = useLocation(),
    navigate = useNavigate();
  const [q, setQ] = useState("");
  const menuMatches = useMemo(
    () =>
      menuOpen && q.trim().length >= 2
        ? search(searchIndex, q, { limit: 4 }).results
        : [],
    [menuOpen, q],
  );
  const [activeSection, setActiveSection] = useState("products");
  useEffect(() => {
    let frame;
    const update = () => {
      setCompact(window.scrollY > 45);
      const distance =
        document.documentElement.scrollHeight - window.innerHeight;
      headerRef.current?.style.setProperty(
        "--header-progress",
        `${distance > 0 ? Math.min(100, (window.scrollY / distance) * 100) : 0}%`,
      );
      let label = location.pathname.startsWith("/products")
        ? "Our products"
        : location.pathname.startsWith("/solutions")
          ? "Our solutions"
          : location.pathname.startsWith("/resources")
            ? "Technical resources"
            : location.pathname.startsWith("/about")
              ? "About TruBuild"
              : location.pathname.startsWith("/contact")
                ? "Let’s talk"
                : "Construction solutions";
      if (location.pathname === "/") {
        for (const [selector, title] of [
          [".build-index", "Our solutions"],
          [".product-edit", "Our products"],
          [".advisor-studio", "Find your product"],
        ]) {
          const section = document.querySelector(selector);
          if (section && section.getBoundingClientRect().top <= 180)
            label = title;
        }
      }
      setContext(label);
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, [location.pathname]);
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
      {location.pathname !== "/" && (
        <div className="header-spacer" aria-hidden="true" />
      )}
      <header
        ref={headerRef}
        className={`header${compact ? " compact" : ""}${location.pathname === "/" ? " header-home" : ""}`}
      >
        <Link to="/" className="logo" aria-label="TruBuild home">
          <img src="/images/wordmark-clean.webp" alt="TruBuild" />
        </Link>
        <span className="header-brandline">{context}</span>
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
        className="full-menu menu-refined menu-expandable"
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
          <form
            className="menu-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/search?q=" + encodeURIComponent(q.trim()));
              close();
            }}
          >
            <label className="menu-search-label" htmlFor="menu-search">
              Search products or applications
            </label>
            <div className="search-box">
              <Search size={19} />
              <input
                id="menu-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products or applications"
              />
              <button type="submit" aria-label="Search">
                <ArrowRight size={19} />
              </button>
            </div>
            {menuMatches.length > 0 && (
              <div
                className="menu-search-suggestions"
                aria-label="Search suggestions"
              >
                {menuMatches.map((r) => (
                  <Link
                    key={r.id}
                    to={
                      r.type === "Documents"
                        ? "/search?q=" +
                          encodeURIComponent(r.title.split(" · ")[0] + " tds")
                        : r.href
                    }
                    onClick={close}
                  >
                    <span>{r.title}</span>
                    <small>{r.type}</small>
                  </Link>
                ))}
                <Link
                  className="menu-all-results"
                  to={"/search?q=" + encodeURIComponent(q.trim())}
                  onClick={close}
                >
                  See all results <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </form>
          <button className="menu-trigger" onClick={close} autoFocus>
            Close <X />
          </button>
        </div>
        <div className="menu-body">
          <nav className="menu-primary" aria-label="Main navigation">
            {menuSections.map((section) => (
              <div className="menu-section" key={section.id}>
                <button
                  className="menu-section-trigger"
                  onClick={() =>
                    setActiveSection(
                      activeSection === section.id ? null : section.id,
                    )
                  }
                  aria-expanded={activeSection === section.id}
                  aria-controls={"menu-panel-" + section.id}
                  id={"menu-section-" + section.id}
                >
                  {section.label}
                  {activeSection === section.id ? (
                    <Minus size={23} />
                  ) : (
                    <Plus size={23} />
                  )}
                </button>
                <div
                  id={"menu-panel-" + section.id}
                  className="menu-section-panel"
                  hidden={activeSection !== section.id}
                  role="region"
                  aria-labelledby={"menu-section-" + section.id}
                >
                  <MenuSectionLinks section={section} close={close} />
                </div>
              </div>
            ))}
          </nav>
          <div className="menu-advisor-area">
            <Link to="/advisor" onClick={close} className="menu-advisor">
              <span>
                <strong>Find your product</strong>
                <small>A little guidance. The right choice.</small>
              </span>
              <ArrowUpRight size={24} />
            </Link>
          </div>
        </div>
        <div className="menu-bottom">
          <a href="mailto:customercare@astraladhesives.com">
            customercare@astraladhesives.com
          </a>
          <a href="tel:18003099393">
            1800 309 9393 <ArrowUpRight size={14} />
          </a>
          <Link to="/contact" onClick={close}>
            Start an enquiry <ArrowUpRight size={14} />
          </Link>
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
          <nav className="footer-social" aria-label="Follow TruBuild">
            {[
              ["Facebook", "https://www.facebook.com/astraltrubuild", Facebook],
              [
                "Instagram",
                "https://www.instagram.com/astral_trubuild/",
                Instagram,
              ],
              ["YouTube", "https://www.youtube.com/@AstralTrubuild", Youtube],
            ].map(([name, href, Icon]) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`TruBuild on ${name}`}
              >
                <Icon size={20} />
              </a>
            ))}
          </nav>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/solutions">Our solutions</Link>
          <Link to="/products">Product catalogue</Link>
          <Link to="/advisor">Product advisor</Link>
          <Link to="/visualizer">Tile & grout studio</Link>
          <Link to="/calculator">Project calculator</Link>
          <Link to="/blogs">Guides & advice</Link>
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
        <img
          loading="lazy"
          src={p.image}
          alt={
            "TruBuild " +
            p.name +
            (p.imageKind === "document"
              ? " technical data sheet preview"
              : " official packaging")
          }
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
        <div className="product-card-actions">
          <Link className="product-card-view" to={"/products/" + p.id}>
            View product <ArrowUpRight size={15} />
          </Link>
          {toggle && (
            <button
              className={"compare-toggle " + (compare ? "selected" : "")}
              onClick={() => toggle(p.id)}
              aria-pressed={!!compare}
              aria-label={
                (compare ? "Remove " : "Add ") +
                p.name +
                (compare ? " from comparison" : " to comparison")
              }
            >
              {compare ? <Check size={16} /> : <Columns2 size={16} />}{" "}
              {compare ? "Selected" : "Compare"}
            </button>
          )}
        </div>
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
