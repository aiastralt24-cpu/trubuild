import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Grid2X2,
  PaintBucket,
  Droplets,
} from "lucide-react";
import { products } from "./data";
import {
  adhesiveRules,
  waterproofRules,
  packSizes,
  estimateMaterial,
} from "./calculatorMath.mjs";
import "./material-calculators.css";
const types = {
  "tile-adhesive": {
    title: "Tile adhesive",
    intro: "Plan the bags you need to lay your tiles.",
    icon: Grid2X2,
    image: "/images/hero-interior-floor.webp",
    number: "01",
  },
  grout: {
    title: "Tile grout",
    intro: "Calculate joint filling quantities from your tile dimensions.",
    icon: PaintBucket,
    image: "/images/guides/grout.webp",
    number: "02",
  },
  waterproofing: {
    title: "Waterproofing",
    intro: "Estimate coating quantities for your surface area.",
    icon: Droplets,
    image: "/images/hero-roof-coating.webp",
    number: "03",
  },
};
function available(kind) {
  return products.filter((p) =>
    kind === "tile-adhesive"
      ? adhesiveRules[p.id]
      : kind === "waterproofing"
        ? waterproofRules[p.id]
        : /Tile Grouts|Cementitious Grouts/.test(p.category) &&
          packSizes(p).length,
  );
}
const fmt = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
export default function MaterialCalculators() {
  const { kind } = useParams();
  return (
    <div className="material-calcs">
      <header>
        <Link to="/" aria-label="TruBuild home">
          <img src="/images/wordmark-clean.webp" alt="TruBuild" />
        </Link>
        <span className="calc-header-caption">
          PROJECT PLANNING / MATERIAL CALCULATORS
        </span>
        <Link to="/calculator">
          <ArrowLeft size={16} /> All calculators
        </Link>
      </header>
      {!kind ? (
        <>
          <div className="calc-heading calc-home-heading">
            <p className="calc-eyebrow">PLAN YOUR PROJECT</p>
            <h1>
              Build with a plan.
              <br />
              Start with the right quantity.
            </h1>
            <p>
              Choose what you’re working on. Get a clear quantity estimate and
              whole-pack requirement.
            </p>
          </div>
          <div className="calc-options">
            {Object.entries(types).map(([key, t]) => (
              <Link key={key} to={`/calculator/${key}`}>
                <div className="calc-card-image">
                  <img src={t.image} alt="" />
                  <span className="calc-card-number">{t.number}</span>
                  <span className="calc-card-icon">
                    <t.icon size={24} />
                  </span>
                </div>
                <h2>{t.title}</h2>
                <p>{t.intro}</p>
                <span>
                  Calculate quantity <ArrowRight size={20} />
                </span>
              </Link>
            ))}
          </div>
          <Link className="calc-project" to="/calculator/project">
            Planning multiple applications? Open the project quotation workspace{" "}
            <ArrowRight size={18} />
          </Link>
        </>
      ) : types[kind] ? (
        <Calculator key={kind} kind={kind} />
      ) : (
        <div className="calc-heading">
          <h1>Calculator not found</h1>
          <Link to="/calculator">Choose a calculator</Link>
        </div>
      )}
    </div>
  );
}
function Calculator({ kind }) {
  const list = available(kind),
    [id, setId] = useState(list[0]?.id),
    [input, setInput] = useState({
      area: "",
      unit: "ft2",
      waste: "5",
      length: "600",
      width: "600",
      joint: "3",
      depth: "5",
      factor: "",
      pack: String(packSizes(list[0])[0]),
    }),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  const product = list.find((p) => p.id === id),
    rule = (kind === "tile-adhesive" ? adhesiveRules : waterproofRules)[id],
    t = types[kind];
  function change(key, value) {
    setInput((v) => ({ ...v, [key]: value }));
    setResult(null);
    setError("");
  }
  function field(key, label, extra = {}) {
    return (
      <label>
        {label}
        <input
          type="number"
          min="0"
          step="any"
          required
          value={input[key]}
          onChange={(e) => change(key, e.target.value)}
          {...extra}
        />
      </label>
    );
  }
  function calculate(e) {
    e.preventDefault();
    try {
      setResult(estimateMaterial(kind, input, rule?.rate ?? input.factor));
      setError("");
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
  }
  return (
    <>
      <div className="calc-heading">
        <p className="calc-eyebrow">MATERIAL CALCULATOR</p>
        <h1>{t.title} calculator</h1>
        <p>{t.intro}</p>
      </div>
      <nav className="calc-tabs" aria-label="Calculator type">
        {Object.entries(types).map(([key, t]) => (
          <Link
            key={key}
            aria-current={key === kind ? "page" : undefined}
            to={`/calculator/${key}`}
          >
            {t.title}
          </Link>
        ))}
      </nav>
      <div className="calc-layout">
        <form onSubmit={calculate}>
          <div className="calc-section-title">
            <span>01</span>
            <div>
              <h2>Project details</h2>
              <p>A few measurements. A clearer material plan.</p>
            </div>
          </div>
          <label>
            Choose your product
            <select
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                change(
                  "pack",
                  String(
                    packSizes(list.find((p) => p.id === e.target.value))[0],
                  ),
                );
                change("factor", "");
              }}
            >
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="calc-fields">
            {field("area", "Surface area", { max: 10000 })}
            <label>
              Area unit
              <select
                value={input.unit}
                onChange={(e) => change("unit", e.target.value)}
              >
                <option value="ft2">Square feet (sq ft)</option>
                <option value="m2">Square metres (m²)</option>
              </select>
            </label>
          </div>
          {kind === "grout" && (
            <>
              <div className="calc-fields">
                {field("length", "Tile length (mm)")}
                {field("width", "Tile width (mm)")}
                {field("joint", "Joint width (mm)")}
                {field("depth", "Joint depth (mm)")}
              </div>
              {field(
                "factor",
                "Manufacturer-confirmed consumption factor (kg/L)",
              )}
              <p className="calc-help">
                Enter the product’s grout calculation factor from technical
                support. Mixed wet density alone may not represent the quantity
                of packaged product required.
              </p>
            </>
          )}
          <div className="calc-fields">
            {field("waste", "Extra allowance (%)", { max: 30 })}
            <label>
              Pack size
              <select
                value={input.pack}
                onChange={(e) => change("pack", e.target.value)}
              >
                {packSizes(product).map((p) => (
                  <option key={p} value={p}>
                    {p} kg
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="calc-basis">
            <strong>
              {rule ? "Published calculation basis" : "Grout calculation basis"}
            </strong>
            <p>
              {rule?.basis ??
                "Area × (tile length + tile width) ÷ (tile length × tile width) × joint width × joint depth × confirmed factor. All dimensions in mm."}
            </p>
            {kind === "waterproofing" && (
              <p>
                Uses the upper published consumption. The stated coating system
                is already included; coats are not multiplied again.
              </p>
            )}
            {kind === "tile-adhesive" && (
              <p>
                For the stated bed thickness only. Different thicknesses,
                back-buttering and uneven surfaces require a revised consumption
                rate.
              </p>
            )}
            <Link to={`/products/${id}`}>
              View product and technical information ↗
            </Link>
          </div>
          {error && (
            <p role="alert" className="calc-error">
              {error}
            </p>
          )}
          <button className="calc-submit" type="submit">
            Calculate quantity <ArrowRight size={20} />
          </button>
        </form>
        <aside aria-live="polite">
          <MeasurementDiagram
            kind={kind}
            input={input}
            thickness={rule?.thickness}
          />
          <div className="calc-selected-product">
            <div className="calc-pack-image">
              <img src={product.image} alt={product.name} />
            </div>
            <div>
              <p className="calc-eyebrow">SELECTED PRODUCT</p>
              <h3>{product.name}</h3>
              <span>{input.pack} kg pack</span>
            </div>
          </div>
          <p className="calc-eyebrow">YOUR MATERIAL ESTIMATE</p>
          {result ? (
            <>
              <h2>
                {result.packs} {result.packs === 1 ? "pack" : "packs"}
              </h2>
              <p>
                {input.pack} kg per pack · {fmt(result.purchase)} kg to purchase
              </p>
              <dl>
                <div>
                  <dt>Surface area</dt>
                  <dd>{fmt(result.area)} m²</dd>
                </div>
                <div>
                  <dt>Consumption</dt>
                  <dd>{fmt(result.consumption)} kg/m²</dd>
                </div>
                <div>
                  <dt>Before allowance</dt>
                  <dd>{fmt(result.net)} kg</dd>
                </div>
                <div>
                  <dt>With {input.waste}% allowance</dt>
                  <dd>{fmt(result.total)} kg</dd>
                </div>
                <div>
                  <dt>Pack rounding surplus</dt>
                  <dd>{fmt(result.surplus)} kg</dd>
                </div>
              </dl>
              <p className="calc-help">
                Planning estimate only. Confirm product suitability, surface
                condition and application requirements before ordering. Pack
                quantities are rounded up.
              </p>
              <Link to="/contact">
                Discuss your project <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <h2>Your project, quantified.</h2>
              <p>
                Enter your project details to see required kilograms and whole
                packs.
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}

function MeasurementDiagram({ kind, input, thickness }) {
  const tile = kind === "grout";
  const ratio = tile
    ? Math.max(
        0.45,
        Math.min(2, Number(input.length) / Number(input.width) || 1),
      )
    : 1.65;
  const w = 180 * Math.sqrt(ratio),
    h = 110 / Math.sqrt(ratio),
    x = (360 - w) / 2,
    y = (230 - h) / 2;
  const gap = tile ? Math.max(3, Math.min(16, Number(input.joint) || 3)) : 5;
  const area =
    Number(input.area) > 0
      ? `${fmt(Number(input.area))} ${input.unit === "ft2" ? "sq ft" : "m²"}`
      : "Your surface area";
  return (
    <div className="calc-diagram">
      <div className="calc-diagram-heading">
        <span>{tile ? "JOINT & TILE PREVIEW" : "SURFACE PREVIEW"}</span>
        <span>Illustrative · not to scale</span>
      </div>
      <svg
        viewBox="0 0 360 250"
        role="img"
        aria-label={
          tile
            ? `Tile ${input.length} by ${input.width} mm, joint ${input.joint} mm, depth ${input.depth} mm`
            : area
        }
      >
        <path
          d="M20 230H340 M20 210H340 M20 190H340 M20 170H340 M20 150H340 M20 130H340 M20 110H340 M20 90H340 M20 70H340 M20 50H340 M40 35V230 M80 35V230 M120 35V230 M160 35V230 M200 35V230 M240 35V230 M280 35V230 M320 35V230"
          stroke="#dbe1d4"
          strokeWidth=".6"
        />
        <rect x={x} y={y + 8} width={w} height={h} rx="3" fill="#aab8a1" />
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx="3"
          fill={tile ? "#ffcc00" : "#d2dcc9"}
          stroke="#778b6b"
        />
        {tile &&
          [0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={x + ((i % 2) * (w + gap)) / 2}
              y={y + (Math.floor(i / 2) * (h + gap)) / 2}
              width={(w - gap) / 2}
              height={(h - gap) / 2}
              rx="2"
              fill="#f5f3eb"
              stroke="#b6bcae"
            />
          ))}
        <path
          d={`M${x} ${y - 14}h${w} M${x} ${y - 19}v10 M${x + w} ${y - 19}v10`}
          fill="none"
          stroke="#52634a"
        />
        <text
          x="180"
          y={y - 24}
          textAnchor="middle"
          fill="#34442e"
          fontSize="12"
        >
          {tile ? `${input.length || "—"} mm` : area}
        </text>
        <text x="180" y="235" textAnchor="middle" fill="#34442e" fontSize="12">
          {tile
            ? `${input.width || "—"} mm wide · ${input.joint || "—"} mm joints · ${input.depth || "—"} mm deep`
            : kind === "tile-adhesive"
              ? `${thickness} mm adhesive bed · published coverage`
              : "Coating system included in the published rate"}
        </text>
      </svg>
    </div>
  );
}
