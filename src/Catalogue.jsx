import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
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
  const q = params.get("search") || "",
    cat = params.get("category") || "",
    application = params.get("application") || "";
  const filtered = products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!application || p.applications.includes(application)) &&
      (!q ||
        [p.name, p.description, p.category, ...p.fields, ...p.applications]
          .join(" ")
          .toLowerCase()
          .includes(q.trim().toLowerCase())),
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
    <div className="catalogue-v2">
      <section className="catalogue-masthead">
        <Breadcrumb items={[{ label: "Products" }]} />
        <div className="catalogue-title-row">
          <div>
            <span className="mono-label">THE TRUBUILD COLLECTION</span>
            <h1>
              Find the
              <br />
              <span>right product.</span>
            </h1>
          </div>
          <div className="catalogue-intro">
            <p>
              Waterproofing, tiling, grouting and repair.
              <br />
              Find the right material for your next build.
            </p>
            <Link to="/advisor">
              Help me choose <ArrowUpRight size={18} />
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
            placeholder="Search by product, code or application"
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
          className="catalogue-mobile-filters"
          aria-expanded={filtersOpen}
          aria-controls="catalogue-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={18} /> Filters{" "}
          {activeCount > 0 && <span>{activeCount}</span>}
          <span>{filtersOpen ? "Close" : "Show"}</span>
        </button>
        <aside
          id="catalogue-filters"
          className={"catalogue-sidebar " + (filtersOpen ? "is-open" : "")}
        >
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
          <Link className="catalogue-guidance" to="/advisor">
            <span className="mono-label">A PROJECT IN MIND?</span>
            <strong>
              Let’s narrow
              <br />
              it down.
            </strong>
            <span>
              Try the Product Advisor <ArrowUpRight size={18} />
            </span>
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
            <Link to="/compare">
              Compare{compare.length ? ` (${compare.length})` : ""}{" "}
              <ArrowUpRight size={15} />
            </Link>
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
            <div className="catalogue-product-grid">
              {filtered.map((p) => (
                <article className="catalogue-item" key={p.id}>
                  <Link
                    className="catalogue-item-image"
                    to={"/products/" + p.id}
                    aria-label={"View " + p.name}
                  >
                    <img
                      src={p.image}
                      alt={p.name + " official packaging"}
                      loading="lazy"
                    />
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
                    <p>
                      {p.applications
                        .map(
                          (a) =>
                            solutions.find((s) => s.sourceName === a)?.name ||
                            a,
                        )
                        .slice(0, 2)
                        .join(" · ") || "View product application guidance"}
                    </p>
                  </div>
                  <div className="catalogue-item-actions">
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
                      {compare.includes(p.id) ? "Selected" : "Compare"}
                    </button>
                    <Link to={"/products/" + p.id}>
                      Details <ArrowUpRight size={14} />
                    </Link>
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

export function ProductDetail({ compare, toggle }) {
  const { id } = useParams();
  const p = products.find((p) => p.id === id);
  if (!p) return <NotFound />;
  const d = documentFor(p),
    related = products
      .filter((x) => x.category === p.category && x.id !== p.id)
      .slice(0, 3);
  const needsReview = p.sourceNotes?.length > 0;
  return (
    <>
      <div className="wrap">
        <Breadcrumb
          items={[{ label: "Products", to: "/products" }, { label: p.name }]}
        />
        <section className="product-detail">
          <div className="detail-image">
            <span>ASTRAL TRUBUILD</span>
            <img
              src={p.image}
              alt={"TruBuild " + p.name + " official packaging"}
            />
          </div>
          <div className="detail-copy">
            <Link
              className="eyebrow"
              to={"/products?category=" + encodeURIComponent(p.category)}
            >
              {p.category}
            </Link>
            <h1>{p.name}</h1>
            <p>{p.description}</p>
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
            <div className="detail-actions">
              <Button to={enquiryUrl(p.name)}>
                Enquire about this product
              </Button>
              <button className="button outline" onClick={() => toggle(p.id)}>
                {compare.includes(p.id) ? <Check size={17} /> : <span>+</span>}
                {compare.includes(p.id)
                  ? "Added to comparison"
                  : "Compare product"}
              </button>
            </div>
            <a
              className="text-link"
              href={d.local || d.url}
              target="_blank"
              rel="noreferrer"
            >
              <FileDown size={18} /> Technical data sheet · PDF
            </a>
          </div>
        </section>
        <section className="detail-information">
          <div>
            <h2>Technical information</h2>
            <p>
              Review the current technical data sheet before specifying or
              applying a product.
            </p>
            <a
              className="text-link"
              href={p.source}
              target="_blank"
              rel="noreferrer"
            >
              Official product source <ArrowUpRight size={15} />
            </a>
            {needsReview && <p className="notice">{p.sourceNotes.join(" ")}</p>}
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
              <p className="fineprint">
                Published product-page values. Document revisions may differ;
                the technical team should confirm project specifications.
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
              </div>
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
              <a
                className="document-link"
                href={d.local || d.url}
                target="_blank"
                rel="noreferrer"
              >
                <FileDown />
                Technical data sheet
                <ArrowUpRight />
              </a>
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
                  <a
                    className="text-link"
                    href={documentFor(p).local || documentFor(p).url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open data sheet <FileDown size={16} />
                  </a>
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
