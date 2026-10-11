import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { Header, Footer } from "./components";
import Home from "./Home";
import Experience from "./Experience";
import { BlogIndex, BlogDetail } from "./Blogs.jsx";
import { Catalogue, ProductDetail, Compare, NotFound } from "./Catalogue";
import Advisor from "./Advisor";
import {
  Solutions,
  SolutionDetail,
  About,
  Resources,
  Contact,
  Sources,
} from "./Pages";
import { products } from "./data";
import { applyMetadata } from "./seo.mjs";
function getComparison() {
  try {
    return JSON.parse(sessionStorage.getItem("trubuild-compare") || "[]")
      .filter((id) => products.some((p) => p.id === id))
      .slice(0, 3);
  } catch {
    return [];
  }
}
export default function App() {
  const [compare, setCompare] = useState([]),
    [notice, setNotice] = useState("");
  const loc = useLocation();
  const isExperience = loc.pathname.replace(/\/+$/, '') === '/experience';
  useEffect(() => {
    if (!loc.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    applyMetadata(loc.pathname);
    if (!loc.hash)
      document.getElementById("main")?.focus({ preventScroll: true });
  }, [loc.pathname, loc.hash]);
  useEffect(() => { setCompare(getComparison()); }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem("trubuild-compare", JSON.stringify(compare));
    } catch {}
  }, [compare]);
  function toggle(id) {
    if (compare.includes(id)) {
      setCompare(compare.filter((x) => x !== id));
      setNotice("");
    } else if (compare.length < 3) {
      setCompare([...compare, id]);
      setNotice("");
    } else
      setNotice(
        "You can compare up to three products. Remove one to add another.",
      );
  }
  const shared = { compare, toggle };
  return (
    <>
      {!isExperience && <Header />}
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/products" element={<Catalogue {...shared} />} />
          <Route path="/products/:id" element={<ProductDetail {...shared} />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route
            path="/solutions/:id"
            element={<SolutionDetail {...shared} />}
          />
          <Route path="/advisor" element={<Advisor {...shared} />} />
          <Route path="/compare" element={<Compare {...shared} />} />
          <Route path="/blogs" element={<BlogIndex />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/contact" element={<Contact key={loc.search} />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isExperience && <Footer />}
      {compare.length > 0 && loc.pathname !== "/compare" && !isExperience && (
        <div className="compare-bar">
          <div>
            <strong>{compare.length} / 3 products selected</strong>
            {notice && <span role="status">{notice}</span>}
          </div>
          <Link to="/compare">
            Compare products <ArrowRight size={17} />
          </Link>
          <button
            onClick={() => {
              setCompare([]);
              setNotice("");
            }}
            aria-label="Clear product comparison"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
