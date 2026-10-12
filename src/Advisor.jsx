import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  RotateCcw,
  House,
  Grid2X2,
  Droplets,
  Layers,
  HelpCircle,
} from "lucide-react";
import { tasks, questions, recommend, summary } from "./advisorRules.mjs";
import { products, enquiryUrl } from "./data";
import { Button, ProductGrid, Breadcrumb } from "./components";
import "./advisor-simple.css";
const icons = [House, Droplets, Grid2X2, Layers, HelpCircle];
export default function Advisor({ compare, toggle }) {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const qs = questions(answers.task),
    total = qs.length + 1,
    done = step >= total && !!answers.task;
  const q = qs[step - 1];
  const panel = useRef();
  useEffect(() => {
    if (step > 0) panel.current?.focus({ preventScroll: true });
  }, [step]);
  const result = recommend(answers);
  const matches = products.filter((p) => result.ids.includes(p.id));
  function pick(key, val) {
    // Changing an earlier answer clears later answers so the summary stays accurate.
    setAnswers(a => key === "task" ? { task: val } : {
      task: a.task,
      ...Object.fromEntries(qs.slice(0, step - 1).filter(item => a[item.key]).map(item => [item.key, a[item.key]])),
      [key]: val,
    });
    const needsHelp = key !== "task" && ["unsure", "other"].includes(val);
    setStep(needsHelp ? total : step + 1);
  }
  function restart() {
    setAnswers({});
    setStep(0);
  }
  return (
    <section className="advisor-page advisor-simple wrap">
      <Breadcrumb items={[{ label: "Find my product" }]} />
      <div className="advisor-layout">
        <aside className="advisor-sidebar">
          <span className="eyebrow">FIND MY PRODUCT</span>
          <h1>
            A few answers.
            <br />
            <em>The right direction.</em>
          </h1>
          <p>
            Tell us what you’re working on. We’ll help you find products to consider, or connect you with someone who can help.
          </p>
          <div className="advisor-progress" aria-label="Progress">
            <span>
              01 <b>Your task</b>
              {step > 0 && <Check size={15} />}
            </span>
            <span className={step > 0 ? "active" : ""}>
              02 <b>Your requirements</b>
              {done && <Check size={15} />}
            </span>
            <span className={done ? "active" : ""}>
              03 <b>Your options</b>
            </span>
          </div>
          {answers.task && (
            <details className="answers-summary"><summary>Your choices</summary>

              <p>{tasks.find((t) => t[0] === answers.task)?.[1]}</p>
              {qs.map(
                (x, i) =>
                  answers[x.key] && (
                    <div key={x.key}>
                      <span>
                        {x.options.find((o) => o[0] === answers[x.key])?.[1]}
                      </span>
                      <button onClick={() => setStep(i + 1)}>
                        Edit<span className="sr-only"> {x.title}</span>
                      </button>
                    </div>
                  ),
              )}
            </details>
          )}
          <div className="advisor-help">
            <p>Prefer to speak to someone?</p>
            <a href="tel:18003099393">
              1800 309 9393 <ArrowUpRight size={16} />
            </a>
          </div>
        </aside>
        <div className="advisor-main" key={step} ref={panel} tabIndex={-1}>
          {!done ? (
            <>
              <div className="step-meta">
                <span>
                  {step === 0
                    ? "START HERE"
                    : `QUESTION ${step} OF ${qs.length}`}
                </span>
                {step > 0 && (
                  <button onClick={restart}>
                    <RotateCcw size={14} /> Start over
                  </button>
                )}
              </div>
              <h2>{step === 0 ? "What do you need help with?" : q.title}</h2>
              <p className="muted">
                {step === 0
                  ? "Choose one to get started. Most paths take just 2–3 questions."
                  : "Choose the closest match. If you’re not sure, we can help you identify what you need."}
              </p>
              {step > 0 && <div className="advisor-step-track" role="progressbar" aria-label="Questions completed" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={step - 1}><span style={{width: `${((step - 1) / qs.length) * 100}%`}} /></div>}
              {q?.key === "size" && <p className="advisor-size-help">Measure one tile’s length and width. For reference: 30 cm = 300 mm; 60 cm = 600 mm.</p>}
              <div
                className={"choice-grid " + (step === 0 ? "task-choices" : "")}
              >
                {(step === 0 ? tasks : q.options).map((o, i) => {
                  const Icon = icons[i % icons.length];
                  return (
                    <button
                      key={o[0]}
                      className="choice"
                      aria-pressed={answers[step === 0 ? "task" : q.key] === o[0]}
                      onClick={() => pick(step === 0 ? "task" : q.key, o[0])}
                    >
                      {step === 0 && <Icon className="choice-icon" size={25} />}
                      {q?.key === "size" && o[0] !== "unsure" && <span className={"advisor-tile-size size-" + o[0]} aria-hidden="true" />}
                      <div>
                        <strong>{o[1]}</strong>
                        {o[2] && <span>{o[2]}</span>}
                      </div>
                      <ArrowRight size={20} />
                    </button>
                  );
                })}
              </div>
              {step > 0 && (
                <button
                  className="text-link advisor-back"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
            </>
          ) : (
            <>
              <div className="step-meta">
                <span>YOUR OPTIONS</span>
                <button onClick={restart}>
                  <RotateCcw size={15} /> Start over
                </button>
              </div>
              <h2>
                {matches.length
                  ? "Products to consider for your project."
                  : "Let’s help you choose."}
              </h2>
              <p>{matches.length ? "These options match the details you’ve shared. Check the requirements below before choosing." : "We need a little more information to suggest a suitable product. Send your answers to our team and we’ll help with the next step."}</p>
              {matches.length > 0 && <details className="advisor-match-explanation"><summary>Why these products?</summary><p>{result.reason}</p></details>}
              <div className="notice">
                <strong>
                  {matches.length ? "Before you choose" : "What happens next"}
                </strong>
                <p>{result.limitations}</p>
              </div>
              {matches.length > 0 && (
                <ProductGrid
                  items={matches}
                  compare={compare}
                  toggle={toggle}
                />
              )}
              <div className="advisor-result-actions">
                <Button
                  to={enquiryUrl(
                    matches.map((p) => p.name).join(", "),
                    summary(answers),
                  )}
                >
                  {matches.length
                    ? "Get help choosing"
                    : "Help me find my product"}
                </Button>
                {compare.length > 0 && (
                  <Link to="/compare" className="text-link">
                    Compare selected products <ArrowUpRight size={17} />
                  </Link>
                )}
                <button
                  className="text-link"
                  onClick={() => setStep(Math.max(0, qs.findLastIndex(item => answers[item.key]) + 1))}
                >
                  <ArrowLeft size={17} /> Edit answers
                </button>
              </div>
              <p className="fineprint">
                Your choices will be included in the enquiry, so you won’t need to explain everything again.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
