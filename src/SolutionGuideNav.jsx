import React, { useEffect, useRef, useState } from "react";

const sections = [
  ["selection", "Choose a system"],
  ["preparation", "Plan the application"],
  ["products", "Explore products"],
  ["questions", "Common questions"],
  ["documents", "Technical data"],
];

export function SolutionGuideNav() {
  const [active, setActive] = useState("selection");
  const [stuck, setStuck] = useState(false);
  const nav = useRef(null);
  const pending = useRef(null);

  useEffect(() => {
    let frame = 0;
    let settleTimer;
    const header = document.querySelector(".header");
    const targets = sections.map(([id]) => document.getElementById(id));
    const update = () => {
      frame = 0;
      const navigation = nav.current?.parentElement;
      if (navigation && header) {
        const headerBottom = Math.ceil(header.getBoundingClientRect().bottom);
        navigation.style.setProperty("--solution-header-bottom", `${headerBottom}px`);
        setStuck(navigation.getBoundingClientRect().top <= headerBottom + 1);
      }
      if (pending.current) return;
      // Match native anchor placement, including the page's scroll padding.
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      let current = sections[0][0];
      for (const target of targets) {
        if (!target) continue;
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (target.getBoundingClientRect().top <= padding + margin + 2) current = target.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const release = () => {
      pending.current = null;
      clearTimeout(settleTimer);
      schedule();
    };
    const onScroll = () => {
      schedule();
      // Also handles browsers without scrollend and interrupted smooth scrolling.
      clearTimeout(settleTimer);
      settleTimer = setTimeout(release, 150);
    };
    const onScrollEnd = event => {
      // A mobile tab-strip scroll must not unlock the page's smooth scroll.
      if (event.target === document) release();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    window.addEventListener("keydown", release);
    const observer = new ResizeObserver(schedule);
    if (header) observer.observe(header);
    targets.filter(Boolean).forEach(target => observer.observe(target));
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", release);
    };
  }, []);

  useEffect(() => {
    const container = nav.current;
    const link = container?.querySelector('[aria-current="location"]');
    if (!link) return;
    const bounds = container.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.left < bounds.left || item.right > bounds.right) {
      container.scrollBy({ left: item.left - bounds.left - (bounds.width - item.width) / 2, behavior: "instant" });
    }
  }, [active]);

  return (
    <nav className={`solution-guide-nav${stuck ? " is-stuck" : ""}`} aria-label="On this page">
      <div className="solution-guide-nav-inner wrap" ref={nav}>
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}
            onClick={event => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              pending.current = id;
              setActive(id);
            }}>{label}</a>
        ))}
      </div>
    </nav>
  );
}
