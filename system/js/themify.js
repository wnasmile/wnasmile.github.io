"use strict";

const DEFAULT_THEME    = "redux";
const DEFAULT_GIF_SIZE = 128;

const VALID_THEMES = new Set([
  "wolf", "cherrybomb", "igor", "gn-math", "selenite",
  "slackerish", "classic", "redux", "graduation", "i-am-music",
]);

const _SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbyPsCoJ1EQ9FMLkGJVo98WlHZIA7ZRsqcC2Wo4dgLO7U1Sn6reZhbJXFTwNocHs7BA/exec";

const _COL = {
  name: 0,
  id:   1,
  type: 2,
  vars: [
    "--header-bg",          

    "--quote-bg",           

    "--main-bg",            

    "--footer-bg",          

    "--aside-bg",           

    "--text-color",         

    "--url-color",          

    "--quote-color",        

    "--accent-color",       

    "--search-bg",          

    "--search-text",        

    "--search-placeholder", 

    "--icon-bg",            

    "--shadow-color",       

  ],
};

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
  // data: URLs (decoded CDURL2 tokens arrive here as bare data URLs — wrap for CSS)
  if (v.startsWith("data:")) return `url("${v}")`;
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
   CDURL2 DECODER
   Compact compressed data-URL format produced by the DataURL
   Compressor tool. Format: "CDURL2:" + mimeHex + methodHex +
   base64url(deflate(raw_image_bytes)).

   _maybeDecode(val) is the public entry point used by the sheet
   normalizer. It is a no-op (returns val unchanged) for anything
   that is not a CDURL2 token — https:// URLs, data: URLs, CSS
   color values, gradients, url(...) wrappers, and plain empty
   strings all pass straight through untouched.
   ============================================================ */

const _CDURL_PREFIX = "CDURL2:";

const _CDURL_MIME = [
  "data:image/png;base64,",
  "data:image/jpeg;base64,",
  "data:image/gif;base64,",
  "data:image/webp;base64,",
  "data:image/svg+xml;base64,",
  "data:image/avif;base64,",
  "data:image/bmp;base64,",
];

/* Guard: true only if the string is a genuine CDURL2 token. */
function _isCDURL(v) {
  if (typeof v !== "string") return false;
  if (!v.startsWith(_CDURL_PREFIX)) return false;
  const body = v.slice(_CDURL_PREFIX.length);
  // Must have at least 2 header chars + some payload
  if (body.length < 8) return false;
  // mimeHex must be a valid single hex digit index
  const mimeIdx = parseInt(body[0], 16);
  if (isNaN(mimeIdx) || mimeIdx >= _CDURL_MIME.length) return false;
  // Second char is method byte — must be '0' (deflate) for now
  if (body[1] !== "0") return false;
  // Payload must be URL-safe base64 chars only
  if (!/^[A-Za-z0-9\-_]+$/.test(body.slice(2))) return false;
  return true;
}

/* Convert URL-safe base64 string → Uint8Array */
function _b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* Convert Uint8Array → standard base64 string */
function _bytesToB64(arr) {
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

/* Inflate (DEFLATE decompress) a Uint8Array → Uint8Array */
async function _inflate(bytes) {
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const chunks = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

/* Decode a CDURL2 token → full data:image/...;base64,... URL */
async function _decodeCDURL(token) {
  const body     = token.slice(_CDURL_PREFIX.length);
  const mimeIdx  = parseInt(body[0], 16);
  const payload  = body.slice(2);                     // skip mime + method bytes
  const mime     = _CDURL_MIME[mimeIdx];
  const compressed = _b64urlToBytes(payload);
  const raw        = await _inflate(compressed);
  return mime + _bytesToB64(raw);
}

/*
  _maybeDecode(val) — called on every raw sheet cell value.

  Pass-through (returns val unchanged, synchronously resolved) when:
    - val is empty / not a string
    - starts with https:// or http://     → plain URL, use as-is
    - starts with data:                   → already a data URL
    - starts with url(                    → already wrapped CSS value
    - starts with a gradient keyword      → CSS gradient
    - is a CSS color (#hex, rgb(), etc.)  → CSS color
    - starts with CDURL2: but fails _isCDURL validation → treated as
      unknown/corrupt, logged and passed through so page doesn't break

  Decodes when:
    - _isCDURL(val) returns true          → decompress and return data URL
*/
async function _maybeDecode(val) {
  if (!val || typeof val !== "string") return val;
  const v = val.trim();

  // Fast-path: skip anything that obviously isn't a CDURL2 token
  if (
    v.startsWith("https://") ||
    v.startsWith("http://")  ||
    v.startsWith("data:")    ||
    v.startsWith("url(")     ||
    /^(linear|radial|conic)-gradient/.test(v) ||
    _isCSSColor(v)
  ) return v;

  // If it looks like it could be CDURL2 but fails validation, warn + pass through
  if (v.startsWith(_CDURL_PREFIX)) {
    if (!_isCDURL(v)) {
      console.warn("[themify] CDURL2 token failed validation, skipping decode:", v.slice(0, 32) + "…");
      return v;
    }
    try {
      return await _decodeCDURL(v);
    } catch (err) {
      console.warn("[themify] CDURL2 decode failed, using raw value:", err.message);
      return v;   // graceful fallback — don't crash the theme
    }
  }

  // Anything else (relative paths, unknown strings) — pass through
  return v;
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
  if (localStorage.getItem("cloakEnabled") !== "true") return;
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
  if (e.key === "cloakTitle") { if (localStorage.getItem("cloakEnabled") === "true") document.title = e.newValue || document.title; }
  if (e.key === "cloakIcon")  { if (localStorage.getItem("cloakEnabled") === "true") setFavicon(e.newValue || ""); }

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
  loading:   { src: "assets/gifs/redux/loading.gif",   w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  loaded:    { src: "assets/gifs/redux/loaded.gif",    w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  searching: { src: "assets/gifs/redux/searching.gif", w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  held:      { src: "assets/gifs/redux/held.gif",      w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  drop:      { src: "assets/gifs/redux/drop.gif",      w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  crash:     { src: "assets/gifs/redux/crash.gif",     w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
  ded:       { src: "assets/gifs/redux/ded.gif",       w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
};

function _gifBlock(folder) {
  const base = `assets/gifs/${folder}`;
  return {
    loading:   { src: `${base}/loading.gif`,   w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    loaded:    { src: `${base}/loaded.gif`,    w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    searching: { src: `${base}/searching.gif`, w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    held:      { src: `${base}/held.gif`,      w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
    drop:      { src: `${base}/drop.gif`,      w: DEFAULT_GIF_SIZE, h: DEFAULT_GIF_SIZE },
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

/* Normalize a raw sheet cell value for use as a CSS property value.
   Async because CDURL2 values must be decoded (inflated) first.
   For plain URLs, colors, and gradients this resolves instantly. */
async function _normalizeSheetVal(raw) {
  const v = (raw || "").toString().trim();
  if (!v) return "";
  const decoded = await _maybeDecode(v);   // no-op for non-CDURL2 values
  return _normalizeBgValue(decoded);
}

async function _buildThemeBlock(row) {
  const id = (row[_COL.id] || "").toString().trim();
  if (!id) return "";

  const declPairs = await Promise.all(
    _COL.vars.map(async (varName, i) => {
      const val = await _normalizeSheetVal(row[3 + i]);
      return val ? `  ${varName}: ${val};` : "";
    })
  );

  const decls = declPairs.filter(Boolean).join("\n");
  if (!decls) return "";
  return `html[theme="${id}"] {\n${decls}\n}`;
}

async function _injectAllThemes(rows) {
  const built = await Promise.all(rows.map(_buildThemeBlock));
  const blocks = built.filter(Boolean).join("\n\n");
  _getStyleEl().textContent = _ROOT_CSS + (blocks ? "\n\n" + blocks : "");
}

async function fetchThemes(forceRefresh) {
  try {
    const res  = await fetch(_SHEETS_URL + (forceRefresh ? "?bust=" + Date.now() : ""));
    const json = await res.json();

    if (!Array.isArray(json)) throw new Error(json.error || "Unexpected API response");

    _themeData = json.slice(0, 10);
    await _injectAllThemes(_themeData);

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