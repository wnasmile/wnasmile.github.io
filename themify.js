/* ============================================================
   theme.js — Theme, Cloak, GIF config
   Load ORDER: 2nd (depends on: utils.js)
   IIFEs here run immediately — theme/cloak apply before first paint.
   ============================================================ */

"use strict";

/* ---------- Favicon / Cloak Helpers ---------- */

function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url && url.startsWith("http") ? url : (url ? `system/${url}` : "");
}

// Apply saved cloak immediately (before DOMContentLoaded).
(function applyGlobalCloak() {
  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon  = localStorage.getItem("cloakIcon");
  if (savedTitle) document.title = savedTitle;
  if (savedIcon)  setFavicon(savedIcon);
})();

/* ---------- Theme ---------- */

// Apply saved theme immediately (before DOMContentLoaded).
(function applyGlobalTheme() {
  const saved = localStorage.getItem("selectedTheme") || "redux";
  document.documentElement.setAttribute("theme", saved);
  if (saved === "custom") {
    try {
      const vars = JSON.parse(localStorage.getItem("customTheme") || "{}");
      Object.entries(vars).forEach(([k, v]) =>
        document.documentElement.style.setProperty(k, v)
      );
    } catch (_) {}
  }
})();

// Sync theme + cloak changes across tabs.
window.addEventListener("storage", (e) => {
  if (e.key === "cloakTitle" && e.newValue) document.title = e.newValue;
  if (e.key === "cloakIcon"  && e.newValue) setFavicon(e.newValue);
  if (e.key === "selectedTheme") {
    const t = e.newValue || "redux";
    document.documentElement.setAttribute("theme", t);
    if (t !== "custom") document.documentElement.style.cssText = "";
  }
  if (e.key === "customTheme" && e.newValue) {
    try {
      const vars = JSON.parse(e.newValue);
      Object.entries(vars).forEach(([k, v]) =>
        document.documentElement.style.setProperty(k, v)
      );
    } catch (_) {}
  }
});

/* ---------- GIF Config ---------- */

// Each state entry: { src, w, h }
// src  — URL, or "" to fall back to ROOT_GIFS
// w/h  — pixel size for that state's image, or "" to fall back to ROOT_SIZES
//
// ROOT_SIZES defines the default dimensions used whenever a theme leaves w/h blank.
const ROOT_SIZES = {
  loading:   { w: 124, h: 124 },
  loaded:    { w: 192, h: 192 },
  searching: { w: 120, h: 120 },
  crash:     { w: 160, h: 160 },
  ded:       { w: 160, h: 160 },
};

const ROOT_GIFS = {
  loading:   { src: "https://raw.githubusercontent.com/wnasmile/wnasmile.github.io/main/happy.gif",    w: "", h: "" },
  loaded:    { src: "https://raw.githubusercontent.com/wnasmile/wnasmile.github.io/main/loaded.gif",   w: "", h: "" },
  searching: { src: "https://raw.githubusercontent.com/mcmattyobriore/yogurtyooo.github.io/main/system/images/GIF/searching.gif", w: "", h: "" },
  crash:     { src: "https://raw.githubusercontent.com/mcmattyobriore/yogurtyooo.github.io/main/system/images/GIF/crash.gif",     w: "", h: "" },
  ded:       { src: "https://raw.githubusercontent.com/mcmattyobriore/yogurtyooo.github.io/main/system/images/GIF/ded.gif",       w: "", h: "" },
};

// Per-theme overrides.
// src/w/h — use "" to inherit from ROOT_GIFS / ROOT_SIZES.
// Example custom size:  loading: { src: "", w: 256, h: 256 }
const THEME_GIFS = {
  root:          ROOT_GIFS,
  redux:         { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  classic:       { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  light:         { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  dark:          { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  slackerish:    { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  graduation:    { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  "flower-boy":  { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  igor:          { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
  "i-am-music":  { loading: { src: "", w: "", h: "" }, loaded: { src: "", w: "", h: "" }, searching: { src: "", w: "", h: "" }, crash: { src: "", w: "", h: "" }, ded: { src: "", w: "", h: "" } },
};

// Returns resolved { src, w, h } for a given theme + state key.
function getThemeGif(theme, key) {
  const entry     = (THEME_GIFS[theme] || {})[key] || {};
  const rootEntry = ROOT_GIFS[key] || {};
  const rootSize  = ROOT_SIZES[key] || { w: 192, h: 192 };
  return {
    src: entry.src || rootEntry.src || "",
    w:   entry.w   || rootEntry.w   || rootSize.w,
    h:   entry.h   || rootEntry.h   || rootSize.h,
  };
}

// Applies src + injects --gif-w / --gif-h CSS vars onto the element
// so the CSS rule `width: var(--gif-w)` responds automatically.
function applyGifToImg(img, theme, key) {
  if (!img) return;
  const { src, w, h } = getThemeGif(theme, key);
  if (src) img.src = src;
  img.style.setProperty("--gif-w", typeof w === "number" ? `${w}px` : w);
  img.style.setProperty("--gif-h", typeof h === "number" ? `${h}px` : h);
  img.dataset.gifState = key;   // lets CSS target [data-gif-state="..."] if needed
}

// Updates live loader + searching gif when theme changes.
window.applyThemeGifs = function (theme) {
  const t = theme || document.documentElement.getAttribute("theme") || "root";

  const loaderImg = document.querySelector("#containerLoader img");
  if (loaderImg) {
    const currentState = loaderImg.dataset.gifState || "loading";
    applyGifToImg(loaderImg, t, currentState);
  }

  const searchGif = document.getElementById("noResultsGif");
  if (searchGif) applyGifToImg(searchGif, t, "searching");
};

// Call this whenever you switch the loader to a new state (loading/loaded/crash/ded).
window.setLoaderState = function (state) {
  const t   = (document.documentElement.getAttribute("theme") || "root").trim();
  const img = document.querySelector("#containerLoader img");
  applyGifToImg(img, t, state);
};

/* ---------- Apply loading GIF + size override before DOMContentLoaded ---------- */
(function () {
  const theme = (localStorage.getItem("selectedTheme") || "root").trim();
  const img   = document.querySelector("#containerLoader img");
  applyGifToImg(img, theme, "loading");
})();
