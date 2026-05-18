"use strict";

/**
 * version.js
 * Fetches version data from the sheet API independently of asset loading.
 * Populates #footerVersion and shows the update popup when appropriate.
 * Works on any page that includes this script.
 */

(function initVersion() {

  // ── Helpers ────────────────────────────────────────────────────────────────

  function parseVer(v) {
    return String(v).replace(/^v/i, "").split(".").map(s => {
      const n = parseInt(s, 10);
      return isNaN(n) ? s : n;
    });
  }

  function compareVer(a, b) {
    const pa = parseVer(a), pb = parseVer(b);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const va = pa[i] ?? 0, vb = pb[i] ?? 0;
      if (va < vb) return -1;
      if (va > vb) return  1;
    }
    return 0;
  }

  // ── Core ───────────────────────────────────────────────────────────────────

  function applyVersionUI(raw) {
    const footerAnchor = document.getElementById("footerVersion");

    try {
      const rows = Array.isArray(raw)
        ? raw.filter(d => d && d.version?.toString().trim())
        : [];

      const currentRows    = rows.filter(d => d.release?.toString().trim().toLowerCase() === "current");
      const prereleaseRows = rows.filter(d => d.release?.toString().trim().toLowerCase() === "prerelease");

      const best = (arr) => arr.reduce((acc, d) => {
        const v = d.version.toString().trim();
        return (acc === null || compareVer(v, acc.version) > 0) ? { version: v, row: d } : acc;
      }, null);

      const bestCurrent    = best(currentRows);
      const bestPrerelease = best(prereleaseRows);

      let displayVersion, displayRow;

      if (!bestCurrent && !bestPrerelease) {
        displayVersion = "V0.8";
        displayRow     = null;
      } else if (!bestCurrent) {
        displayVersion = bestPrerelease.version;
        displayRow     = bestPrerelease.row;
      } else if (!bestPrerelease) {
        displayVersion = bestCurrent.version;
        displayRow     = bestCurrent.row;
      } else {
        const usePre = compareVer(bestPrerelease.version, bestCurrent.version) > 0;
        displayVersion = usePre ? bestPrerelease.version : bestCurrent.version;
        displayRow     = usePre ? bestPrerelease.row     : bestCurrent.row;
      }

      const message = displayRow?.["version-message"]?.toString().trim() || "";

      if (footerAnchor) footerAnchor.textContent = `Version ${displayVersion}`;

      // Update popup (only present on pages that include it)
      const popup = document.getElementById("updatePopup");
      if (popup) {
        const titleEl = popup.querySelector("h2");
        const msgEl   = popup.querySelector("p");
        if (titleEl) titleEl.textContent = `🎉 Version ${displayVersion} Update!`;
        if (msgEl && message) msgEl.textContent = message;

        const dismissed = localStorage.getItem("dismissedUpdateVersion");
        const closed    = sessionStorage.getItem("updatePopupClosed");
        if (!closed && dismissed !== displayVersion) {
          setTimeout(() => popup.classList.add("show"), 600);
        }
      }

    } catch {
      if (footerAnchor) footerAnchor.textContent = "Version V0.8";
    }
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function loadVersion() {
    // Resolve the sheet URL: prefer window.config if already set by main.js,
    // otherwise fall back to the canonical production URL.
    const sheetUrl =
      window.config?.sheetUrl ||
      "https://script.google.com/macros/s/AKfycbwi-fNKbosofxP_BJw_tgXxXyDDFjF7OqYfb6arY1Lcgms_8c9NDjuhmohK1hqI6UYegQ/exec";

    // If main.js has already resolved version data via _versionReady, wait for it
    // and skip an extra network round-trip.
    if (window._versionReady instanceof Promise) {
      const raw = await window._versionReady;
      if (Array.isArray(raw) && raw.length) {
        applyVersionUI(raw);
        return;
      }
      // Fall through to standalone fetch if the payload was empty/unexpected.
    }

    // Stand-alone fetch (pages that don't load main.js, or version.js loads first).
    try {
      const VERSION_CACHE_KEY = "__ws_versionCache__";
      let raw;

      try {
        const cached = JSON.parse(sessionStorage.getItem(VERSION_CACHE_KEY) || "null");
        if (Array.isArray(cached) && cached.length) {
          raw = cached;
        }
      } catch { /* ignore */ }

      if (!raw) {
        const res = await fetch(sheetUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
        try { sessionStorage.setItem(VERSION_CACHE_KEY, JSON.stringify(raw)); } catch { /* quota */ }
      }

      applyVersionUI(raw);
    } catch {
      const footerAnchor = document.getElementById("footerVersion");
      if (footerAnchor) footerAnchor.textContent = "Version V0.8";
    }
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  // Expose for pages that want to call it manually (e.g. after DOM ready).
  window.WS_Version = { load: loadVersion, apply: applyVersionUI };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadVersion);
  } else {
    loadVersion();
  }

})();