import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, X, FileDown } from "lucide-react";
import { products, documentFor, enquiryUrl } from "./data";
import { TdsLink } from "./TdsDownload";
import "./comparison.css";

const missing = "Not listed for this specification";
const generalRows = [
  ["Product category", (p) => p.category],
  ["Applications", (p) => p.fields?.join("\n")],
  ["Key benefits", (p) => p.benefits?.join("\n")],
  ["Coverage / dosage", (p) => p.coverage],
  ["Pack sizes", (p) => p.packaging],
  ["Application guidance", (p) => p.applicationNotes?.join("\n")],
  ["Shelf life", (p) => p.shelfLife],
  ["Storage", (p) => p.storage],
];
export function CompareProducts({ compare, onSelectionChange }) {
  const [differences, setDifferences] = useState(false);
  const selected = compare
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);
  const slots = [
    ...selected,
    ...Array(Math.max(0, 3 - selected.length)).fill(null),
  ];
  const change = (index, id) => {
    const next = selected.map((p) => p.id);
    if (id) next[index] = id;
    else next.splice(index, 1);
    onSelectionChange(next.filter(Boolean));
  };
  const different = (values) =>
    new Set(values.map((v) => (v || missing).trim())).size > 1;
  const rows = generalRows.map(([label, get]) => ({
    label,
    values: selected.map(get),
  }));
  const specs = [
    ...new Set(
      selected.flatMap((p) =>
        (p.specs || []).map((s) => JSON.stringify([s[0], s[1]])),
      ),
    ),
  ].map((key) => {
    const [label, method] = JSON.parse(key);
    return {
      label,
      method,
      values: selected.map(
        (p) => p.specs?.find((s) => s[0] === label && s[1] === method)?.[2],
      ),
    };
  });
  const visible = (list) =>
    list.filter(
      (row) => !differences || selected.length < 2 || different(row.values),
    );
  const renderRows = (list) =>
    visible(list).map((row, i) => (
      <tr
        key={row.label + "-" + i}
        className={
          different(row.values) && selected.length > 1 ? "cp-different" : ""
        }
      >
        <th scope="row">
          {row.label}
          {row.method && row.method !== "-" && <small>{row.method}</small>}
        </th>
        {slots.map((p, index) => (
          <td key={p?.id || index}>
            {p ? (
              <span className={!row.values[index] ? "cp-missing" : ""}>
                {row.values[index] || missing}
              </span>
            ) : (
              <span className="cp-empty-value">—</span>
            )}
          </td>
        ))}
      </tr>
    ));
  return (
    <section className="cp-page wrap">
      <Link className="cp-back" to="/products">
        ← Back to products
      </Link>
      <div className="cp-intro">
        <div>
          <span className="eyebrow">PRODUCT COMPARISON</span>
          <h1>
            Find the right fit.
            <br />
            <em>See the difference.</em>
          </h1>
        </div>
        <p>
          From application to specification, compare your shortlist side by
          side. Choose up to three products to see how they differ.
        </p>
      </div>
      <div className="cp-toolbar">
        <span>
          <strong>{selected.length} / 3</strong> products selected
        </span>
        <label>
          <input
            type="checkbox"
            checked={differences}
            disabled={selected.length < 2}
            onChange={(e) => setDifferences(e.target.checked)}
          />{" "}
          Show differences only
        </label>
        {selected.length > 0 && (
          <button onClick={() => onSelectionChange([])}>Clear all</button>
        )}
      </div>
      {selected.length > 1 &&
        new Set(selected.map((p) => p.category)).size > 1 && (
          <p className="cp-notice">
            These products belong to different categories. Compare their
            intended applications before considering them as alternatives.
          </p>
        )}
      <p className="cp-scroll-hint">
        Swipe across the table to compare all products →
      </p>
      <div
        className="cp-scroll"
        role="region"
        aria-label="Product comparison table"
        tabIndex={0}
      >
        <table className="cp-table">
          <caption className="cp-sr">
            Comparison of selected TruBuild products, including published
            specifications and test methods.
          </caption>
          <colgroup>
            <col className="cp-label-col" />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="cp-corner">
                <span>YOUR SHORTLIST</span>
                <p>
                  One view.
                  <br />
                  Every detail.
                </p>
                <small>Choose products below to get started.</small>
              </th>
              {slots.map((p, index) => (
                <th scope="col" key={index} className="cp-product">
                  <label className="cp-sr" htmlFor={"cp-select-" + index}>
                    Product {index + 1}
                  </label>
                  <select
                    id={"cp-select-" + index}
                    value={p?.id || ""}
                    onChange={(e) => change(index, e.target.value)}
                  >
                    <option value="">
                      {p ? "Remove product" : "+ Add a product"}
                    </option>
                    {products
                      .filter(
                        (item) =>
                          item.id === p?.id || !compare.includes(item.id),
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.category}
                        </option>
                      ))}
                  </select>
                  {p ? (
                    <>
                      <button
                        className="cp-remove"
                        onClick={() => change(index, "")}
                        aria-label={"Remove " + p.name}
                      >
                        <X size={16} />
                      </button>
                      <div className="cp-pack">
                        <img src={p.image} alt={p.name + " packaging"} />
                      </div>
                      <span className="cp-category">{p.category}</span>
                      <h2>{p.name}</h2>
                      <p>{p.subtitle || p.description}</p>
                      <Link to={"/products/" + p.id}>
                        View details <ArrowUpRight size={17} />
                      </Link>
                    </>
                  ) : (
                    <div className="cp-placeholder">
                      <span>0{index + 1}</span>
                      <h2>
                        {selected.length
                          ? "Complete your shortlist"
                          : "Start with a product"}
                      </h2>
                      <p>
                        Select a product above to compare its applications and
                        technical details.
                      </p>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {selected.length > 0 && (
            <tbody>
              <tr className="cp-group">
                <th colSpan={4}>
                  01 <span>At a glance</span>
                </th>
              </tr>
              {renderRows(rows)}
              {visible(specs).length > 0 && (
                <>
                  <tr className="cp-group">
                    <th colSpan={4}>
                      02 <span>Technical specifications</span>
                    </th>
                  </tr>
                  {renderRows(specs)}
                </>
              )}
              <tr className="cp-group">
                <th colSpan={4}>
                  03 <span>Documents & next steps</span>
                </th>
              </tr>
              <tr>
                <th scope="row">Technical data sheet</th>
                {slots.map((p, index) => (
                  <td key={index}>
                    {p && (
                      <>
                        <TdsLink
                          className="cp-document"
                          product={p}
                          sheet={documentFor(p)}
                        >
                          {documentFor(p).pending
                            ? "Request data sheet"
                            : "Open data sheet"}{" "}
                          <FileDown size={16} />
                        </TdsLink>
                        {p.tdsVersion && (
                          <small className="cp-version">
                            Version {p.tdsVersion}
                          </small>
                        )}
                      </>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          )}
        </table>
      </div>
      {selected.length > 0 && (
        <div className="cp-bottom">
          <p>
            Values are reproduced from published product data. Different test
            methods or conditions are shown separately. Missing data does not
            mean a product lacks that property.
          </p>
          <Link to={enquiryUrl(selected.map((p) => p.name).join(", "))}>
            Discuss your shortlist <ArrowUpRight size={18} />
          </Link>
        </div>
      )}
    </section>
  );
}
