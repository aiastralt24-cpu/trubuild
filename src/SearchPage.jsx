import React, { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ArrowUpRight, ArrowRight, X } from "lucide-react";
import { searchIndex } from "./searchData";
import { search, guidance } from "./searchEngine.mjs";
import { TdsLink } from "./TdsDownload";
import "./search.css";
export default function SearchPage({ onCompare }) {
  const [params, setParams] = useSearchParams(),
    q = params.get("q") || "";
  const [draft, setDraft] = useState(q),
    [type, setType] = useState("All");
  useEffect(() => {
    setDraft(q);
    setType("All");
  }, [q]);
  const result = useMemo(() => search(searchIndex, q), [q]);
  const answer = useMemo(() => guidance(q, result), [q, result]);
  const suggestions = useMemo(
    () =>
      draft.trim().length >= 2 && draft !== q
        ? search(searchIndex, draft, { limit: 4 }).results
        : [],
    [draft, q],
  );
  const submit = (value) => {
    setParams(value.trim() ? { q: value.trim().slice(0, 300) } : {});
  };
  const shown = result.results.filter((r) => type === "All" || r.type === type);
  const types = ["All", "Products", "Guides", "Documents", "Applications"];
  const compareProducts = result.results
    .filter((r) => r.type === "Products")
    .slice(0, 3);
  return (
    <section className="smart-search wrap">
      <span className="eyebrow">TRUBUILD SEARCH</span>
      <h1>Start with a question.</h1>
      <p className="ss-intro">
        A product name, a surface, or a problem you want to solve. Search across
        products, guidance and technical documents.
      </p>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
        className="ss-form"
      >
        <label className="ss-label" htmlFor="site-search">
          What are you looking for?
        </label>
        <div>
          <Search size={23} />
          <input
            id="site-search"
            maxLength={300}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Try ‘roof leaking in rain’ or ‘trufx 110’"
            autoComplete="off"
          />
          {draft && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setDraft("");
                submit("");
              }}
            >
              <X size={18} />
            </button>
          )}
          <button className="ss-submit" type="submit">
            Search <ArrowRight size={18} />
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div className="ss-suggestions" aria-label="Search suggestions">
          {suggestions.map((r) => (
            <Link
              key={r.id}
              to={"/search?q=" + encodeURIComponent(r.title.split(" · ")[0])}
            >
              <span>{r.title}</span>
              <small>{r.type}</small>
            </Link>
          ))}
        </div>
      )}
      {!q && (
        <div className="ss-start">
          <h2>What brings you here?</h2>
          <div>
            {[
              "Roof leaking in rain",
              "Bathroom seepage",
              "Trufix 110",
              "Aqualock coverage",
              "छत से पानी टपक रहा है",
              "roof ke liye waterproofing",
            ].map((text) => (
              <button key={text} onClick={() => submit(text)}>
                {text}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <p>
            Common Hindi and Hinglish search phrases are supported. Source
            content is currently in English.
          </p>
        </div>
      )}
      {q && (
        <>
          {result.corrections.length > 0 && (
            <p className="ss-correction">
              Also matching:{" "}
              {result.corrections.map((c) => c.from + " → " + c.to).join(", ")}
            </p>
          )}
          <div className="ss-layout">
            <div>
              {answer && (
                <section className="ss-answer">
                  <span className="eyebrow">GUIDANCE & NEXT STEPS</span>
                  <h2>{answer.title}</h2>
                  {answer.text && <p>{answer.text}</p>}
                  {answer.source && (
                    <Link to={answer.source.href}>
                      Source: {answer.source.title}
                      <ArrowUpRight size={15} />
                    </Link>
                  )}
                  {answer.question && (
                    <p className="ss-question">{answer.question}</p>
                  )}
                  {answer.choices && (
                    <div className="ss-choices">
                      {answer.choices.map((c) => (
                        <button key={c} onClick={() => submit(c)}>
                          {c}
                          <ArrowRight size={15} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
              <div
                className="ss-tabs"
                role="group"
                aria-label="Filter search results"
              >
                {types.map((t) => (
                  <button
                    key={t}
                    aria-pressed={type === t}
                    onClick={() => setType(t)}
                  >
                    {t}
                    <span>
                      {t === "All"
                        ? result.results.length
                        : result.results.filter((r) => r.type === t).length}
                    </span>
                  </button>
                ))}
              </div>
              <p className="ss-count" role="status">
                {shown.length} results for “{q}”
                {type !== "All" ? " in " + type.toLowerCase() : ""}
              </p>
              {shown.length === 0 ? (
                <div className="ss-empty">
                  <h2>
                    {result.results.length
                      ? "No matches in this category."
                      : "We couldn’t find a reliable match."}
                  </h2>
                  <p>
                    Try a product code, the surface you are working on, or a
                    shorter description. Our advisor can help narrow the
                    application.
                  </p>
                  <Link to="/advisor">
                    Find your product <ArrowUpRight size={16} />
                  </Link>
                </div>
              ) : (
                shown.map((r) => (
                  <article className="ss-result" key={r.id}>
                    {r.image && <img src={r.image} alt="" loading="lazy" />}
                    <div>
                      <span className="ss-kind">{r.type}</span>
                      <h2>
                        {r.type === "Documents" && r.product ? (
                          <TdsLink product={r.product} sheet={r.sheet}>
                            {r.title}
                          </TdsLink>
                        ) : (
                          <Link to={r.href}>
                            {r.title}
                            <ArrowUpRight size={17} />
                          </Link>
                        )}
                      </h2>
                      <p>{r.description}</p>
                      {r.type === "Products" && (
                        <small>
                          Relevant catalogue match · confirm application
                          suitability in the technical sheet.
                        </small>
                      )}
                      {r.type === "Documents" && (
                        <small>
                          Open the document request form to access this sheet.
                        </small>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
            <aside className="ss-aside">
              <span className="eyebrow">TAKE THE NEXT STEP</span>
              <Link to="/advisor">
                <strong>Find your product</strong>
                <span>Answer a few questions about your application.</span>
                <ArrowUpRight size={18} />
              </Link>
              <Link to="/calculator">
                <strong>Plan your quantities</strong>
                <span>Choose an application and enter your measurements.</span>
                <ArrowUpRight size={18} />
              </Link>
              {compareProducts.length >= 2 && (
                <button
                  onClick={() =>
                    onCompare(compareProducts.map((r) => r.product.id))
                  }
                >
                  <strong>Compare matching products</strong>
                  <span>{compareProducts.map((r) => r.title).join(" · ")}</span>
                  <ArrowUpRight size={18} />
                </button>
              )}
              <Link to="/contact">
                <strong>Ask the technical team</strong>
                <span>Get help with conditions specific to your site.</span>
                <ArrowUpRight size={18} />
              </Link>
              <p>
                Results come from TruBuild’s maintained catalogue and site
                guides. Search matches are not a suitability approval.
              </p>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
