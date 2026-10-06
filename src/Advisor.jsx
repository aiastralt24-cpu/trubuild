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
    setAnswers((a) => (key === "task" ? { task: val } : { ...a, [key]: val }));
    setStep(step + 1);
  }
  function restart() {
    setAnswers({});
    setStep(0);
  }
  return (
    <section className="advisor-page wrap">
      <Breadcrumb items={[{ label: "Product Advisor" }]} />
      <div className="advisor-layout">
        <aside className="advisor-sidebar">
          <span className="eyebrow">PRODUCT ADVISOR</span>
          <h1>
            Find a product for
            <br />
            <em>your project.</em>
          </h1>
          <p>
            Start with your project. Discover products using published TruBuild
            application information.
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
            <div className="answers-summary">
              <h3>Your project so far</h3>
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
            </div>
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
                    : `QUESTION ${step + 1} OF ${total}`}
                </span>
                {step > 0 && (
                  <button onClick={restart}>
                    <RotateCcw size={14} /> Start over
                  </button>
                )}
              </div>
              <h2>{step === 0 ? "What are you working on?" : q.title}</h2>
              <p className="muted">
                {step === 0
                  ? "Choose the task that best describes your project."
                  : "Choose one option. Not sure? We’ll help you ask the right questions."}
              </p>
              <div
                className={"choice-grid " + (step === 0 ? "task-choices" : "")}
              >
                {(step === 0 ? tasks : q.options).map((o, i) => {
                  const Icon = icons[i % icons.length];
                  return (
                    <button
                      key={o[0]}
                      className="choice"
                      onClick={() => pick(step === 0 ? "task" : q.key, o[0])}
                    >
                      {step === 0 && <Icon className="choice-icon" size={25} />}
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
                  ? "A considered shortlist."
                  : "Let’s bring in an expert."}
              </h2>
              <p>{result.reason}</p>
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
                    ? "Discuss my shortlist"
                    : "Ask for technical guidance"}
                </Button>
                {compare.length > 0 && (
                  <Link to="/compare" className="text-link">
                    Compare selected products <ArrowUpRight size={17} />
                  </Link>
                )}
                <button
                  className="text-link"
                  onClick={() => setStep(Math.max(0, total - 1))}
                >
                  <ArrowLeft size={17} /> Edit answers
                </button>
              </div>
              <p className="fineprint">
                Your answers will be included in the enquiry. Matches use
                explicit application rules; no AI-generated compatibility advice
                is used.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
