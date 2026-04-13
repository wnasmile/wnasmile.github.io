"use strict";

/* ============================================================
   themify.js — Theme, Cloak, GIF config + Sheets CSS injector
   Load ORDER: 2nd (depends on: utils.js)
   IIFEs run immediately — theme/cloak/GIF apply before first paint.
   Sheets fetch runs after DOMContentLoaded and injects theme CSS
   blocks dynamically, replacing the old static themes.css.
   ============================================================ */

/* ============================================================
   CONSTANTS
   ============================================================ */

const DEFAULT_THEME    = "redux";
const DEFAULT_GIF_SIZE = 128;

/* ---------- Valid theme names ----------
   Used by _resolveTheme as a safe fallback — if a stored theme
   ID doesn't exist in the set, it falls back to DEFAULT_THEME.
   This means removed themes gracefully degrade rather than crash.
   New themes added to the sheet don't need to be listed here to
   work — the sheet fetch adds their CSS blocks regardless.
   VALID_THEMES is only a guard for the GIF system (which is
   folder-based) and for _resolveTheme's fallback. ----------- */
const VALID_THEMES = new Set([
  "wolf", "cherrybomb", "igor", "gn-math", "selenite",
  "slackerish", "classic", "redux", "graduation", "i-am-music",
]);

/* ============================================================
   SHEETS API — column layout (A=0 … Q=16)
     0  theme name (display)
     1  identification  ← html[theme] selector
     2  type            "ok" | "soon"
     3  --header-bg
     4  --quote-bg
     5  --main-bg
     6  --footer-bg
     7  --aside-bg
     8  --text-color
     9  --url-color
    10  --quote-color
    11  --accent-color
    12  --search-bg
    13  --search-text
    14  --search-placeholder
    15  --icon-bg
    16  --shadow-color
   ============================================================ */

const _SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbyZTYA0gxlYs87DIABZFZuNW_RF7Y2nfLQJXy1j1iaCYLyxf_EDVsJ_g1iTMrRY0zpC/exec";

const _COL = {
  name: 0,
  id:   1,
  type: 2,
  vars: [
    "--header-bg",          // 3
    "--quote-bg",           // 4
    "--main-bg",            // 5
    "--footer-bg",          // 6
    "--aside-bg",           // 7
    "--text-color",         // 8
    "--url-color",          // 9
    "--quote-color",        // 10
    "--accent-color",       // 11
    "--search-bg",          // 12
    "--search-text",        // 13
    "--search-placeholder", // 14
    "--icon-bg",            // 15
    "--shadow-color",       // 16
  ],
};

/* :root defaults — redux, written immediately on script parse so
   the page is never unstyled while the Sheets fetch is in flight. */
const _ROOT_CSS = `:root {
  --header-bg: url("https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/Redux-headerbg.png");
  --quote-bg: url("https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/Redux-quotebg.png");
  --main-bg: url("https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/Redux-mainbg.png");
  --footer-bg: url("https://raw.githubusercontent.com/wnasmile/wnasmile.github.io/main/assets/themes/redux/footerbg.png");
  --aside-bg: rgba(0, 0, 0, 0.95);
  --text-color: #000;
  --url-color: #fff;
  --quote-color: #fff;
  --accent-color: #ff4444;
  --search-bg: #f0f0f0;
  --search-text: #333;
  --search-placeholder: #888;
  --icon-bg: #333;
  --shadow-color: rgba(0, 0, 0, 0.3);
}`;

/* ============================================================
   BACKGROUND VALUE NORMALIZER
   ============================================================ */

const _BG_VAR_NAMES = new Set([
  "--main-bg", "--body-bg", "--bg", "--background",
  "--header-bg", "--footer-bg", "--sidebar-bg",
  "--quote-bg", "--aside-bg",
]);

function _isCSSColor(val) {
  const v = (val || "").trim();
  if (!v || v === "none" || v === "inherit" || v === "transparent") return false;
  return (
    /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ||
    /^rgb[a]?\s*\(/.test(v) ||
    /^hsl[a]?\s*\(/.test(v) ||
    /^(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/i.test(v)
  );
}

function _normalizeBgValue(val) {
  const v = (val || "").trim();
  if (!v) return v;
  if (/^url\s*\(\s*['"]{0,1}\s*['"]{0,1}\s*\)$/.test(v)) return "";
  if (/^url\s*\(/.test(v) || /^(linear|radial|conic)-gradient/.test(v)) return v;
  if (_isCSSColor(v)) return v;
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(v)) return `url("${v}")`;
  if (/^https?:\/\//i.test(v)) return `url("${v}")`;
  return v;
}

function _applyCustomVars(vars) {
  if (!vars || typeof vars !== "object") return;
  for (const [k, v] of Object.entries(vars)) {
    const normalized = _BG_VAR_NAMES.has(k) ? _normalizeBgValue(v) : v;
    document.documentElement.style.setProperty(k, normalized);
  }
}

/* ============================================================
   FAVICON / CLOAK
   ============================================================ */

function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = (url && url.startsWith("http")) ? url : (url ? `system/${url}` : "");
}

(function applyGlobalCloak() {
  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon  = localStorage.getItem("cloakIcon");
  if (savedTitle) document.title = savedTitle;
  if (savedIcon)  setFavicon(savedIcon);
})();

/* ============================================================
   THEME RESOLUTION + APPLICATION
   ============================================================ */

/* _resolveTheme — validates against VALID_THEMES, falls back to
   DEFAULT_THEME. Any theme ID that exists in VALID_THEMES passes
   through. IDs not in the set (e.g. a removed theme) fall back to
   DEFAULT_THEME rather than crashing. New sheet themes that aren't
   in VALID_THEMES will still have their CSS injected — they just
   won't be "resolved" through this guard. For applying themes by
   identification directly (e.g. from the sheet) use applyTheme()
   which sets the attribute without going through _resolveTheme. */
function _resolveTheme(raw) {
  const t = (raw || "").trim().toLowerCase();
  return VALID_THEMES.has(t) ? t : DEFAULT_THEME;
}

/* Apply saved theme immediately — runs before DOMContentLoaded.
   Restores whatever was last saved in localStorage. If the theme
   no longer exists in the sheet its html[theme] attr will still
   be set — it simply won't match any injected CSS block, so the
   page falls back to :root (redux defaults). This is intentional:
   the theme persists, and if it comes back to the sheet it works
   again without any user action. */
(function applyGlobalTheme() {
  const raw   = localStorage.getItem("selectedTheme");
  const theme = raw ? raw.trim() : DEFAULT_THEME;

  if (!raw) localStorage.setItem("selectedTheme", DEFAULT_THEME);

  document.documentElement.setAttribute("theme", theme);

  if (theme === "custom") {
    try {
      _applyCustomVars(JSON.parse(localStorage.getItem("customTheme") || "{}"));
    } catch (_) {}
  }
})();

/* Sync theme + cloak changes across tabs. */
window.addEventListener("storage", (e) => {
  if (e.key === "cloakTitle") document.title = e.newValue || document.title;
  if (e.key === "cloakIcon")  setFavicon(e.newValue || "");

  if (e.key === "selectedTheme") {
    const t = (e.newValue || "").trim() || DEFAULT_THEME;
    document.documentElement.setAttribute("theme", t);
    if (t !== "custom") document.documentElement.style.cssText = "";
  }

  if (e.key === "customTheme" && e.newValue) {
    try { _applyCustomVars(JSON.parse(e.newValue)); } catch (_) {}
  }
});

/* Public: apply a theme by its identification string.
   Does NOT validate against VALID_THEMES — accepts any string
   from the sheet. Saves to localStorage so it persists across
   sessions. Fires GIF sync. */
function applyTheme(id) {
  const t = (id || "").trim() || DEFAULT_THEME;
  document.documentElement.setAttribute("theme", t);
  try { localStorage.setItem("selectedTheme", t); } catch (_) {}
  if (typeof window.applyThemeGifs === "function") window.applyThemeGifs(t);
}

/* ============================================================
   GIF CONFIG
   ============================================================ */

const ROOT_GIFS = {
  loading:   { src: "assets/themes/redux/gifStates/loading.gif",   w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  loaded:    { src: "assets/themes/redux/gifStates/loaded.gif",    w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  searching: { src: "assets/themes/redux/gifStates/searching.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  crash:     { src: "assets/themes/redux/gifStates/crash.gif",     w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  ded:       { src: "assets/themes/redux/gifStates/ded.gif",       w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
};

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

const THEME_GIFS = {
  wolf:         _gifBlock("wolf"),
  cherrybomb:   _gifBlock("cherrybomb"),
  igor:         _gifBlock("igor"),
  "gn-math":    _gifBlock("gn-math"),
  selenite:     _gifBlock("selenite"),
  slackerish:   _gifBlock("slackerish"),
  classic:      _gifBlock("classic"),
  redux:        _gifBlock("redux"),
  graduation:   _gifBlock("graduation"),
  "i-am-music": _gifBlock("i-am-music"),
};

/* Returns resolved { src, w, h } for a theme + state.
   Falls back through ROOT_GIFS if the theme has no entry. */
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

function getThemeGifSrc(theme, key) {
  return getThemeGif(theme, key).src;
}

function applyGifToImg(img, theme, key) {
  if (!img) return;
  const { src, w, h } = getThemeGif(theme, key);
  if (src) img.src = src;
  img.style.setProperty("--gif-w", `${w}px`);
  img.style.setProperty("--gif-h", `${h}px`);
  img.dataset.gifState = key;
}

window.applyThemeGifs = function (theme) {
  const t = _resolveTheme(
    theme || document.documentElement.getAttribute("theme")
  );
  const loaderImg = document.querySelector("#containerLoader img");
  if (loaderImg) {
    const currentState = loaderImg.dataset.gifState || "loading";
    applyGifToImg(loaderImg, t, currentState);
  }
  const searchGif = document.getElementById("noResultsGif");
  if (searchGif) applyGifToImg(searchGif, t, "searching");
};

window.setLoaderState = function (state) {
  const t   = _resolveTheme(document.documentElement.getAttribute("theme"));
  const img = document.querySelector("#containerLoader img");
  applyGifToImg(img, t, state);
};

/* Apply loading GIF immediately — before DOMContentLoaded. */
(function () {
  const theme = _resolveTheme(localStorage.getItem("selectedTheme"));
  const img   = document.querySelector("#containerLoader img");
  if (img) applyGifToImg(img, theme, "loading");
})();

/* ============================================================
   SHEETS CSS INJECTOR
   Fetches theme data each session and injects html[theme="id"]
   CSS blocks. Does NOT cache rows — only the active theme ID
   is persisted (via localStorage "selectedTheme"). This means:
   - Themes that are removed from the sheet lose their CSS block
     but the html[theme] attr stays set, falling back to :root.
   - Themes that are added to the sheet appear automatically on
     the next session without any code change.
   ============================================================ */

let _themeData = [];
let _styleEl   = null;

function _getStyleEl() {
  if (!_styleEl) {
    _styleEl = document.getElementById("ws-themes");
    if (!_styleEl) {
      _styleEl = document.createElement("style");
      _styleEl.id = "ws-themes";
      document.head.prepend(_styleEl);
    }
  }
  return _styleEl;
}

/* Normalize a raw sheet cell value for use as a CSS property value. */
function _normalizeSheetVal(raw) {
  const v = (raw || "").toString().trim();
  if (!v) return "";
  return _normalizeBgValue(v);
}

function _buildThemeBlock(row) {
  const id = (row[_COL.id] || "").toString().trim();
  if (!id) return "";

  const decls = _COL.vars
    .map((varName, i) => {
      const val = _normalizeSheetVal(row[3 + i]);
      return val ? `  ${varName}: ${val};` : "";
    })
    .filter(Boolean)
    .join("\n");

  if (!decls) return "";
  return `html[theme="${id}"] {\n${decls}\n}`;
}

function _injectAllThemes(rows) {
  const blocks = rows.map(_buildThemeBlock).filter(Boolean).join("\n\n");
  _getStyleEl().textContent = _ROOT_CSS + (blocks ? "\n\n" + blocks : "");
}

async function fetchThemes(forceRefresh) {
  try {
    const res  = await fetch(_SHEETS_URL + (forceRefresh ? "?bust=" + Date.now() : ""));
    const json = await res.json();

    if (!Array.isArray(json)) throw new Error(json.error || "Unexpected API response");

    _themeData = json.slice(0, 10);
    _injectAllThemes(_themeData);

  } catch (err) {
    console.warn("[themify] Sheets fetch failed:", err.message);
    // :root defaults are already injected — page stays styled.
    // Any previously applied html[theme] attr still matches if
    // the theme was injected before the failure.
  }
}

/* Public API surface */
function getThemeData() { return _themeData; }

function getThemeId(index) {
  const row = _themeData[index];
  if (!row) return null;
  const id   = (row[_COL.id]   || "").toString().trim();
  const type = (row[_COL.type] || "").toString().trim().toLowerCase();
  return (id && type !== "soon") ? id : null;
}

window.ThemifySheets = { applyTheme, fetchThemes, getThemeData, getThemeId };

/* Write :root defaults immediately (sync) so vars exist before
   any CSS paint, then kick off the async sheet fetch. */
(function bootSheets() {
  _getStyleEl().textContent = _ROOT_CSS;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => fetchThemes(false));
  } else {
    fetchThemes(false);
  }
})();