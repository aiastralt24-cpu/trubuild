import offices from "./offices.json";
import { submitEnquiry } from "./enquiries.mjs";
import { TdsLink } from "./TdsDownload";
import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  FileDown,
  Mail,
  Phone,
  MapPin,
  Check,
} from "lucide-react";
import { solutions, products, resources, enquiryUrl, documentFor } from "./data";
import {
  PageIntro,
  Button,
  AdvisorBanner,
  ProductGrid,
  Breadcrumb,
} from "./components";
import { solutionContent } from "./solutionContent.mjs";
import { NotFound } from "./Catalogue";
export function Solutions() {
  return (
    <div className="solutions-page">
      <section className="solutions-intro">
        <div className="solutions-intro-copy">
          <Breadcrumb items={[{ label: "Solutions" }]} />
          <span className="eyebrow">SOLUTIONS BY APPLICATION</span>
          <h1>Solutions for<br /><em>every space.</em></h1>
          <p>From the roof to the foundations, find waterproofing, tiling and repair solutions for the space you’re working on.</p>
          <a className="solutions-jump" href="#applications">Explore applications <ArrowUpRight size={20} /></a>
        </div>
        <div className="solutions-intro-image">
          <img src="/images/hero-exterior-home-v3.webp" alt="Illustrative contemporary home with coated plastered exterior walls" fetchPriority="high" />
          <span>Protection from the ground up.</span>
        </div>
      </section>
      <section className="solutions-collection wrap" id="applications" aria-labelledby="applications-heading">
        <div className="solutions-collection-heading">
          <div><span className="eyebrow">FIND YOUR APPLICATION</span><h2 id="applications-heading">Where are you building?</h2></div>
          <p>Choose an area to explore suitable products and application guidance.</p>
        </div>
        <div className="application-gallery">
          {solutions.map((s) => (
            <Link key={s.id} to={"/solutions/" + s.id} className={"application-gallery-card gallery-" + s.id}>
              <div className="application-gallery-photo">
                <img src={s.image} alt={s.imageAlt} loading="lazy" />
                <span className="application-gallery-arrow" aria-hidden="true"><ArrowUpRight size={22} /></span>
              </div>
              <div className="application-gallery-copy"><h3>{s.name}</h3><p>{s.summary}</p><span className="application-gallery-link">Explore solutions <ArrowUpRight size={16} /></span></div>
            </Link>
          ))}
        </div>
        <p className="image-note">Architectural imagery is illustrative.</p>
      </section>
      <section className="solutions-guidance wrap">
        <div><span className="eyebrow">LET’S FIND THE RIGHT FIT</span><h2>Not sure where<br />to <em>start?</em></h2></div>
        <div><p>Tell us about your surface and application. Our Product Advisor will help you explore the options for your project.</p><Button to="/advisor">Find my product</Button><Link className="solutions-support" to="/contact">Or speak to our team <ArrowUpRight size={16} /></Link></div>
      </section>
    </div>
  );
}
export function SolutionDetail({ compare, toggle }) {
  const { id } = useParams();
  const s = solutions.find((x) => x.id === id);
  const content = solutionContent[id];
  if (!s || !content) return <NotFound />;
  const items = products.filter((p) => p.applications.includes(s.sourceName));
  const featured = [...new Set(content.choices.map(choice => choice[2]))]
    .map(productId => items.find(p => p.id === productId)).filter(Boolean);
  return (
    <article className="solution-guide">
      <section className="solution-detail-hero">
        <div className="wrap">
          <Breadcrumb items={[{ label: "Solutions", to: "/solutions" }, { label: s.name }]} />
          <span className="eyebrow">TRUBUILD APPLICATION GUIDE</span>
          <h1>{content.heading}{" "}<br /><span>{content.accent}</span></h1>
          <p>{s.description}</p>
          <Button to={enquiryUrl("", s.name)}>Discuss your project</Button>
        </div>
        <img src={s.image} alt={s.imageAlt} fetchPriority="high" />
      </section>
      <nav className="solution-guide-nav" aria-label="On this page">
        <div className="solution-guide-nav-inner wrap">
        <a href="#selection">Choose a system</a><a href="#preparation">Plan the application</a><a href="#products">Explore products</a><a href="#questions">Common questions</a><a href="#documents">Technical data</a>
        </div>
      </nav>
      <section className="solution-answer wrap" aria-labelledby="answer-heading">
        <div><span className="eyebrow">START WITH THE RIGHT QUESTION</span><h2 id="answer-heading">{content.question}</h2></div>
        <div><p className="solution-direct-answer">{content.answer}</p><p>{content.intro}</p></div>
      </section>
      <section className="solution-guide-section wrap" id="selection">
        <span className="eyebrow">SYSTEM SELECTION</span><h2>{content.selectionTitle}</h2>
        <div className="solution-choice-grid">{content.choices.map(([title, text, productId]) => {
          const product = products.find(p => p.id === productId);
          return <article key={title}><h3>{title}</h3><p>{text}</p><Link to={"/products/" + product.id}>Explore {product.name} <ArrowUpRight size={16} /></Link></article>;
        })}</div>
      </section>
      <section className="solution-preparation" id="preparation"><div className="wrap solution-preparation-inner">
        <div><span className="eyebrow">BEFORE YOU BEGIN</span><h2>A sound surface.<br /><em>A complete system.</em></h2><p>Use this planning guide alongside the selected product’s technical data sheet for mixing, application and curing instructions.</p></div>
        <div>{content.steps.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div>
      </div></section>
      <section className="solution-guide-section wrap" id="products">
        <div className="section-heading"><div><span className="eyebrow">EXPLORE YOUR OPTIONS</span><h2>Explore {s.name.toLowerCase()} products.</h2></div><Link className="text-link" to={"/products?application=" + encodeURIComponent(s.sourceName)}>View all {items.length} products <ArrowUpRight size={18} /></Link></div>
        <ProductGrid items={featured} compare={compare} toggle={toggle} />
      </section>
      <section className="solution-faq wrap" id="questions" aria-labelledby="faq-heading">
        <div><span className="eyebrow">PRACTICAL ANSWERS</span><h2 id="faq-heading">Your questions,<br /><em>answered.</em></h2><p>{s.name} selection and application guidance.</p></div>
        <div>{content.faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
      </section>
      <section className="solution-documents wrap" id="documents">
        <div><span className="eyebrow">PRODUCT DOCUMENTATION</span><h2>Check the technical detail.</h2><p>Product-specific quantities and limits above are drawn from the linked technical data sheets. Read the full document for the chosen application.</p></div>
        <div>{content.documents.map(productId => {const p = products.find(p => p.id === productId); const doc = documentFor(p); return <TdsLink key={p.id} product={p} sheet={doc}><span>{p.name}<small>Technical data sheet · PDF</small></span><FileDown size={20} /></TdsLink>;})}</div>
      </section>
      <section className="solution-related wrap"><h2>Explore related applications.</h2><div>{content.related.map(key => {const related = solutions.find(item => item.id === key);return <Link key={key} to={"/solutions/" + key}>{related.name}<ArrowUpRight size={18} /></Link>;})}</div></section>
      <AdvisorBanner />
    </article>
  );
}
export function About() {
  return (
    <>
      <PageIntro
        title="Get to know"
        accent="TruBuild."
        eyebrow="ABOUT TRUBUILD"
        description="Astral TruBuild brings waterproofing, tiling and grouting solutions together, helping protect buildings from the foundation to the finishing touch."
      />
      <div className="about-wide">
        <img
          src="/images/architecture.webp"
          alt="Illustrative concrete architectural concept"
        />
        <span>
          Built to perform. Designed to protect.{" "}
        </span>
      </div>
      <section className="section wrap company-story">
        <span className="eyebrow">AN ASTRAL BRAND</span>
        <div>
          <h2>
            Good buildings start
            <br />
            with good decisions.
          </h2>
          <p className="lead">
            The details beneath the finish matter. The roof coating, the tile
            adhesive, the bond between old concrete and new.
          </p>
          <p>
            TruBuild is part of Astral Limited’s building materials portfolio.
            Its published product range covers waterproofing, exterior coatings,
            tile adhesives, grouts, concrete repair and professional sealants.
          </p>
          <p>
            Our product discovery experience brings these solutions together so
            homeowners, contractors, specifiers and business partners can make a
            better-informed shortlist and connect with the technical team.
          </p>

        </div>
      </section>
      <section className="company-pillars wrap">
        {[
          [
            "01",
            "Protect",
            "Waterproofing systems for roofs, walls, wet areas and substructures.",
          ],
          [
            "02",
            "Connect",
            "Tile adhesives and grouts that support the complete installation journey.",
          ],
          [
            "03",
            "Restore",
            "Concrete and mortar modifiers, repair products and joint sealants.",
          ],
        ].map(([n, h, p]) => (
          <article key={n}>
            <span>{n}</span>
            <h2>{h}.</h2>
            <p>{p}</p>
            <Link to="/solutions" className="text-link">
              Explore solutions <ArrowUpRight size={17} />
            </Link>
          </article>
        ))}
      </section>
      <AdvisorBanner />
    </>
  );
}
export function Resources() {
  const [params, setParams] = useSearchParams();
  const q = params.get("search") || "";
  const [kind, setKind] = useState("all");
  const filtered = resources.filter(
    (r) =>
      (kind === "all" || r.kind === kind) &&
      [r.title, r.sourceTitle || "", ...(products.find((p) => p.id === r.productId)?.aliases || [])].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageIntro
        title="Explore our"
        accent="technical resources."
        eyebrow="TECHNICAL RESOURCES"
        description="Explore official product data sheets, application guides and brochures. Find the detail you need before your next step."
      />
      <section className="wrap section">
        <div className="resource-toolbar">
          <div className="search-box">
            <Search size={20} />
            <label className="sr-only" htmlFor="resource-search">
              Search documents
            </label>
            <input
              id="resource-search"
              value={q}
              placeholder="Search a product or document…"
              onChange={(e) =>
                setParams(e.target.value ? { search: e.target.value } : {}, {
                  replace: true,
                })
              }
            />
          </div>
          <label className="resource-filter">
            Document type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">All documents</option>
              {resources.some(r => r.kind === "brochure") && <option value="brochure">Brochures & guides</option>}
              <option value="tds">Technical data sheets</option>
            </select>
          </label>
        </div>
        <p className="fineprint" role="status">
          {filtered.length} documents · Published by TruBuild
        </p>
        <div className="resource-list">
          {filtered.map((r) => (
            <TdsLink
              key={r.url}
              product={{id:r.productId || "",name:r.title}}
              sheet={r}
            >
              <span className="file-symbol">
                <FileDown size={23} />
              </span>
              <div>
                <h2>
                  {r.title
                    .replace(
                      "Download to know more about our Comprehensive Range of ",
                      "",
                    )
                    .replace(
                      "Download to browse through our Comprehensive Guide for ",
                      "Guide to ",
                    )
                    .replace(/\.$/, "")}
                </h2>
                <span>
                  {r.version ? `TDS ${r.version} · Checked 9 Oct 2026` : "Published document"} · PDF ·{" "}
                  {r.bytes ? (r.bytes / 1048576).toFixed(1) + " MB" : ""}
                </span>
              </div>
              <ArrowUpRight size={23} />
            </TdsLink>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            <h2>No matching documents.</h2>
            <Button
              onClick={() => {
                setParams({});
                setKind("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <div className="resource-request">
          <div>
            <h2>Need something more specific?</h2>
            <p>
              Ask for a safety data sheet, current certificate or
              project-specific guidance.
            </p>
          </div>
          <Button
            to={enquiryUrl("", "Please help me with technical documentation.")}
          >
            Request a document
          </Button>
        </div>
      </section>
    </>
  );
}
export function Contact() {
  const [params] = useSearchParams();
  const [type, setType] = useState(params.get("type") || "General enquiry");
  const [product, setProduct] = useState(params.get("product") || "");
  const [requirements, setRequirements] = useState(
    params.get("requirements") || "",
  );
  const [submissionId, setSubmissionId] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [requestId,setRequestId]=useState('');
  async function prepare(e) {
    e.preventDefault();
    const form=e.currentTarget;
    const f=new FormData(form);
    const id=requestId || crypto.randomUUID();setRequestId(id);
    setSending(true);setFormError('');setSubmissionId('');
    try {
      const result=await submitEnquiry({requestId:id,kind:product || type==='Product enquiry' ? 'product_enquiry' : 'general_enquiry',topic:type,name:f.get('name'),email:f.get('email'),mobile:f.get('phone'),company:f.get('company'),city:f.get('city'),productName:product,requirements,message:f.get('message')},AbortSignal.timeout(20000));
      setSubmissionId(result.id);
    } catch(error) {setFormError(error.name==='TimeoutError'?'The request timed out. Please try again.':error.message);}
    finally {setSending(false);}
  }
  return (
    <>
      <PageIntro
        title="Tell us about"
        accent="your project."
        eyebrow="CONTACT & ENQUIRIES"
        description="A product question, a technical challenge or a business opportunity. Let’s find the right next step."
      />
      <section className="wrap section contact-layout">
        <aside className="contact-details">
          <h2>Let’s talk.</h2>
          <a href="tel:18003099393">
            <Phone size={20} />
            <div>
              <span>CALL OUR TEAM</span>
              <strong>1800 309 9393</strong>
            </div>
          </a>
          <a href="mailto:customercare@astraladhesives.com">
            <Mail size={20} />
            <div>
              <span>EMAIL</span>
              <strong>customercare@astraladhesives.com</strong>
            </div>
          </a>
          <div className="address">
            <MapPin size={20} />
            <div>
              <span>HEAD OFFICE</span>
              <p>
                ‘Astral House’, 207/1,
                <br />
                Behind Rajpath Club, Off S.G. Highway,
                <br />
                Ahmedabad – 380059, India.
              </p>
            </div>
          </div>
          <p className="fineprint">
            Contact details from the official TruBuild website.
          </p>
        </aside>
        <div className="contact-form-wrap">
          <form
            onSubmit={prepare}
            onChange={(e) => {
              e.target.setCustomValidity?.("");
              if (submissionId) setSubmissionId("");
              setRequestId("");
            }}
            className="enquiry-form"
          >
            <h2>Tell us about your project.</h2>
            <p className="muted">
              Send your enquiry to the TruBuild team. Required fields are marked *.
            </p>
            <label>
              How can we help?
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setSubmissionId("");
                }}
              >
                <option>General enquiry</option>
                <option>Product enquiry</option>
                <option>Technical assistance</option>
                <option>Business partnership</option>
              </select>
            </label>
            <div className="form-grid">
              <label>
                Your name *
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Email address *
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  maxLength={160}
                />
              </label>
              <label>
                Company {type === "Business partnership" ? "*" : "(optional)"}
                <input
                  name="company"
                  autoComplete="organization"
                  required={type === "Business partnership"}
                  maxLength={160}
                />
              </label>
              <label>
                City *
                <input
                  name="city"
                  autoComplete="address-level2"
                  required
                  maxLength={100}
                />
              </label>
            </div>
            <label>
              Phone (optional)
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                maxLength={24}
              />
            </label>
            {type !== "General enquiry" && (
              <label>
                Products of interest
                <input
                  value={product}
                  onChange={(e) => {
                    setProduct(e.target.value);
                    setSubmissionId("");
                  }}
                  placeholder="Product name or code, if known"
                  maxLength={300}
                />
              </label>
            )}
            {(requirements || type === "Technical assistance") && (
              <label>
                Your project requirements
                <textarea
                  value={requirements}
                  onChange={(e) => {
                    setRequirements(e.target.value);
                    setSubmissionId("");
                  }}
                  rows={5}
                  maxLength={2500}
                />
              </label>
            )}
            <label>
              Your message *
              <textarea
                name="message"
                required
                rows={4}
                maxLength={2500}
                placeholder="Tell us about the application, site conditions or the support you need."
              />
            </label>
            <p className="fineprint">
              We’ll use your details to respond to your enquiry.
            </p>
            {formError && <p role="alert" className="tds-error">{formError}</p>}
            <Button type="submit" disabled={sending || !!submissionId}>{sending ? "Sending…" : submissionId ? "Enquiry sent" : "Send enquiry"}</Button>
          </form>
          {submissionId && <section className="draft-result" role="status"><h2>Thank you. Your enquiry is received.</h2><p>Our team can now review your request.</p><p className="fineprint">Reference: {submissionId}</p></section>}
        </div>
      </section>
      <section className="office-directory wrap" aria-labelledby="office-heading">
        <div className="office-directory-heading"><span className="eyebrow">OUR PRESENCE</span><h2 id="office-heading">Connected across <em>India.</em></h2><p>Find our head office and branch offices across 12 cities.</p></div>
        <div className="office-grid">{offices.map(office => <article key={office.city}><span className="eyebrow">{office.type}</span><h3>{office.city}</h3><address>{office.address}</address><a href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(office.address)} target="_blank" rel="noopener noreferrer">View on map <ArrowUpRight size={16} /></a></article>)}</div>
      </section>
    </>
  );
}
export function Sources() {
  return (
    <>
      <PageIntro
        title="Explore the"
        accent="sources behind our content."
        eyebrow="CONTENT & IMAGE CREDITS"
        description="Product information is drawn from official TruBuild sources. Architectural imagery supports the design and is not evidence of completed projects."
      />
      <section className="wrap section prose">
        <h2>Product and company information</h2>
        <p>
          Catalogue content was reviewed on 5 October 2026. Product detail pages
          link to their individual official sources. Technical documents are
          published by TruBuild and retained with original document titles,
          including legacy product names.
        </p>
        <ul>
          <li>
            <a href="https://www.trubuild.in/">TruBuild official website</a>
          </li>
          <li>
            <a href="https://www.trubuild.in/about-us/">Company overview</a>
          </li>
          <li>
            <a href="https://www.trubuild.in/downloads/">
              Official technical document library
            </a>
          </li>
          <li>
            <a href="https://www.trubuild.in/contact-us/">
              Contact information
            </a>
          </li>
        </ul>
        <h2>Photography and branding</h2>
        <p>
          Product pack shots and the company image come from the official
          TruBuild website. The wordmark follows the supplied brand artwork.
          Architectural and interior images are AI-generated concepts and do not
          depict actual company facilities, documented projects or product
          performance.
        </p>
        <h2>Information that needs confirmation</h2>
        <p>
          Pack sizes, product naming, document revisions and availability should
          be confirmed with the technical team. CPS 111 was formerly named IW+ 111.
          Its approved technical data sheet retains the IW+ 111 name.
        </p>
        <h2>How the Product Advisor works</h2>
        <p>
          The Advisor compares selected tasks, surfaces and conditions against
          explicit published applications. Where there is insufficient
          information, it offers a technical enquiry instead of a product match.
          A shortlist is a starting point for technical review.
        </p>
        <Button to="/contact">Contact the team</Button>
      </section>

    </>
  );
}
