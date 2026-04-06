/* ============================================================
   themify.js — Theme, Cloak, GIF config
   Load ORDER: 2nd (depends on: utils.js)
   IIFEs here run immediately — theme/cloak apply before first paint.
   ============================================================ */

"use strict";

const DEFAULT_THEME    = "redux";
const DEFAULT_GIF_SIZE = 128;

/* ---------- Valid theme names (single source of truth) ---------- */
// Exactly 10 active themes. Keys 0–9 in THEME_MAP (ui.js) map to this order:
//   0=redux(root)  1=classic  2=selenite  3=slackerish  4=gn-math
//   5=graduation   6=igor     7=wolf      8=cherrybomb  9=i-am-music
const VALID_THEMES = new Set([
  "wolf", "cherrybomb", "igor", "gn-math", "selenite",
  "slackerish", "classic", "redux", "graduation", "i-am-music",
]);

/* ---------- Background Value Normalizer ---------- */

// CSS background-image requires url("...") for image paths, but background (color shorthand)
// accepts plain #hex / rgb() / hsl() / named-color values directly.
// This helper detects which kind of value is stored and returns it ready-to-use as a
// CSS property value — so both url("img.png") and "#1a1a2e" work without glitching.

// All CSS custom-property names that carry background values in themes.css.
// These get special normalization so both #hex colours and url() images work.
const _BG_VAR_NAMES = new Set([
  "--main-bg", "--body-bg", "--bg", "--background",
  "--card-bg", "--header-bg", "--footer-bg", "--sidebar-bg",
  "--quote-bg", "--menu-bg",
]);

// Returns true if the value looks like a plain CSS color (not a url/gradient/none).
function _isCSSColor(val) {
  const v = (val || "").trim();
  if (!v || v === "none" || v === "inherit" || v === "transparent") return false;
  return (
    /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ||
    /^rgb[a]?\s*\(/.test(v)                                          ||
    /^hsl[a]?\s*\(/.test(v)                                          ||
    /^(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/i.test(v)
  );
}

// Normalizes a background var value so both colour values and image URLs work:
//
//   url("")           → ""  (empty — invalid, strips it so :root fallback cascades)
//   url("path")       → url("path")  (valid image ref, pass through)
//   gradient(...)     → gradient(...)  (pass through)
//   #hex / rgb / hsl  → #hex / rgb / hsl  (valid for `background:` shorthand)
//   bare/path.png     → url("bare/path.png")  (auto-wrap unquoted image paths)
//   ""                → ""  (empty, pass through — let CSS var stay unset)
//
// The consuming CSS MUST use `background: var(--x)` (shorthand), NOT
// `background-image: var(--x)`, because background-image rejects colour values.
function _normalizeBgValue(val) {
  const v = (val || "").trim();
  if (!v) return v;

  // url("") or url('') — empty image reference, treat as unset so :root cascades.
  if (/^url\s*\(\s*['"]{0,1}\s*['"]{0,1}\s*\)$/.test(v)) return "";

  // Valid url() or gradient — pass through unchanged.
  if (/^url\s*\(/.test(v) || /^(linear|radial|conic)-gradient/.test(v)) return v;

  // Plain CSS colour value — valid for `background:` shorthand as-is.
  if (_isCSSColor(v)) return v;

  // Raw image path without url() wrapper (e.g. "assets/bg.png") — wrap it.
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(v)) return `url("${v}")`;

  // Anything else (unknown) — pass through and let the browser decide.
  return v;
}

// Applies a map of CSS vars to the document root, normalizing bg vars on the way in.
function _applyCustomVars(vars) {
  if (!vars || typeof vars !== "object") return;
  for (const [k, v] of Object.entries(vars)) {
    const normalized = _BG_VAR_NAMES.has(k) ? _normalizeBgValue(v) : v;
    document.documentElement.style.setProperty(k, normalized);
  }
}

/* ---------- Favicon / Cloak Helpers ---------- */

function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = (url && url.startsWith("http")) ? url : (url ? `system/${url}` : "");
}

// Apply saved cloak immediately (before DOMContentLoaded).
(function applyGlobalCloak() {
  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon  = localStorage.getItem("cloakIcon");
  if (savedTitle) document.title = savedTitle;
  if (savedIcon)  setFavicon(savedIcon);
})();

/* ---------- Theme ---------- */

// Resolve a raw theme string — validates against VALID_THEMES, falls back to DEFAULT_THEME.
function _resolveTheme(raw) {
  const t = (raw || "").trim().toLowerCase();
  return VALID_THEMES.has(t) ? t : DEFAULT_THEME;
}

// Apply saved theme immediately (before DOMContentLoaded).
(function applyGlobalTheme() {
  const raw   = localStorage.getItem("selectedTheme");
  const theme = _resolveTheme(raw);

  // Clean up any stale/invalid stored value right now so it never fires again.
  if (raw && raw.trim() !== theme) {
    localStorage.setItem("selectedTheme", theme);
    console.warn(`[themify] Stale theme "${raw}" → replaced with "${theme}"`);
  }

  document.documentElement.setAttribute("theme", theme);

  if (theme === "custom") {
    try {
      _applyCustomVars(JSON.parse(localStorage.getItem("customTheme") || "{}"));
    } catch (_) {}
  }
})();

// Sync theme + cloak changes across tabs.
window.addEventListener("storage", (e) => {
  if (e.key === "cloakTitle") document.title = e.newValue || document.title;
  if (e.key === "cloakIcon")  setFavicon(e.newValue || "");

  if (e.key === "selectedTheme") {
    const t = _resolveTheme(e.newValue);
    document.documentElement.setAttribute("theme", t);
    if (t !== "custom") document.documentElement.style.cssText = "";
  }

  if (e.key === "customTheme" && e.newValue) {
    try {
      _applyCustomVars(JSON.parse(e.newValue));
    } catch (_) {}
  }
});

/* ---------- GIF Config ---------- */

// ROOT_GIFS — hard fallback if a theme entry is missing a state.
// Points to redux since that is DEFAULT_THEME.
const ROOT_GIFS = {
  loading:   { src: "assets/themes/redux/gifStates/loading.gif",   w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  loaded:    { src: "assets/themes/redux/gifStates/loaded.gif",    w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  searching: { src: "assets/themes/redux/gifStates/searching.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  crash:     { src: "assets/themes/redux/gifStates/crash.gif",     w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  ded:       { src: "assets/themes/redux/gifStates/ded.gif",       w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
};

// Builds a full 5-state gif block for a given folder name.
// Note: the theme key "gn-math" maps to folder "gn_math" (underscore, not hyphen).
function _gifBlock(folder) {
  const base = `assets/themes/${folder}/gifStates`;
  return {
    loading:   { src: `${base}/loading.gif`,   w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    loaded:    { src: `${base}/loaded.gif`,    w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    searching: { src: `${base}/searching.gif`, w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    crash:     { src: `${base}/crash.gif`,     w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    ded:       { src: `${base}/ded.gif`,       w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  };
}

// Per-theme GIF blocks. Theme key → folder name.
const THEME_GIFS = {
  wolf:          _gifBlock("wolf"),
  cherrybomb:    _gifBlock("cherrybomb"),
  igor:          _gifBlock("igor"),
  "gn-math":     _gifBlock("gn-math"),      
  selenite:      _gifBlock("selenite"),
  slackerish:    _gifBlock("slackerish"),
  classic:       _gifBlock("classic"),
  redux:         _gifBlock("redux"),
  graduation:    _gifBlock("graduation"),
  "i-am-music":  _gifBlock("i-am-music"),
};

// Returns resolved { src, w, h } for a given theme + state key.
function getThemeGif(theme, key) {
  const resolved  = _resolveTheme(theme);
  const entry     = (THEME_GIFS[resolved] || {})[key] || {};
  const rootEntry = ROOT_GIFS[key] || {};
  return {
    src: entry.src || rootEntry.src || "",
    w:   entry.w   || rootEntry.w   || DEFAULT_GIF_SIZE,
    h:   entry.h   || rootEntry.h   || DEFAULT_GIF_SIZE,
  };
}

// Returns only the src string — used by main.js loader sequences.
function getThemeGifSrc(theme, key) {
  return getThemeGif(theme, key).src;
}

// Applies src + CSS vars to an img element.
function applyGifToImg(img, theme, key) {
  if (!img) return;
  const { src, w, h } = getThemeGif(theme, key);
  if (src) img.src = src;
  img.style.setProperty("--gif-w", `${w}px`);
  img.style.setProperty("--gif-h", `${h}px`);
  img.dataset.gifState = key;
}

// Updates live loader + searching gif when theme changes.
window.applyThemeGifs = function (theme) {
  const t = _resolveTheme(
    theme || document.documentElement.getAttribute("theme")
  );

  const loaderImg = document.querySelector("#containerLoader img");
  if (loaderImg) {
    // Honour whatever state the loader is currently in (loading/loaded/crash/ded).
    const currentState = loaderImg.dataset.gifState || "loading";
    applyGifToImg(loaderImg, t, currentState);
  }

  const searchGif = document.getElementById("noResultsGif");
  // applyGifToImg stamps dataset.gifState = "searching" so it survives future theme swaps.
  if (searchGif) applyGifToImg(searchGif, t, "searching");
};

// Call this whenever you switch the loader to a new state.
window.setLoaderState = function (state) {
  const t   = _resolveTheme(document.documentElement.getAttribute("theme"));
  const img = document.querySelector("#containerLoader img");
  applyGifToImg(img, t, state);
};

/* ---------- Apply loading GIF before DOMContentLoaded ---------- */
// Runs immediately so the correct themed gif is visible before any JS finishes.
// applyGifToImg stamps data-gifState="loading" so applyThemeGifs can read it on theme change.
(function () {
  const theme = _resolveTheme(localStorage.getItem("selectedTheme"));
  const img   = document.querySelector("#containerLoader img");
  if (img) applyGifToImg(img, theme, "loading");
})();