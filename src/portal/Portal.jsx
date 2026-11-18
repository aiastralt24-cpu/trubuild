import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Download,
  Check,
  Calculator as CalcIcon,
  FileText,
  LayoutDashboard,
  Users,
  Clock,
  Settings,
  Search,
  X,
  LogOut,
} from "lucide-react";
import {
  calculate,
  measure,
  normalizeContact,
  priceEstimate,
  validateStage,
  stages,
  validateReferences,
  validateRule,
} from "../../supabase/functions/_shared/portal-engine.mjs";
import { quotePdf } from "../../supabase/functions/_shared/portal-pdf.mjs";
import { demoRules, defaultInput, demoPrices, seedWorkspace } from "./demo.mjs";
import {
  connected,
  portal,
  signIn,
  signOut,
  verifyMfa,
  downloadPdf,
} from "./api.mjs";
import "./portal.css";
const fmt = (n) =>
  Number(n).toLocaleString("en-IN", { maximumFractionDigits: 3 });
const money = (n, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    n / 100,
  );
const stamp = () => new Date().toISOString();
function Shell({ children, staff = false }) {
  return (
    <div className="pp">
      <header className="pp-header">
        <Link to="/">
          <img src="/images/wordmark-clean.webp" alt="TruBuild home" />
        </Link>
        <span>Project & sales portal</span>
        <nav>
          <Link to="/calculator">
            <CalcIcon size={16} /> Calculate
          </Link>
          <Link to="/workspace">
            <LayoutDashboard size={16} /> Workspace
          </Link>
          <Link to="/">
            Website <ArrowRight size={15} />
          </Link>
        </nav>
      </header>
      {children}
      <footer className="pp-footer">
        TruBuild · Built for life.{" "}
        <span>
          {staff
            ? "Customer information belongs in the connected, authorised workspace."
            : "Material estimates exclude labour and unlisted application stages."}
        </span>
      </footer>
    </div>
  );
}
function Notice({ children, error = false }) {
  return (
    <div
      className={`pp-notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="pp-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Results({ estimate }) {
  return (
    <>
      <div className="pp-result-heading">
        <div>
          <span>NET APPLICATION AREA</span>
          <strong>
            {fmt(estimate.measurement.areaM2)} <small>m²</small>
          </strong>
        </div>
        <div>
          <span>RULE VERSION</span>
          <strong>
            {estimate.ruleVersion}
            <small>
              {" "}
              · {estimate.technicalReview ? "Demonstration" : "Published"}
            </small>
          </strong>
        </div>
      </div>
      <div className="pp-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product / stage</th>
              <th>Theoretical</th>
              <th>With allowance</th>
              <th>Purchase</th>
              <th>Surplus</th>
            </tr>
          </thead>
          <tbody>
            {estimate.components.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <small>
                    {c.basis === "system"
                      ? "Complete-system rate"
                      : "Per-coat rate"}{" "}
                    · {c.waste}% allowance
                  </small>
                </td>
                <td>
                  {fmt(c.theoretical)} {c.unit}
                </td>
                <td>
                  {fmt(c.adjusted)} {c.unit}
                </td>
                <td>
                  {c.purchase.packs.map((p) => (
                    <span key={p.id}>
                      {p.count} × {p.size} {c.unit}
                      <br />
                    </span>
                  ))}
                </td>
                <td>
                  {fmt(c.purchase.surplus)} {c.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pp-caption">
        Pack objective:{" "}
        {estimate.components[0].purchase.objective === "surplus"
          ? "Lowest surplus"
          : estimate.components[0].purchase.objective === "packs"
            ? "Fewest packs"
            : "Lowest approved cost"}
        . Complete packs only.
      </p>
      <details className="pp-details" open>
        <summary>Measurements & assumptions</summary>
        {estimate.measurement.breakdown.map((z, i) => (
          <p key={i}>
            {z.name}: {fmt(z.grossM2)} − {fmt(z.excludedM2)} ={" "}
            <strong>{fmt(z.netM2)} m²</strong>
          </p>
        ))}
        {estimate.assumptions.map((a) => (
          <p key={a}>{a}</p>
        ))}
      </details>
    </>
  );
}
export function CalculatorPortal() {
  const [rules, setRules] = useState(connected ? [] : demoRules),
    [ruleId, setRuleId] = useState("demo-adhesive"),
    [input, setInput] = useState(defaultInput),
    [step, setStep] = useState(1),
    [estimate, setEstimate] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [project, setProject] = useState("My project"),
    [saved, setSaved] = useState(null);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    pincode: "",
    customerType: "Homeowner",
    preferred: "Email",
    marketing: false,
    acknowledged: false,
  });
  const request = useRef(null);
  useEffect(() => {
    request.current = null;
  }, [contact, project, ruleId, input]);
  const [demo, setDemo] = useState(!connected);
  useEffect(() => {
    if (!connected) return;
    portal("catalogue")
      .then((d) => {
        setRules(d.rules);
        setRuleId(d.rules[0]?.id || "");
      })
      .catch((e) => setError(e.message));
  }, []);
  const rule = rules.find((r) => r.id === ruleId) || rules[0];
  const change = (key, value) => {
    setInput((v) => ({ ...v, [key]: value }));
    setEstimate(null);
    setSaved(null);
    request.current = null;
  };
  const updateZone = (i, key, value) =>
    change(
      "zones",
      input.zones.map((z, j) => (j === i ? { ...z, [key]: value } : z)),
    );
  let area;
  try {
    area = measure(input.zones, input.unit).areaM2;
  } catch {}
  async function run() {
    setError("");
    setBusy(true);
    try {
      const value = demo
        ? calculate(rule, input)
        : (await portal("calculate", { ruleId: rule.id, input })).estimate;
      setEstimate(value);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function usagePdf() {
    try {
      downloadPdf(
        quotePdf({
          number: "USAGE-PREVIEW",
          revision: 1,
          estimate,
          project,
          demo,
          type: "USAGE ESTIMATE",
          createdAt: stamp(),
        }),
        "trubuild-usage-estimate.pdf",
      );
    } catch (e) {
      setError(e.message);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const c = normalizeContact(contact);
      if (demo) {
        setSaved({ id: "DEMO-" + Date.now(), demo: true });
        return;
      }
      request.current ??= crypto.randomUUID();
      const params = new URLSearchParams(window.location.search);
      const source = {
        landing: window.location.pathname,
        referrer: document.referrer ? new URL(document.referrer).origin : "",
        ...Object.fromEntries(
          ["utm_source", "utm_medium", "utm_campaign"].map((k) => [
            k,
            params.get(k) || "",
          ]),
        ),
      };
      setSaved(
        await portal("capture", {
          requestId: request.current,
          ruleId: rule.id,
          input,
          contact: c,
          project,
          source,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="pp-customer">
        <div className="pp-title">
          <span className="pp-kicker">PLAN YOUR PROJECT</span>
          <h1>
            Know what you need.
            <br />
            Build with confidence.
          </h1>
          <p>
            Measure your space, review quantities, and bring the details to your
            sales team.
          </p>
        </div>
        {demo && (
          <Notice>
            Demonstration mode · All rates, products and prices here are
            illustrative. No enquiry is sent and no official offer is issued.
          </Notice>
        )}
        {!demo && !rules.length && (
          <Notice>
            No approved calculators are published yet.{" "}
            <button
              onClick={() => {
                setDemo(true);
                setRules(demoRules);
                setRuleId("demo-adhesive");
              }}
            >
              Explore the demonstration
            </button>
          </Notice>
        )}
        <ol className="pp-steps">
          {[
            "Project & measurements",
            "Quantity estimate",
            "Request a quotation",
          ].map((label, i) => (
            <li key={label} className={step === i + 1 ? "active" : ""}>
              <button
                disabled={i > 0 && !estimate}
                onClick={() => setStep(i + 1)}
              >
                <span>{i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        {error && <Notice error>{error}</Notice>}
        {step === 1 && rule && (
          <div className="pp-calculator-grid">
            <section className="pp-panel">
              <h2>What are you working on?</h2>
              <div className="pp-applications">
                {rules.map((r) => (
                  <button
                    key={r.id}
                    className={rule.id === r.id ? "selected" : ""}
                    onClick={() => {
                      setRuleId(r.id);
                      change("waste", r.components[0].wasteDefault);
                    }}
                  >
                    <span>{r.category}</span>
                    <strong>{r.name}</strong>
                    {rule.id === r.id && <Check size={16} />}
                  </button>
                ))}
              </div>
              <div className="pp-section-title">
                <h2>Your measurements</h2>
                <select
                  aria-label="Measurement units"
                  value={input.unit}
                  onChange={(e) => {
                    const from = input.unit,
                      to = e.target.value,
                      factor = to === "m" ? 0.3048 : 1 / 0.3048;
                    change(
                      "zones",
                      input.zones.map((z) => ({
                        ...z,
                        area: Number(z.area) * factor ** 2,
                        length: Number(z.length) * factor,
                        width: Number(z.width) * factor,
                        excluded: Number(z.excluded) * factor ** 2,
                      })),
                    );
                    setInput((v) => ({ ...v, unit: to }));
                  }}
                >
                  <option value="m">Metres / m²</option>
                  <option value="ft">Feet / ft²</option>
                </select>
              </div>
              <Field label="Project name">
                <input
                  value={project}
                  maxLength={120}
                  onChange={(e) => setProject(e.target.value)}
                />
              </Field>
              {input.zones.map((z, i) => (
                <div className="pp-zone" key={i}>
                  <div className="pp-zone-heading">
                    <input
                      aria-label={`Zone ${i + 1} name`}
                      value={z.name}
                      maxLength={80}
                      onChange={(e) => updateZone(i, "name", e.target.value)}
                    />
                    {input.zones.length > 1 && (
                      <button
                        aria-label={`Remove zone ${i + 1}`}
                        onClick={() =>
                          change(
                            "zones",
                            input.zones.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="pp-fields">
                    <Field label="Measure by">
                      <select
                        value={z.mode}
                        onChange={(e) => updateZone(i, "mode", e.target.value)}
                      >
                        <option value="direct">Direct area</option>
                        <option value="dimensions">
                          Length × width / height
                        </option>
                      </select>
                    </Field>
                    {z.mode === "direct" ? (
                      <Field
                        label={`Area (${input.unit === "m" ? "m²" : "ft²"})`}
                      >
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={z.area}
                          onChange={(e) =>
                            updateZone(i, "area", e.target.value)
                          }
                        />
                      </Field>
                    ) : (
                      <>
                        <Field label={`Length (${input.unit})`}>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={z.length}
                            onChange={(e) =>
                              updateZone(i, "length", e.target.value)
                            }
                          />
                        </Field>
                        <Field label={`Width / height (${input.unit})`}>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={z.width}
                            onChange={(e) =>
                              updateZone(i, "width", e.target.value)
                            }
                          />
                        </Field>
                      </>
                    )}
                    <Field
                      label={`Deduct openings (${input.unit === "m" ? "m²" : "ft²"})`}
                    >
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={z.excluded}
                        onChange={(e) =>
                          updateZone(i, "excluded", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                className="pp-text-button"
                disabled={input.zones.length >= 30}
                onClick={() =>
                  change("zones", [
                    ...input.zones,
                    {
                      name: `Zone ${input.zones.length + 1}`,
                      mode: "direct",
                      area: 10,
                      length: 5,
                      width: 2,
                      excluded: 0,
                    },
                  ])
                }
              >
                <Plus size={16} /> Add a room or zone
              </button>
              <h2>Application details</h2>
              <div className="pp-fields">
                {rule.components.some((c) => c.method === "grout") &&
                  [
                    ["tileLength", "Tile length (mm)"],
                    ["tileWidth", "Tile width (mm)"],
                    ["jointWidth", "Joint width (mm)"],
                    ["jointDepth", "Joint depth (mm)"],
                  ].map(([k, label]) => (
                    <Field key={k} label={label}>
                      <input
                        type="number"
                        min="1"
                        value={input[k]}
                        onChange={(e) => change(k, e.target.value)}
                      />
                    </Field>
                  ))}
                {rule.components.some((c) => c.method === "sealant") &&
                  [
                    ["jointLength", "Joint length (m)"],
                    ["jointWidth", "Joint width (mm)"],
                    ["jointDepth", "Joint depth (mm)"],
                  ].map(([k, label]) => (
                    <Field key={k} label={label}>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={input[k]}
                        onChange={(e) => change(k, e.target.value)}
                      />
                    </Field>
                  ))}
                {rule.components.some((c) => c.method === "thickness") && (
                  <Field label="Thickness (mm)">
                    <input
                      type="number"
                      value={input.thickness}
                      onChange={(e) => change("thickness", e.target.value)}
                    />
                  </Field>
                )}
                <Field
                  label="Wastage allowance (%)"
                  hint={`Permitted range: 0–${Math.min(...rule.components.map((c) => c.wasteMax))}%`}
                >
                  <input
                    type="number"
                    min="0"
                    max={Math.min(...rule.components.map((c) => c.wasteMax))}
                    value={input.waste}
                    onChange={(e) => change("waste", e.target.value)}
                  />
                </Field>
                <Field label="Pack objective">
                  <select
                    value={input.objective}
                    onChange={(e) => change("objective", e.target.value)}
                  >
                    <option value="surplus">Lowest surplus</option>
                    <option value="packs">Fewest packs</option>
                  </select>
                </Field>
              </div>
            </section>
            <aside className="pp-summary">
              <span className="pp-kicker">PROJECT SUMMARY</span>
              <h2>{project || "Your project"}</h2>
              <div className="pp-big-number">
                {area == null ? "—" : fmt(area)}
                <small>m² net area</small>
              </div>
              <p>
                {input.zones.length} zone{input.zones.length !== 1 ? "s" : ""} ·{" "}
                {rule.name}
              </p>
              <ul>
                {rule.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <button className="pp-primary" disabled={busy} onClick={run}>
                {busy ? "Calculating…" : "Calculate quantities"}
                <ArrowRight size={18} />
              </button>
              <small>No contact details needed to calculate.</small>
            </aside>
          </div>
        )}
        {step === 2 && estimate && (
          <section className="pp-panel">
            <h2>Your material estimate</h2>
            <Results estimate={estimate} />
            <Notice>
              Pricing is not yet configured. Quantity estimates remain
              available; official quotations require commercial review.
            </Notice>
            <div className="pp-actions">
              <button onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Edit measurements
              </button>
              <button onClick={usagePdf}>
                <Download size={16} /> Download usage PDF
              </button>
              <button className="pp-primary" onClick={() => setStep(3)}>
                Request a quotation <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}
        {step === 3 && estimate && (
          <section className="pp-panel pp-contact">
            <h2>Keep your project moving.</h2>
            <p>
              Your measurements, quantities and assumptions travel with your
              enquiry.
            </p>
            {saved ? (
              <Notice>
                {saved.demo
                  ? "Demo request validated. Nothing was submitted or stored as a live lead."
                  : `Enquiry saved. Reference ${saved.id}. ${saved.assignment === "review" ? "Your project is awaiting team assignment." : "Your project has been assigned."}`}
                <div className="pp-actions">
                  <button
                    onClick={() => {
                      setSaved(null);
                      setStep(2);
                    }}
                  >
                    Return to estimate
                  </button>
                  <Link to="/workspace">
                    Explore sales workspace <ArrowRight size={16} />
                  </Link>
                </div>
              </Notice>
            ) : (
              <form onSubmit={submit}>
                <div className="pp-fields">
                  {[
                    ["name", "Name"],
                    ["email", "Email"],
                    ["phone", "Phone with country code"],
                    ["pincode", "Project pincode"],
                  ].map(([k, label]) => (
                    <Field key={k} label={label}>
                      <input
                        value={contact[k]}
                        required={k === "name" || k === "pincode"}
                        type={k === "email" ? "email" : "text"}
                        maxLength={k === "pincode" ? 6 : 100}
                        onChange={(e) => {
                          setContact((v) => ({ ...v, [k]: e.target.value }));
                          request.current = null;
                        }}
                      />
                    </Field>
                  ))}
                  <Field label="Customer type">
                    <select
                      value={contact.customerType}
                      onChange={(e) =>
                        setContact((v) => ({
                          ...v,
                          customerType: e.target.value,
                        }))
                      }
                    >
                      {[
                        "Homeowner",
                        "Contractor",
                        "Architect",
                        "Dealer",
                        "Business",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Preferred contact">
                    <select
                      value={contact.preferred}
                      onChange={(e) =>
                        setContact((v) => ({ ...v, preferred: e.target.value }))
                      }
                    >
                      <option>Email</option>
                      <option>Phone</option>
                    </select>
                  </Field>
                </div>
                <label className="pp-check">
                  <input
                    type="checkbox"
                    required
                    checked={contact.acknowledged}
                    onChange={(e) =>
                      setContact((v) => ({
                        ...v,
                        acknowledged: e.target.checked,
                      }))
                    }
                  />
                  I understand my details will be used to respond to this
                  project enquiry.
                </label>
                <label className="pp-check">
                  <input
                    type="checkbox"
                    checked={contact.marketing}
                    onChange={(e) =>
                      setContact((v) => ({ ...v, marketing: e.target.checked }))
                    }
                  />
                  I would also like optional product and marketing updates.
                </label>
                <div className="pp-actions">
                  <button type="button" onClick={() => setStep(2)}>
                    Back to estimate
                  </button>
                  <button className="pp-primary" disabled={busy}>
                    {busy
                      ? "Saving…"
                      : demo
                        ? "Validate demo request"
                        : "Submit quotation request"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </Shell>
  );
}
function normaliseWorkspace(data) {
  return {
    leads: data.leads.map((l) => ({
      ...l,
      contact:
        l.context.contactAtEnquiry ||
        data.contacts.find((c) => c.id === l.contact_id)?.details ||
        {},
      project:
        data.projects.find((p) => p.id === l.project_id)?.name || "Project",
      estimate: data.estimates.find((e) => e.id === l.estimate_id)?.snapshot,
      owner: l.owner_id,
      nextAction: l.next_action,
      dueAt: l.due_at,
      createdAt: l.created_at,
      source: l.context.source?.utm_source || "Website",
      activities: data.activities.filter((a) => a.lead_id === l.id),
      tasks: data.tasks.filter((t) => t.lead_id === l.id),
      quotes: data.quotations
        .filter((q) => q.lead_id === l.id)
        .map((q) => ({
          ...q,
          createdBy: q.created_by,
          expiresAt: q.expires_at,
          documentStatus:
            data.document_jobs.find((j) => j.quote_id === q.id)?.status ||
            "not requested",
        })),
    })),
    rules: data.rules,
    prices: data.prices,
    member: data.member,
  };
}
export function SalesWorkspace() {
  const [mode, setMode] = useState("login"),
    [view, setView] = useState("Overview"),
    [data, setData] = useState(null),
    [selected, setSelected] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All stages"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState("");
  const [stage, setStage] = useState("Contacted"),
    [details, setDetails] = useState({}),
    [note, setNote] = useState(""),
    [kind, setKind] = useState("Call attempted"),
    [task, setTask] = useState(""),
    [due, setDue] = useState(""),
    [discount, setDiscount] = useState("0"),
    [reason, setReason] = useState(""),
    [owner, setOwner] = useState(""),
    [links, setLinks] = useState({});
  const [configKind, setConfigKind] = useState("rule"),
    [configText, setConfigText] = useState(
      JSON.stringify(demoRules[0], null, 2),
    );
  const quoteRequest = useRef(null);
  async function refresh() {
    const next = normaliseWorkspace(await portal("workspace"));
    setData(next);
    return next;
  }
  async function work(fn) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const saveDemo = (next) => {
    localStorage.setItem("trubuild-portal-demo-v1", JSON.stringify(next));
    setData(next);
  };
  function openDemo() {
    try {
      let saved = JSON.parse(
        localStorage.getItem("trubuild-portal-demo-v1") || "null",
      );
      if (!saved?.leads) saved = seedWorkspace();
      setData(saved);
      setMode("demo");
    } catch {
      setData(seedWorkspace());
      setMode("demo");
    }
  }
  const lead = data?.leads.find((l) => l.id === selected);
  const changeDemo = (id, fn) => {
    const next = structuredClone(data);
    const l = next.leads.find((x) => x.id === id);
    fn(l);
    l.version++;
    saveDemo(next);
  };
  async function mutate(operation, payload) {
    if (mode === "demo") {
      changeDemo(lead.id, (l) => {
        l.activities ??= [];
        if (operation === "stage") {
          validateStage(
            payload.stage,
            payload,
            l.quotes.some((q) => q.status === "Issued"),
          );
          l.stage = payload.stage;
          l.outcome = payload;
          if (payload.stage === "Qualified") {
            l.nextAction = payload.nextAction;
            l.dueAt = payload.dueAt;
            l.tasks ??= [];
            l.tasks.push({
              id: crypto.randomUUID(),
              title: payload.nextAction,
              due_at: payload.dueAt,
              status: "open",
            });
          }
          if (
            ["Won", "Lost", "Invalid", "Duplicate", "Unserviceable"].includes(
              payload.stage,
            )
          )
            l.tasks = (l.tasks || []).map((t) => ({
              ...t,
              status: "cancelled",
            }));
        }
        if (operation === "assign") l.owner = payload.ownerId;
        if (operation === "activity")
          l.activities.push({
            id: crypto.randomUUID(),
            kind: payload.kind,
            note: payload.note,
            manual: true,
            created_at: stamp(),
          });
        if (operation === "task") {
          l.tasks ??= [];
          l.tasks.push({
            id: crypto.randomUUID(),
            title: payload.title,
            due_at: payload.dueAt,
            status: "open",
          });
          l.nextAction = payload.title;
          l.dueAt = payload.dueAt;
        }
        if (operation === "complete_task")
          l.tasks = l.tasks.map((t) =>
            t.id === payload.taskId
              ? { ...t, status: "done", outcome: payload.outcome }
              : t,
          );
        if (operation !== "activity")
          l.activities.push({
            id: crypto.randomUUID(),
            kind: operation,
            note: JSON.stringify(payload),
            manual: true,
            created_at: stamp(),
          });
      });
    } else {
      await portal("mutate", {
        leadId: lead.id,
        version: lead.version,
        operation,
        data: payload,
      });
      await refresh();
    }
    setMessage(
      "Change saved" + (mode === "demo" ? " in the local demonstration." : "."),
    );
  }
  async function createQuote() {
    const bps = Math.round(Number(discount) * 100);
    if (!Number.isFinite(bps) || bps < 0 || bps > 10000)
      throw new Error("Enter a discount from 0 to 100%.");
    if (lead.quotes.length && !reason.trim())
      throw new Error("Enter a reason for the new revision.");
    if (mode === "demo") {
      const estimate =
        lead.estimate ||
        calculate(
          demoRules.find((r) => r.id === lead.ruleId),
          lead.input,
        );
      const priced = priceEstimate(estimate, demoPrices, {
        discountBps: bps,
        territory: lead.contact.pincode,
      });
      changeDemo(lead.id, (l) => {
        l.quotes.push({
          id: crypto.randomUUID(),
          number: `DEMO-${l.id}`,
          revision: l.quotes.length + 1,
          status: priced.needsApproval ? "Pending approval" : "Draft",
          createdBy: "demo-sales",
          version: 1,
          expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          reason,
          snapshot: {
            ...priced,
            estimate,
            project: l.project,
            customer: l.contact,
            type: "DEMONSTRATION QUOTATION",
            demo: true,
            createdAt: stamp(),
          },
        });
      });
    } else {
      quoteRequest.current ??= {
        id: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      };
      await portal("create_quote", {
        leadId: lead.id,
        version: lead.version,
        requestId: quoteRequest.current.id,
        discountBps: bps,
        expiresAt: quoteRequest.current.expiresAt,
        reason,
      });
      quoteRequest.current = null;
      await refresh();
    }
    setReason("");
    setMessage("New revision created. Existing revisions remain unchanged.");
  }
  async function transition(q, operation) {
    if (mode === "demo") {
      changeDemo(lead.id, (l) => {
        const target = l.quotes.find((x) => x.id === q.id);
        if (operation === "approve") {
          if (target.status !== "Pending approval")
            throw new Error("No approval is pending.");
          target.approvedBy = "demo-manager";
          target.status = "Approved";
        }
        if (operation === "issue") {
          if (
            !["Draft", "Approved"].includes(target.status) ||
            (target.snapshot.needsApproval && !target.approvedBy)
          )
            throw new Error("Approval required before issue.");
          target.status = "Issued";
          target.issuedAt = stamp();
          target.documentStatus = "ready";
        }
        if (operation === "withdraw") target.status = "Withdrawn";
        target.version++;
        l.activities.push({
          id: crypto.randomUUID(),
          kind: "Quotation " + operation,
          note: `Revision ${q.revision}; sample actor ${operation === "approve" ? "demo-manager" : "demo-sales"}`,
          manual: true,
          created_at: stamp(),
        });
      });
    } else {
      const result = await portal("quote_transition", {
        quoteId: q.id,
        version: q.version,
        operation,
      });
      if (result.token)
        setLinks((v) => ({
          ...v,
          [q.id]: window.location.origin + "/quotation/" + result.token,
        }));
      await refresh();
    }
  }
  async function pdf(q) {
    if (mode === "demo")
      downloadPdf(
        quotePdf({
          ...q.snapshot,
          number: q.number,
          revision: q.revision,
          issuedAt: q.issuedAt,
          expiresAt: q.expiresAt,
        }),
        `demo-quotation-r${q.revision}.pdf`,
      );
    else {
      const r = await portal("staff_download", { quoteId: q.id });
      window.open(r.url, "_blank", "noopener,noreferrer");
    }
  }
  const active = (data?.leads || []).filter(
    (l) =>
      !["Won", "Lost", "Invalid", "Duplicate", "Unserviceable"].includes(
        l.stage,
      ),
  );
  const overdue = active.filter(
    (l) => l.dueAt && new Date(l.dueAt) < new Date(),
  );
  const unassigned = active.filter((l) => !l.owner);
  const won = (data?.leads || []).filter((l) => l.stage === "Won");
  const filtered = (data?.leads || []).filter(
    (l) =>
      (filter === "All stages" || l.stage === filter) &&
      `${l.project} ${l.contact.name} ${l.contact.pincode}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Shell staff>
      {mode === "login" ? (
        <div className="pp-login">
          <span className="pp-kicker">TEAM WORKSPACE</span>
          <h1>
            Every project.
            <br />A clear next step.
          </h1>
          <p>Manage enquiries, quotations and follow-ups in one place.</p>
          {!connected && (
            <Notice>
              Live authentication is not configured yet. Explore the local
              demonstration using sample records.
            </Notice>
          )}
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              work(async () => {
                await signIn(email, password);
                await refresh();
                setPassword("");
                setMode("live");
              });
            }}
          >
            <Field label="Work email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <button className="pp-primary" disabled={busy || !connected}>
              Sign in securely <ArrowRight size={17} />
            </button>
          </form>
          <button className="pp-secondary" onClick={openDemo}>
            Explore sample workspace
          </button>
        </div>
      ) : (
        <div className="pp-workspace">
          <aside className="pp-sidebar">
            <span className="pp-kicker">SALES OPERATIONS</span>
            {[
              ["Overview", LayoutDashboard],
              ["Leads", Users],
              ["Quotations", FileText],
              ["Follow-ups", Clock],
              ["Administration", Settings],
            ].map(([name, Icon]) => (
              <button
                key={name}
                className={view === name ? "active" : ""}
                onClick={() => {
                  setView(name);
                  setSelected(null);
                }}
              >
                <Icon size={18} />
                {name}
              </button>
            ))}
            <div className="pp-sidebar-bottom">
              <span>
                {mode === "demo" ? "Sample organisation" : data?.member.role}
              </span>
              <button
                onClick={() =>
                  work(async () => {
                    if (mode === "live") await signOut();
                    setMode("login");
                    setData(null);
                    setSelected(null);
                  })
                }
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </aside>
          <div className="pp-work">
            <div className="pp-section-title">
              <div>
                <span className="pp-kicker">
                  TRUBUILD / {mode === "demo" ? "DEMONSTRATION" : "WORKSPACE"}
                </span>
                <h1>{lead ? lead.project : view}</h1>
              </div>
              {mode === "live" && (
                <button onClick={() => work(refresh)}>Refresh</button>
              )}
            </div>
            {mode === "demo" ? (
              <Notice>
                Sample workspace · Changes save only in this browser. Use
                fictional data. Prices are illustrative; no customer messages
                are sent.
              </Notice>
            ) : (
              <details className="pp-details">
                <summary>Verify MFA before making changes</summary>
                <div className="pp-actions">
                  <input
                    aria-label="MFA code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit authenticator code"
                  />
                  <button
                    onClick={() =>
                      work(async () => {
                        await verifyMfa(code);
                        setCode("");
                        setMessage("MFA verified for this session.");
                      })
                    }
                  >
                    Verify code
                  </button>
                </div>
              </details>
            )}
            {error && <Notice error>{error}</Notice>}
            {message && <Notice>{message}</Notice>}
            {!lead && view === "Overview" && (
              <>
                <div className="pp-metrics">
                  {[
                    [active.length, "Active opportunities"],
                    [unassigned.length, "Unassigned"],
                    [overdue.length, "Overdue follow-ups"],
                    [won.length, "Confirmed wins"],
                  ].map(([n, label]) => (
                    <div key={label}>
                      <strong>{n}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="pp-panel">
                  <h2>Attention needed</h2>
                  {active
                    .filter(
                      (l) =>
                        !l.owner ||
                        !l.nextAction ||
                        !l.dueAt ||
                        overdue.includes(l),
                    )
                    .map((l) => (
                      <button
                        key={l.id}
                        className="pp-attention"
                        onClick={() => {
                          setSelected(l.id);
                          setView("Leads");
                        }}
                      >
                        <span>
                          <strong>{l.project}</strong>
                          <small>
                            {l.contact.name} · {l.contact.pincode}
                          </small>
                        </span>
                        <span>
                          {!l.owner
                            ? "Assign an owner"
                            : !l.dueAt
                              ? "Set next-action deadline"
                              : "Follow-up overdue"}{" "}
                          <ArrowRight size={16} />
                        </span>
                      </button>
                    ))}
                  {!active.length && <p>No active opportunities.</p>}
                </div>
                <div className="pp-panel">
                  <h2>Pipeline by stage</h2>
                  <div className="pp-pipeline">
                    {stages.slice(0, 10).map((s) => (
                      <div key={s}>
                        <span>{s}</span>
                        <strong>
                          {data.leads.filter((l) => l.stage === s).length}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p className="pp-caption">
                    Counts are opportunities, not quotation revisions. Won
                    records require order evidence.
                  </p>
                </div>
              </>
            )}
            {!lead && view === "Leads" && (
              <section className="pp-panel">
                <div className="pp-filters">
                  <label>
                    <Search size={17} />
                    <input
                      aria-label="Search leads"
                      placeholder="Search project, customer, pincode"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filter lead stage"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>All stages</option>
                    {stages.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="pp-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Project / customer</th>
                        <th>Stage</th>
                        <th>Owner</th>
                        <th>Next action</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <strong>{l.project}</strong>
                            <small>
                              {l.contact.name} · {l.contact.pincode}
                            </small>
                          </td>
                          <td>
                            <span className="pp-badge">{l.stage}</span>
                          </td>
                          <td>{l.owner || "Unassigned"}</td>
                          <td>
                            {l.nextAction || "Not set"}
                            <small>
                              {l.dueAt
                                ? new Date(l.dueAt).toLocaleString()
                                : "Deadline required"}
                            </small>
                          </td>
                          <td>
                            <button
                              aria-label={`Open ${l.project}`}
                              onClick={() => setSelected(l.id)}
                            >
                              <ArrowRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered.length && <p>No leads match these filters.</p>}
                </div>
              </section>
            )}
            {!lead && view === "Quotations" && (
              <section className="pp-panel">
                <h2>Quotation register</h2>
                {data.leads.flatMap((l) =>
                  l.quotes.map((q) => (
                    <button
                      key={q.id}
                      className="pp-attention"
                      onClick={() => setSelected(l.id)}
                    >
                      <span>
                        <strong>
                          {q.number} · R{q.revision}
                        </strong>
                        <small>{l.project}</small>
                      </span>
                      <span>
                        {q.status} ·{" "}
                        {money(q.snapshot.totalMinor, q.snapshot.currency)}
                      </span>
                    </button>
                  )),
                )}
                {!data.leads.some((l) => l.quotes.length) && (
                  <p>
                    No quotations yet. Open a lead to create its first revision.
                  </p>
                )}
              </section>
            )}
            {!lead && view === "Follow-ups" && (
              <section className="pp-panel">
                <h2>Open follow-ups</h2>
                {data.leads.flatMap((l) =>
                  (l.tasks || [])
                    .filter((t) => t.status === "open")
                    .map((t) => (
                      <button
                        key={t.id}
                        className="pp-attention"
                        onClick={() => setSelected(l.id)}
                      >
                        <span>
                          <strong>{t.title}</strong>
                          <small>{l.project}</small>
                        </span>
                        <span>
                          {t.due_at
                            ? new Date(t.due_at).toLocaleString()
                            : "Set deadline"}
                        </span>
                      </button>
                    )),
                )}
                <p className="pp-caption">
                  Reminders are not connected to email or messaging providers.
                  Due dates use your displayed local timezone.
                </p>
              </section>
            )}
            {!lead && view === "Administration" && (
              <section className="pp-panel">
                <h2>Controlled configuration</h2>
                <p>
                  Draft product/pack and formula versions use fixed templates.
                  Publishing requires source, owner, effective date and passing
                  reference examples.
                </p>
                <div className="pp-fields">
                  <Field label="Configuration">
                    <select
                      value={configKind}
                      onChange={(e) => {
                        setConfigKind(e.target.value);
                        setConfigText(
                          JSON.stringify(
                            e.target.value === "rule"
                              ? demoRules[0]
                              : {
                                  ...demoPrices,
                                  status: "draft",
                                  seller: { legalName: "", address: "" },
                                  financeApproval: "",
                                },
                            null,
                            2,
                          ),
                        );
                      }}
                    >
                      <option value="rule">
                        Products, packs & calculation rule
                      </option>
                      <option value="price">Seller & price list</option>
                    </select>
                  </Field>
                </div>
                <Field label="Version definition (JSON)">
                  <textarea
                    className="pp-code"
                    value={configText}
                    spellCheck={false}
                    onChange={(e) => setConfigText(e.target.value)}
                  />
                </Field>
                <div className="pp-actions">
                  <button
                    onClick={() =>
                      work(async () => {
                        const d = JSON.parse(configText);
                        if (configKind === "rule") validateRule(d);
                        if (mode === "demo") {
                          saveDemo({
                            ...data,
                            configuration: {
                              ...data.configuration,
                              [configKind]: d,
                            },
                          });
                          setMessage("Draft saved in the demonstration only.");
                        } else {
                          await portal("save_config", {
                            kind: configKind,
                            status: "draft",
                            definition: d,
                          });
                          await refresh();
                          setMessage("Draft version saved.");
                        }
                      })
                    }
                  >
                    Save draft version
                  </button>
                  <button
                    className="pp-primary"
                    onClick={() =>
                      work(async () => {
                        const d = JSON.parse(configText);
                        if (configKind === "rule") validateReferences(d);
                        if (mode === "demo")
                          throw new Error(
                            "Publication is disabled in demonstration mode. Configure approved data and the live organisation first.",
                          );
                        await portal("save_config", {
                          kind: configKind,
                          status: "published",
                          definition: d,
                        });
                        await refresh();
                        setMessage("Validated version published.");
                      })
                    }
                  >
                    Validate & publish
                  </button>
                </div>
                <div className="pp-readiness">
                  <h3>Launch configuration</h3>
                  {[
                    "Approved technical data and reference cases",
                    "Seller identity, finance-approved prices and taxes",
                    "Staff accounts, MFA and territory membership",
                    "Business-hour SLAs and escalation ownership",
                    "Consent wording, retention and delivery providers",
                    "Supabase migration, private bucket and worker schedule",
                  ].map((s) => (
                    <p key={s}>
                      <span className="pp-badge">Required</span> {s}
                    </p>
                  ))}
                </div>
              </section>
            )}
            {lead && (
              <>
                <button
                  className="pp-text-button"
                  onClick={() => setSelected(null)}
                >
                  <ArrowLeft size={16} /> Back to {view.toLowerCase()}
                </button>
                <div className="pp-lead-grid">
                  <div>
                    <section className="pp-panel">
                      <div className="pp-section-title">
                        <h2>{lead.contact.name}</h2>
                        <span className="pp-badge">{lead.stage}</span>
                      </div>
                      <p>
                        {lead.contact.email} {lead.contact.phone}
                      </p>
                      <p>
                        {lead.contact.pincode} · {lead.contact.customerType} ·
                        Contact unverified
                      </p>
                      <p>
                        Owner: <strong>{lead.owner || "Unassigned"}</strong>
                      </p>
                      <details className="pp-details">
                        <summary>Assignment</summary>
                        <Field
                          label={
                            mode === "demo"
                              ? "Sample owner"
                              : "Eligible staff user ID"
                          }
                        >
                          <input
                            value={owner}
                            placeholder={
                              mode === "demo"
                                ? "Demo sales executive"
                                : "User UUID"
                            }
                            onChange={(e) => setOwner(e.target.value)}
                          />
                        </Field>
                        <button
                          onClick={() =>
                            work(() => {
                              if (!owner.trim())
                                throw new Error("Enter an owner.");
                              return mutate("assign", {
                                ownerId: owner,
                                reason: "Assignment from lead workspace",
                              });
                            })
                          }
                        >
                          Assign owner
                        </button>
                      </details>
                      <h3>Update stage</h3>
                      <Field label="Lead stage">
                        <select
                          value={stage}
                          onChange={(e) => setStage(e.target.value)}
                        >
                          {stages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      {(stage === "Qualified"
                        ? ["need", "timeline", "nextAction", "dueAt"]
                        : stage === "Won"
                          ? ["orderReference", "orderValue"]
                          : stage === "Lost"
                            ? ["lostReason"]
                            : []
                      ).map((k) => (
                        <Field
                          key={k}
                          label={
                            {
                              need: "Project need",
                              timeline: "Purchase timeline",
                              nextAction: "Next action",
                              dueAt: "Next-action deadline",
                              orderReference: "Order reference",
                              orderValue: "Confirmed order value",
                              lostReason: "Lost reason",
                            }[k]
                          }
                        >
                          {k === "lostReason" ? (
                            <select
                              value={details[k] || ""}
                              onChange={(e) =>
                                setDetails((v) => ({
                                  ...v,
                                  [k]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Choose a reason</option>
                              {[
                                "Price",
                                "Competitor",
                                "Timing",
                                "Project cancelled",
                                "Other",
                              ].map((x) => (
                                <option key={x}>{x}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={k === "dueAt" ? "datetime-local" : "text"}
                              value={details[k] || ""}
                              onChange={(e) =>
                                setDetails((v) => ({
                                  ...v,
                                  [k]: e.target.value,
                                }))
                              }
                            />
                          )}
                        </Field>
                      ))}
                      <button
                        className="pp-primary"
                        disabled={busy}
                        onClick={() =>
                          work(() => mutate("stage", { ...details, stage }))
                        }
                      >
                        Save stage
                      </button>
                    </section>
                    <section className="pp-panel">
                      <h2>Project calculation</h2>
                      <Results
                        estimate={
                          lead.estimate ||
                          calculate(
                            demoRules.find((r) => r.id === lead.ruleId),
                            lead.input,
                          )
                        }
                      />
                    </section>
                    <section className="pp-panel">
                      <h2>Quotation history</h2>
                      {lead.quotes.map((q) => (
                        <article key={q.id} className="pp-quote-card">
                          <div className="pp-section-title">
                            <strong>
                              {q.number} · Revision {q.revision}
                            </strong>
                            <span className="pp-badge">{q.status}</span>
                          </div>
                          <p>
                            {money(q.snapshot.totalMinor, q.snapshot.currency)}{" "}
                            · {q.snapshot.discountBps / 100}% discount · expires{" "}
                            {new Date(q.expiresAt).toLocaleDateString()}
                          </p>
                          <small>
                            {q.reason || "First revision"} · PDF:{" "}
                            {q.documentStatus || "Not requested"}
                          </small>
                          <div className="pp-actions">
                            {q.status === "Pending approval" && (
                              <button
                                onClick={() =>
                                  work(() => transition(q, "approve"))
                                }
                              >
                                {mode === "demo"
                                  ? "Approve as separate demo manager"
                                  : "Approve exception"}
                              </button>
                            )}
                            {["Draft", "Approved"].includes(q.status) && (
                              <button
                                onClick={() =>
                                  work(() => transition(q, "issue"))
                                }
                              >
                                {mode === "demo"
                                  ? "Issue sample revision"
                                  : "Issue approved quotation"}
                              </button>
                            )}
                            {["Issued", "Accepted", "Declined"].includes(
                              q.status,
                            ) && (
                              <button onClick={() => work(() => pdf(q))}>
                                <Download size={15} /> PDF
                              </button>
                            )}
                            {q.status === "Issued" && (
                              <button
                                onClick={() =>
                                  work(() => transition(q, "withdraw"))
                                }
                              >
                                Withdraw
                              </button>
                            )}
                            {q.documentStatus === "failed" && (
                              <button
                                onClick={() =>
                                  work(() => transition(q, "retry_pdf"))
                                }
                              >
                                Retry PDF
                              </button>
                            )}
                          </div>
                          {links[q.id] && (
                            <Field label="Private customer link (copy now)">
                              <input
                                readOnly
                                value={links[q.id]}
                                onFocus={(e) => e.target.select()}
                              />
                            </Field>
                          )}
                        </article>
                      ))}
                      <h3>
                        Create{" "}
                        {lead.quotes.length ? "a new revision" : "a quotation"}
                      </h3>
                      <Field label="Discount (%)">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step=".01"
                          value={discount}
                          onChange={(e) => {
                            setDiscount(e.target.value);
                            quoteRequest.current = null;
                          }}
                        />
                      </Field>
                      <Field label="Revision / discount reason">
                        <input
                          value={reason}
                          onChange={(e) => {
                            setReason(e.target.value);
                            quoteRequest.current = null;
                          }}
                        />
                      </Field>
                      <button
                        className="pp-primary"
                        disabled={busy}
                        onClick={() => work(createQuote)}
                      >
                        Create frozen revision <Plus size={16} />
                      </button>
                    </section>
                  </div>
                  <aside>
                    <section className="pp-panel">
                      <h2>Next action</h2>
                      <p>
                        {lead.nextAction || "No next action"}
                        <small>
                          {lead.dueAt
                            ? new Date(lead.dueAt).toLocaleString()
                            : "Deadline not set"}
                        </small>
                      </p>
                      <Field label="Follow-up task">
                        <input
                          value={task}
                          onChange={(e) => setTask(e.target.value)}
                        />
                      </Field>
                      <Field label="Due date and time">
                        <input
                          type="datetime-local"
                          value={due}
                          onChange={(e) => setDue(e.target.value)}
                        />
                      </Field>
                      <button
                        onClick={() =>
                          work(async () => {
                            if (!task || !due)
                              throw new Error("Enter a task and deadline.");
                            await mutate("task", {
                              title: task,
                              dueAt: new Date(due).toISOString(),
                            });
                            setTask("");
                            setDue("");
                          })
                        }
                      >
                        Schedule follow-up
                      </button>
                      {(lead.tasks || []).map((t) => (
                        <div className="pp-task" key={t.id}>
                          <strong>{t.title}</strong>
                          <small>
                            {t.status} ·{" "}
                            {t.due_at
                              ? new Date(t.due_at).toLocaleString()
                              : "No deadline"}
                          </small>
                          {t.status === "open" && (
                            <button
                              onClick={() =>
                                work(() =>
                                  mutate("complete_task", {
                                    taskId: t.id,
                                    outcome: "Completed manually in workspace",
                                  }),
                                )
                              }
                            >
                              Mark completed
                            </button>
                          )}
                        </div>
                      ))}
                    </section>
                    <section className="pp-panel">
                      <h2>Record an activity</h2>
                      <Field label="Activity type">
                        <select
                          value={kind}
                          onChange={(e) => setKind(e.target.value)}
                        >
                          {[
                            "Call attempted",
                            "Call completed",
                            "Meeting",
                            "Site visit",
                            "Technical consultation",
                            "Sample",
                            "Quotation discussion",
                            "Internal note",
                          ].map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Internal note / outcome">
                        <textarea
                          value={note}
                          maxLength={4000}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </Field>
                      <button
                        onClick={() =>
                          work(async () => {
                            if (note.trim().length < 2)
                              throw new Error("Enter an activity note.");
                            await mutate("activity", { kind, note });
                            setNote("");
                          })
                        }
                      >
                        Record manually
                      </button>
                    </section>
                    <section className="pp-panel">
                      <h2>Activity timeline</h2>
                      {[...(lead.activities || [])].reverse().map((a) => (
                        <div className="pp-timeline" key={a.id}>
                          <strong>{a.kind}</strong>
                          <small>
                            {new Date(a.created_at).toLocaleString()} · Manually
                            recorded
                          </small>
                          <p>{a.note}</p>
                        </div>
                      ))}
                      {!lead.activities?.length && (
                        <p>No recorded activity yet.</p>
                      )}
                    </section>
                  </aside>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
export function QuotationPortal() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [intent, setIntent] = useState(false);
  const load = () =>
    portal("view_quote", { token }).then((d) => setQuote(d.quote));
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [token]);
  async function action(operation) {
    setBusy(true);
    setError("");
    try {
      if (operation === "accept" && !intent)
        throw new Error(
          "Confirm the exact revision and terms before recording purchase intent.",
        );
      await portal("customer_action", {
        token,
        revision: quote.revision,
        operation,
        note,
      });
      setStatus("Your request was recorded.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="pp-customer">
        <h1>Your quotation</h1>
        {error && <Notice error>{error}</Notice>}
        {status && <Notice>{status}</Notice>}
        {quote && (
          <section className="pp-panel">
            <h2>
              {quote.number} · Revision {quote.revision}
            </h2>
            <p>
              {quote.seller.legalName} · {quote.status} · Valid until{" "}
              {new Date(quote.expiresAt).toLocaleDateString()}
            </p>
            {!quote.current && (
              <Notice>
                This is an older revision. Request the current quotation from
                your sales contact.
              </Notice>
            )}
            <div className="pp-big-number">
              {money(quote.totalMinor, quote.currency)}
            </div>
            <Results estimate={quote.estimate} />
            <p>{quote.terms}</p>
            <div className="pp-actions">
              <button
                disabled={busy}
                onClick={async () => {
                  try {
                    const d = await portal("download_quote", { token });
                    window.open(d.url, "_blank", "noopener,noreferrer");
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                <Download size={16} /> Download PDF ({quote.documentStatus})
              </button>
              <button onClick={() => load().catch((e) => setError(e.message))}>
                Refresh document status
              </button>
            </div>
            {quote.current && quote.status === "Issued" && (
              <>
                <Field label="Question or revision request">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field>
                <label className="pp-check">
                  <input
                    type="checkbox"
                    checked={intent}
                    onChange={(e) => setIntent(e.target.checked)}
                  />
                  I have reviewed revision {quote.revision} and its terms. This
                  records purchase intent, not a binding order.
                </label>
                <div className="pp-actions">
                  <button disabled={busy} onClick={() => action("revision")}>
                    Request revision
                  </button>
                  <button disabled={busy} onClick={() => action("callback")}>
                    Request callback
                  </button>
                  <button disabled={busy} onClick={() => action("decline")}>
                    Decline
                  </button>
                  <button
                    className="pp-primary"
                    disabled={busy || !intent}
                    onClick={() => action("accept")}
                  >
                    Record purchase intent
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </Shell>
  );
}
