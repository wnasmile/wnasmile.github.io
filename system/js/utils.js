/* ============================================================
   utils.js — Shared utilities
   Load ORDER: 1st (no dependencies)
   ============================================================ */

"use strict";

const clamp    = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
const delay    = (ms) => new Promise((r) => setTimeout(r, ms));
const safeStr  = (v) => (v == null ? "" : String(v));
const rafAsync = () => new Promise((r) => requestAnimationFrame(r));

function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// One Collator instance reused for all title comparisons.
const _collator   = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const fastCompare = (a, b) => _collator.compare(a, b);

const getSortMode = () => localStorage.getItem("sortMode") || "sheet";

/* ---------- Toast ---------- */
// Exposed on window so any script loaded after this one can call window.showToast().
window.showToast = function showToast(message, timeout = 2200) {
  let t = document.getElementById("__ws_toast__");
  if (!t) {
    t = document.createElement("div");
    t.id = "__ws_toast__";
    Object.assign(t.style, {
      position:      "fixed",
      bottom:        "28px",
      left:          "50%",
      transform:     "translateX(-50%)",
      background:    "rgba(0,0,0,0.8)",
      color:         "#fff",
      padding:       "10px 14px",
      borderRadius:  "8px",
      fontFamily:    "monospace",
      zIndex:        "99999",
      opacity:       "0",
      transition:    "opacity 220ms ease",
      pointerEvents: "none",
    });
    document.body.appendChild(t);
  }
  clearTimeout(t.__timer);
  t.textContent   = message;
  t.style.opacity = "1";
  t.__timer = setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, timeout);
};

// Convenience alias — all files reference showToast() directly.
const showToast = window.showToast;
