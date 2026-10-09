import { TdsDownload, TdsLink } from "./TdsDownload";
import packaging from "./packaging.json";
import { ProductGallery, ProductColour, PackSizeSelector, StickyProductEnquiry } from "./ProductGallery";
import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  LayoutGrid,
  List,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowLeft,
  Check,
  FileDown,
} from "lucide-react";
import {
  products,
  categories,
  solutions,
  documentFor,
  enquiryUrl,
} from "./data";
import {
  PageIntro,
  ProductGrid,
  Button,
  Breadcrumb,
  AdvisorBanner,
} from "./components";
export function Catalogue({ compare, toggle }) {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef(null);
  const filterTrigger = useRef(null);
  const view = params.get("view") === "list" ? "list" : "grid";
  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = filterRef.current;
    panel.querySelector("button")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
      if (event.key === "Tab") {
        const controls = [...panel.querySelectorAll("button, a, select")].filter(el => el.getClientRects().length && !el.disabled);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); filterTrigger.current?.focus(); };
  }, [filtersOpen]);
  const q = params.get("search") || "",
    cat = params.get("category") || "",
    application = params.get("application") || "";
  const filtered = products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!application || p.applications.includes(application)) &&
      (!q ||
        q.trim().toLowerCase().split(/\s+/).every(term =>
          [p.name, ...(p.aliases || []), p.description, p.category, ...p.fields, ...p.applications]
            .join(" ").toLowerCase().includes(term))),
  );
  function update(key, val) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        val ? p.set(key, val) : p.delete(key);
        return p;
      },
      { replace: true },
    );
  }
  const activeCount = Number(!!cat) + Number(!!application);
  return (
    <div className="catalogue-v2 catalogue-v3">
      <section className="catalogue-masthead">
        <Breadcrumb items={[{ label: "Products" }]} />
        <div className="catalogue-title-row">
          <div>
            <span className="mono-label">THE PRODUCT CATALOGUE</span>
            <h1>
              Find the right <span>product.</span>
            </h1>
          </div>
          <div className="catalogue-intro">
            <p>From waterproofing to the final finish.<br />Materials for every stage of your build.</p>
            <Link to="/advisor">
              Not sure which product? <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="catalogue-searchbar">
          <Search size={22} />
          <label className="sr-only" htmlFor="product-search">
            Search products
          </label>
          <input
            id="product-search"
            value={q}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Search products, codes or uses — e.g. roof coating"
          />
          {q ? (
            <button
              aria-label="Clear search"
              onClick={() => update("search", "")}
            >
              <X size={20} />
            </button>
          ) : (
            <span className="search-hint">EXPLORE THE RANGE</span>
          )}
        </div>
      </section>
      <div className="catalogue-workspace">
        <button
          ref={filterTrigger}
          className="catalogue-mobile-filters"
          aria-expanded={filtersOpen}
          aria-controls="catalogue-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={18} /> Filters{" "}
          {activeCount > 0 && <span>{activeCount}</span>}
          <span>{filtersOpen ? "Close" : "Show"}</span>
        </button>
        {filtersOpen && <button className="catalogue-filter-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />}
        <aside
          ref={filterRef}
          role={filtersOpen ? "dialog" : undefined}
          aria-modal={filtersOpen ? true : undefined}
          aria-label="Product filters"
          id="catalogue-filters"
          className={"catalogue-sidebar " + (filtersOpen ? "is-open" : "")}
        >
          <button className="catalogue-filter-close" onClick={() => setFiltersOpen(false)}>Close filters <X size={20} /></button>
          <div className="sidebar-heading">
            <h2>Browse by category</h2>
            {(cat || application || q) && (
              <button onClick={() => setParams({})}>Reset</button>
            )}
          </div>
          <div className="catalogue-categories" aria-label="Product categories">
            <button aria-pressed={!cat} onClick={() => update("category", "")}>
              <span>All products</span>
              <small>{products.length}</small>
            </button>
            {categories.map((c) => (
              <button
                key={c}
                aria-pressed={cat === c}
                onClick={() => update("category", cat === c ? "" : c)}
              >
                <span>{c}</span>
                <small>{products.filter((p) => p.category === c).length}</small>
              </button>
            ))}
          </div>
          <div className="application-filter">
            <label htmlFor="application">Application area</label>
            <select
              id="application"
              value={application}
              onChange={(e) => update("application", e.target.value)}
            >
              <option value="">All applications</option>
              {solutions.map((s) => (
                <option key={s.id} value={s.sourceName}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button className="catalogue-filter-apply" onClick={() => setFiltersOpen(false)}>Show {filtered.length} products <ArrowUpRight size={18} /></button>
          <Link className="catalogue-guidance" to="/advisor">
            <strong>Need a little guidance?</strong>
            <span>Find your product <ArrowUpRight size={18} /></span>
          </Link>
        </aside>
        <section className="catalogue-results" aria-label="Product results">
          <div className="catalogue-results-top">
            <h2>
              {cat || "All products"}{" "}
              <span role="status">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </span>
            </h2>
            <div className="catalogue-view-switch" role="group" aria-label="Product display">
              <button aria-pressed={view === "grid"} onClick={() => update("view", "")}><LayoutGrid size={16} /> Grid</button>
              <button aria-pressed={view === "list"} onClick={() => update("view", "list")}><List size={17} /> List</button>
            </div>
          </div>
          {(cat || application || q) && (
            <div className="catalogue-active-filters">
              {[
                ["search", q],
                ["category", cat],
                ["application", application],
              ]
                .filter(([, v]) => v)
                .map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => update(key, "")}
                    aria-label={"Remove " + key + " filter: " + value}
                  >
                    {value}
                    <X size={13} />
                  </button>
                ))}
              <button className="clear-filters" onClick={() => setParams({})}>
                Clear all
              </button>
            </div>
          )}
          {filtered.length ? (
            <div className={"catalogue-product-grid " + (view === "list" ? "is-list" : "")}>
              {filtered.map((p) => (
                <article className="catalogue-item" key={p.id}>
                  <Link
                    className="catalogue-item-image"
                    to={"/products/" + p.id}
                    aria-label={"View " + p.name}
                  >
                    <img
                      src={p.image}
                      alt={p.name + (p.imageKind === "document" ? " technical data sheet preview" : " official packaging")}
                      loading="lazy"
                    />
                    {p.imageKind === "document" && <span className="catalogue-document-label">TDS preview</span>}
                    <span className="catalogue-item-arrow">
                      <ArrowUpRight size={20} />
                    </span>
                  </Link>
                  <div className="catalogue-item-copy">
                    <span className="catalogue-item-category">
                      {p.category}
                    </span>
                    <Link to={"/products/" + p.id}>
                      <h3>{p.name}</h3>
                    </Link>
                    <p className="catalogue-purpose">{p.subtitle || p.description}</p>
                    <p className="catalogue-packs"><span>PACK SIZES</span>{p.packaging || "See product for availability"}</p>
                  </div>
                  <div className="catalogue-item-actions">
                    <Link className="catalogue-view-product" to={"/products/" + p.id} aria-label={"View " + p.name}>View<span className="action-word"> product</span> <ArrowUpRight size={14} /></Link>
                    <button
                      aria-label={"Compare " + p.name}
                      aria-pressed={compare.includes(p.id)}
                      onClick={() => toggle(p.id)}
                    >
                      <span
                        className={
                          "compare-box " +
                          (compare.includes(p.id) ? "checked" : "")
                        }
                      >
                        {compare.includes(p.id) && <Check size={12} />}
                      </span>
                      <span className="compare-action-label">{compare.includes(p.id) ? "Selected" : "Compare"}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalogue-empty">
              <Search size={30} />
              <h2>No matching products.</h2>
              <p>
                Try another product name or remove a filter to see more options.
              </p>
              <Button onClick={() => setParams({})}>
                Clear search & filters
              </Button>
              <Link className="text-link" to={enquiryUrl("", q)}>
                Ask our technical team <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
          <div className="catalogue-endnote">
            <FileDown size={18} />
            <span>Need specifications or application guidance?</span>
            <Link to="/resources">
              Visit the resource library <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProductDetail(props) {
  const { id } = useParams();
  return <ProductDetailContent key={id} {...props} />;
}

function ProductDetailContent({ compare, toggle }) {
  const [variant, setVariant] = useState(0);
  const [tdsOpen, setTdsOpen] = useState(false);
  const actionRef = useRef(null);
  const { id } = useParams();
  const p = products.find((p) => p.id === id);
  if (!p) return <NotFound />;
  const selectedPack = p.packSizes?.[variant] || packaging[p.id]?.variants?.[variant]?.label || "";
  const d = documentFor(p),
    related = products
      .filter((x) => x.category === p.category && x.id !== p.id)
      .slice(0, 3);
  const enquiry = enquiryUrl(p.name + (selectedPack ? " — " + selectedPack : ""));
  const highlights = [...p.benefits].filter(Boolean).sort((a,b) => a.length-b.length).slice(0,3);
  return (
    <>
      <div className="wrap">
        <Breadcrumb
          items={[{ label: "Products", to: "/products" }, { label: p.name }]}
        />
        <section className="product-detail">
          <ProductGallery key={p.id + variant} product={p} variant={variant} />
          <div className="detail-copy">
            <Link
              className="eyebrow"
              to={"/products?category=" + encodeURIComponent(p.category)}
            >
              {p.category}
            </Link>
            <h1>{p.name}</h1>
            {p.aliases?.length > 0 && <p className="fineprint">Also known as {p.aliases.join(" / ")}</p>}
            <p>{p.subtitle || p.description}</p>
            {highlights.length > 0 && <ul className="product-highlights" aria-label="Key benefits">{highlights.map(text => <li key={text}><Check size={16}/><span>{text}</span></li>)}</ul>}
            <div className="detail-tags">
              {p.applications.map((a) => (
                <Link
                  key={a}
                  to={"/products?application=" + encodeURIComponent(a)}
                >
                  {a}
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
            <div className="product-selection">
            <PackSizeSelector product={p} variant={variant} onChange={setVariant} />
            <ProductColour product={p} products={products} />
            <div className="detail-actions" ref={actionRef}>
              <Button to={enquiry}>Enquire about this product</Button>
              {d.pending ? <Link className="tds-action" to={d.url}>Request TDS <FileDown size={18}/></Link> : <button className="tds-action" onClick={()=>setTdsOpen(true)}>Download TDS <FileDown size={18}/></button>}
            </div>
            <button className="compare-product-minor" onClick={()=>toggle(p.id)} aria-pressed={compare.includes(p.id)}>
              {compare.includes(p.id) ? <Check size={16}/> : <span>+</span>}{compare.includes(p.id) ? 'Added to comparison' : 'Compare product'}
            </button>
            {tdsOpen && <TdsDownload product={p} document={d} onClose={()=>setTdsOpen(false)}/>}
            </div>
          </div>
        </section>
        <StickyProductEnquiry product={p} selectedPack={selectedPack} actionRef={actionRef} href={enquiry} />
        <section className="detail-information">
          <div>
            <h2>Technical information</h2>
            <p>
              Review the current technical data sheet before specifying or
              applying a product.
            </p>

          </div>
          <div className="technical-accordion">
            <details open>
              <summary>
                Applications <span>+</span>
              </summary>
              <ul>
                {p.fields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              {p.applicationNotes.map((n, i) => (
                <p className="notice" key={i}>
                  {n}
                </p>
              ))}
            </details>
            <details>
              <summary>
                Features & benefits <span>+</span>
              </summary>
              <ul>
                {p.benefits.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </details>
            <details>
              <summary>
                Specifications <span>+</span>
              </summary>
              {p.specs.length === 0 ? <p>Contact our technical team for product specifications and application guidance.</p> : <><p className="fineprint">
                {p.tdsVersion
                  ? `Source: final approved TDS ${p.tdsVersion}, page${p.specPages.length > 1 ? "s" : ""} ${p.specPages.join(", ")}. Checked 9 October 2026.`
                  : "Published product-page values; not checked against a replacement TDS in the October 2026 review. Confirm current specifications with the technical team."}
              </p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Standard</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.specs
                      .filter((r) => r.length)
                      .map((row, i) => (
                        <tr key={i}>
                          {row.map((v, j) => (
                            <td key={j}>{v || "—"}</td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div></>}
            </details>
            <details>
              <summary>
                Packaging & documentation <span>+</span>
              </summary>
              <p>
                <strong>Available sizes</strong>
                <br />
                {p.packaging ||
                  "Confirm current pack sizes with the TruBuild team."}
              </p>
              {p.coverage && <p><strong>Coverage / dosage</strong><br />{p.coverage}</p>}
              {p.shelfLife && <p><strong>Shelf life</strong><br />{p.shelfLife}</p>}
              {p.storage && <p><strong>Storage</strong><br />{p.storage}</p>}
              {p.tdsVersion && <p className="fineprint">TDS {p.tdsVersion} · Checked 9 October 2026</p>}
              {d.pending ? <Link className="document-link" to={d.url}>Request current technical data sheet <ArrowUpRight/></Link> : <button className="document-link" onClick={()=>setTdsOpen(true)}><FileDown/>Download technical data sheet<ArrowUpRight/></button>}

              <p className="fineprint">
                Need an SDS or a project-specific certificate? Request it with
                your product enquiry.
              </p>
            </details>
          </div>
        </section>
        {related.length > 0 && (
          <section className="section">
            <div className="section-heading">
              <h2>Explore the range.</h2>
              <Link
                className="text-link"
                to={"/products?category=" + encodeURIComponent(p.category)}
              >
                See category <ArrowUpRight size={18} />
              </Link>
            </div>
            <ProductGrid items={related} compare={compare} toggle={toggle} />
          </section>
        )}
      </div>
    </>
  );
}
export function Compare({ compare, toggle }) {
  const selected = products.filter((p) => compare.includes(p.id));
  return (
    <>
      <PageIntro
        title="Compare"
        accent="your shortlist."
        eyebrow="PRODUCT COMPARISON"
        description="Compare published applications, packaging and documents. A comparison helps you shortlist; it does not establish interchangeability."
      />
      <section className="wrap section">
        {selected.length ? (
          <>
            <div
              className="comparison-grid"
              style={{ "--columns": selected.length }}
            >
              {selected.map((p) => (
                <article key={p.id}>
                  <button
                    className="remove-compare"
                    onClick={() => toggle(p.id)}
                    aria-label={"Remove " + p.name}
                  >
                    <X size={17} />
                  </button>
                  <img src={p.image} alt={p.name} />
                  <Link to={"/products/" + p.id}>
                    <h2>{p.name}</h2>
                  </Link>
                  <h3>Product category</h3>
                  <p>{p.category}</p>
                  <h3>Published applications</h3>
                  <ul>
                    {p.fields.slice(0, 4).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <h3>Packaging</h3>
                  <p>{p.packaging || "Confirm with technical team"}</p>
                  <h3>Technical data</h3>
                  <TdsLink
                    className="text-link"
                    product={p}
                    sheet={documentFor(p)}
                  >
                    {documentFor(p).pending ? "Request current data sheet" : "Open data sheet"} <FileDown size={16} />
                  </TdsLink>
                </article>
              ))}
            </div>
            <div className="comparison-actions">
              <Button to={enquiryUrl(selected.map((p) => p.name).join(", "))}>
                Discuss these products
              </Button>
              <Link to="/products" className="text-link">
                Add another product <ArrowUpRight size={17} />
              </Link>
            </div>
          </>
        ) : (
          <div className="empty">
            <h2>Your comparison is empty.</h2>
            <p>Select up to three products from the catalogue.</p>
            <Button to="/products">Explore products</Button>
          </div>
        )}
      </section>
    </>
  );
}
export function NotFound() {
  return (
    <section className="empty section">
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>Let’s find a better way.</h1>
      <p>
        This page doesn’t exist. Explore the catalogue or start with your
        application.
      </p>
      <Button to="/products">Explore products</Button>
    </section>
  );
}
