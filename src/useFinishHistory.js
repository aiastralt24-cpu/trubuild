import { useState } from "react";
export function useFinishHistory(initial) {
  const [history, setHistory] = useState({
    past: [],
    present: initial,
    future: [],
  });
  function set(value) {
    setHistory((h) => {
      const next = typeof value === "function" ? value(h.present) : value;
      if (JSON.stringify(next) === JSON.stringify(h.present)) return h;
      return {
        past: [...h.past, h.present].slice(-40),
        present: next,
        future: [],
      };
    });
  }
  function undo() {
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past.at(-1),
            future: [h.present, ...h.future],
          }
        : h,
    );
  }
  function redo() {
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
          }
        : h,
    );
  }
  return [
    history.present,
    set,
    undo,
    redo,
    !!history.past.length,
    !!history.future.length,
  ];
}
