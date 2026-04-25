/* ============================================================
   main.js — Card loader, paging, search, favorites,
             loader sequences, scroll persistence, page physics,
             draggable gif, Discord widget
   Load ORDER: 8th (depends on: utils.js, themify.js, sanitizer.js)
   ============================================================ */

"use strict";

/* ============================================================
   SCROLL POSITION PERSISTENCE
   ============================================================ */

(function initScrollPersistence() {
  const saveScroll = debounce(() => {
    sessionStorage.setItem("scrollY", String(Math.round(window.scrollY)));
  }, 100);
  window.addEventListener("scroll", saveScroll, { passive: true });

  window._restoreScrollY = function () {
    const saved = parseInt(sessionStorage.getItem("scrollY") || "0", 10);
    if (!saved) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        window.scrollTo({ top: saved, behavior: "instant" })
      )
    );
  };
})();

/* ============================================================
   PAGE PHYSICS (arrow-key navigation)
   ============================================================ */

(() => {
  const PAGE_ACCEL     = 0.9;
  const PAGE_FRICTION  = 0.85;
  const PAGE_THRESHOLD = 1;
  const TAP_COOLDOWN   = 300;

  let velocity = 0, lastFlip = 0;
  const keys = { left: false, right: false };

  const canFlip = () =>
    typeof window.nextPage === "function" &&
    typeof window.prevPage === "function" &&
    performance.now() - lastFlip > TAP_COOLDOWN;

  const flipNext = () => { if (!canFlip()) return; lastFlip = performance.now(); window.nextPage(); };
  const flipPrev = () => { if (!canFlip()) return; lastFlip = performance.now(); window.prevPage(); };

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { keys.right = true; if (!e.repeat) flipNext(); }
    if (e.key === "ArrowLeft")  { keys.left  = true; if (!e.repeat) flipPrev(); }
  });
  document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowLeft")  keys.left  = false;
  });

  (function loop() {
    if (keys.right) velocity += PAGE_ACCEL;
    if (keys.left)  velocity -= PAGE_ACCEL;
    velocity *= PAGE_FRICTION;
    if (velocity >  PAGE_THRESHOLD) { flipNext(); velocity = 0; }
    if (velocity < -PAGE_THRESHOLD) { flipPrev(); velocity = 0; }
    if (Math.abs(velocity) < 0.01) velocity = 0;
    requestAnimationFrame(loop);
  })();
})();

/* ============================================================
   DRAGGABLE SEARCHING GIF
   ============================================================ */

function initGifDrag(gif) {
  const SWAY_STRENGTH = 0.6;
  const RETURN_SPEED  = 0.08;
  const DROP_DURATION = 1600;

  const _getDragTheme = () =>
    document.documentElement.getAttribute("theme") || DEFAULT_THEME;

  const getIdleSrc = () => getThemeGifSrc(_getDragTheme(), "searching");
  // "held" and "drop" are drag-specific states; fall back to "searching" if the theme
  // doesn't define them (getThemeGifSrc returns the root searching gif as fallback).
  const getHeldSrc = () => getThemeGifSrc(_getDragTheme(), "held") || getIdleSrc();
  const getDropSrc = () => getThemeGifSrc(_getDragTheme(), "drop") || getIdleSrc();

  let dragging = false, dropping = false;
  let mouseX = 0, mouseY = 0, lastMouseX = 0, rotation = 0;

  new MutationObserver(() => {
    if (gif.style.display !== "none") gif.style.pointerEvents = "auto";
  }).observe(gif, { attributes: true, attributeFilter: ["style"] });

  gif.addEventListener("mousedown", (e) => {
    if (dropping) return;
    dragging = true;
    gif.src = getHeldSrc();
    gif.style.cursor = "grabbing";
    mouseX = e.clientX; mouseY = e.clientY; lastMouseX = mouseX;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false; dropping = true;
    gif.style.cursor = "grab";
    gif.src = getDropSrc();
    gif.style.top = (parseFloat(gif.style.top) || 0) + 6 + "px";
    setTimeout(() => { gif.src = getIdleSrc(); dropping = false; }, DROP_DURATION);
  });

  (function tick() {
    if (dragging) {
      rotation += (mouseX - lastMouseX) * SWAY_STRENGTH;
      rotation *= 0.9;
      gif.style.left = mouseX + "px";
      gif.style.top  = mouseY + "px";
    } else {
      rotation *= (1 - RETURN_SPEED);
    }
    gif.style.transform = `translate(-50%, 0) rotate(${rotation}deg)`;
    lastMouseX = mouseX;
    requestAnimationFrame(tick);
  })();
}

/* ============================================================
   DISCORD WIDGET (WidgetBot Crate)
   ============================================================ */

window.addEventListener("load", () => {
  if (typeof Crate !== "undefined") {
    new Crate({ server: "1451796462517096642", channel: "1451796463368667218" });
  }
});

/* ============================================================
   MAIN APP IIFE
   ============================================================ */

(() => {
  /* ---------- DOM & Config ---------- */
  function initElements() {
    const $ = (sel) => {
      try {
        if (!sel) return null;
        return /^[A-Za-z0-9\-_]+$/.test(sel)
          ? document.getElementById(sel)
          : document.querySelector(sel) || null;
      } catch { return null; }
    };

    window.dom = {
      container:          $("#container"),
      pageIndicator:      $(".page-indicator") || $("#page-indicator"),
      searchInput:        $("#searchInputHeader"),
      searchBtn:          $("#searchBtnHeader"),
      updatePopup:        $("#updatePopup"),
      updatePopupContent: $(".update-popup-content"),
      viewUpdateBtn:      $("#viewUpdateBtn"),
      viewUpdateInfoBtn:  $("#viewUpdateInfoBtn"),
      closeUpdateBtn:     $("#closeUpdateBtn"),
      dontShowBtn:        $("#dontShowBtn"),
      updateVideo:        $("#updateVideo"),
    };

    window.config = {
      fallbackImage:    "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/404_blank.png",
      fallbackLink:     "https://01110010-00110101.github.io./source/dino/",
      sheetUrl:         "https://script.google.com/macros/s/AKfycbyRGROJ70xwLEBLiWAw_7iSX42VkJSxg671wOmjfYo_cvvaDSs9mbXpK6S1EKa9oYQByA/exec",
      devBuildUrl:      "https://script.google.com/macros/s/AKfycbzYEREHz2GuCYaHQzpvvHnUvvsRhIC8EbyhbCbrfQXkSu6gkP7kb5iIL5LY4WAF3rfFow/exec",
      updateTrailerSrc: "",
      updateLink:       "system/pages/version-log.html",
    };

    window.stickerPacksLibrary = [
      {
        name:    "wnasmile",
        dynamic: "https://cdn.jsdelivr.net/gh/wnasmile/stickpack@main/dynamic/",
        static:  "https://cdn.jsdelivr.net/gh/wnasmile/stickpack@main/static/",
      },
      {
        name:    "legacy",
        dynamic: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/stickers/",
        static:  "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/stickers/",
      },
    ];

    if (!window._activeFetchUrl) window._activeFetchUrl = window.config.sheetUrl;
  }

  /* ---------- Favorites ---------- */
  function initFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(stored.map(s => safeStr(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = () =>
      localStorage.setItem("favorites", JSON.stringify([...window.favorites]));

    window.refreshCards = () => {
      if (!window.assetsData || typeof createAssetCards !== "function") return [];
      const savedY    = window.scrollY;
      const promises  = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
      Promise.all(promises.map(p => p.promise ?? p).filter(Boolean))
        .finally(() => window.scrollTo({ top: savedY, behavior: "instant" }));
      return promises;
    };
  }

  /* ---------- GIF Duration Parser ---------- */

  // Cache keyed by gif src URL so switching themes always fetches + measures the
  // correct gif instead of returning a stale duration from a previous theme.
  const _gifDurationCache = new Map();

  // Always fetch the loaded GIF for the currently active theme dynamically.
  // A hardcoded path (e.g. ROOT_GIFS.loaded.src) would always pull classic/redux
  // regardless of the selected theme, causing the wrong GIF to measure and display.
  const _getLoadedGifUrl = () => getThemeGifSrc(_getTheme(), "loaded");

  function parseGifDuration(buf) {
    const b = new Uint8Array(buf);
    let ms = 0, i = 13;
    if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 0x07) + 1));
    while (i < b.length) {
      const block = b[i];
      if (block === 0x3B) break;
      if (block === 0x2C) {
        i += 10;
        if (b[i - 1] & 0x80) i += 3 * (1 << ((b[i - 1] & 0x07) + 1));
        i++;
        while (i < b.length) { const len = b[i++]; if (!len) break; i += len; }
      } else if (block === 0x21) {
        if (b[i + 1] === 0xF9) ms += (b[i + 4] | (b[i + 5] << 8)) * 10;
        i += 2;
        while (i < b.length) { const len = b[i++]; if (!len) break; i += len; }
      } else { i++; }
    }
    return ms > 0 ? ms : 2000;
  }

  function getLoadedGifDuration() {
    const url = _getLoadedGifUrl();
    if (_gifDurationCache.has(url)) return Promise.resolve(_gifDurationCache.get(url));
    return fetch(url)
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.arrayBuffer(); })
      .then(buf => {
        const ms = parseGifDuration(buf);
        _gifDurationCache.set(url, ms);
        return ms;
      });
  }

  // Returns the duration for an arbitrary gif URL (used by crash/ded sequences).
  function getGifDuration(url) {
    if (_gifDurationCache.has(url)) return Promise.resolve(_gifDurationCache.get(url));
    return fetch(url)
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.arrayBuffer(); })
      .then(buf => {
        const ms = parseGifDuration(buf);
        _gifDurationCache.set(url, ms);
        return ms;
      });
  }

  /* ---------- Loader Sequences ---------- */
  window._loaderSequenceRunning = false;

  function _getTheme() {
    return document.documentElement.getAttribute("theme") || DEFAULT_THEME;
  }

  function runLoaderSequence() {
    if (window._loaderSequenceRunning) return;
    const loader = document.getElementById("containerLoader");
    if (!loader) return;
    window._loaderSequenceRunning = true;

    const img = loader.querySelector("img");
    if (!img) { loader.remove(); return; }

    const finish = () => { loader.remove(); document.body.classList.remove("ws-loading"); };

    getLoadedGifDuration()
      .then(ms => {
        // Re-read theme inside the callback — not at call time.
        // If the user switched themes while the fetch was in flight, this ensures
        // the correct themed gif is stamped rather than the stale closure value.
        applyGifToImg(img, _getTheme(), "loaded");
        setTimeout(finish, ms);
      })
      .catch(() => {
        applyGifToImg(img, _getTheme(), "loaded");
        setTimeout(finish, 2000);
      });
  }

  function runCrashSequence() {
    if (window._loaderSequenceRunning) return;
    const loader = document.getElementById("containerLoader");
    if (!loader) return;
    window._loaderSequenceRunning = true;

    const img = loader.querySelector("img");
    if (!img) return;

    document.body.classList.remove("ws-loading");

    // Re-read theme inside callbacks — same reason as runLoaderSequence above.
    const crashSrc = getThemeGifSrc(_getTheme(), "crash");
    getGifDuration(crashSrc)
      .catch(() => 2000)
      .then(ms => {
        applyGifToImg(img, _getTheme(), "crash");
        setTimeout(() => { applyGifToImg(img, _getTheme(), "ded"); }, ms);
      });
  }

  /* ---------- Per-Page Loader Dismiss ---------- */
  // Called when the user is already on a page when its images finish loading.
  // Runs the loaded-gif sequence just like the initial page load does.
  function _dismissPageLoader(pageNum) {
    if (+window.currentPage !== pageNum) return; // user navigated away — skip
    runLoaderSequence();
  }

  /* ---------- Embed Shell Builder ---------- */
  function buildEmbedShell(embedSrc, title, fav) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="icon" href="${fav}" crossorigin="anonymous" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    embed { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; border: none; display: block; }
    #refreshBtn {
      position: fixed; top: 8px; right: 8px; z-index: 9999;
      background: rgba(0,0,0,0.6); color: #fff; border: none;
      border-radius: 6px; padding: 4px 10px; font-family: monospace;
      font-size: 13px; cursor: pointer; opacity: 0.4; transition: opacity 0.2s;
    }
    #refreshBtn:hover { opacity: 1; }
  </style>
</head>
<body>
  <embed id="frame" src="${embedSrc}" />
  <button id="refreshBtn" title="Refresh"
    onclick="document.getElementById('frame').src=document.getElementById('frame').src">↺</button>
</body>
</html>`;
  }

  /* ---------- HTML fetch helper (deduped from two identical blocks) ---------- */
  async function fetchAndOpenHTML(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const raw     = await res.text();
    const pageURL = URL.createObjectURL(
      new Blob([sanitizeHTML(raw)], { type: "text/html;charset=utf-8" })
    );
    window.open(pageURL, "_blank");
  }

  /* ---------- Asset Card Builder ---------- */

  (function injectIgnoreGuardCSS() {
    if (document.getElementById("__ws_ignore_guard__")) return;
    const s = document.createElement("style");
    s.id = "__ws_ignore_guard__";
    // .asset-card defaults to display:none so cards never leak layout space before
    // they are explicitly shown by renderPage(). The "ready" class is added only after
    // the card's image resolves, at which point renderPage sets display:flex for cards
    // on the current page and display:none for all others.
    // This eliminates the flash/leak where off-page cards briefly fill page 1 space.
    s.textContent = [
      // Cards are hidden by inline style (display:none) stamped at creation time in
      // createAssetCards. This prevents ANY card from taking up layout space before
      // renderPage explicitly shows it — eliminating the page-leak flash entirely.
      // The ignore-guard uses !important because those cards must never be shown at all.
      `.asset-card[data-ignore="true"]{display:none!important;opacity:0!important;width:0!important;height:0!important;margin:0!important;padding:0!important;pointer-events:none!important;overflow:hidden!important;}`,
    ].join("");
    document.head.appendChild(s);
  })();

  /* ---------- Inject Font Awesome + download-button styles (once) ---------- */
  (function injectAssetActionStyles() {
    if (document.getElementById("__ws_asset_actions__")) return;

    // Font Awesome 4.7 (slim CDN — only loaded once)
    if (!document.querySelector("link[href*='font-awesome']")) {
      const fa = document.createElement("link");
      fa.rel  = "stylesheet";
      fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
      document.head.appendChild(fa);
    }

    const s = document.createElement("style");
    s.id = "__ws_asset_actions__";
    s.textContent = `
      .card-actions {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 2px;
        margin-top: 4px;
        padding: 0 2px;
        line-height: 1;
        width: 100%;
      }
      .favorite-star {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 3px;
        font-size: 16px;
        line-height: 1;
        color: inherit;
        flex-shrink: 0;
      }
      .asset-download-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 3px;
        font-size: 14px;
        line-height: 1;
        color: inherit;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
      }
      .asset-download-btn .fa { pointer-events: none; }
    `;
    document.head.appendChild(s);
  })();

  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return [];

    container.innerHTML = "";
    const imagePromises = [];
    const frag          = document.createDocumentFragment();
    const sortMode      = getSortMode();
    const isFav         = (t) => window.favorites.has(safeStr(t).toLowerCase());
    const activePage    = +window.currentPage || +sessionStorage.getItem("currentPage") || 1;

    let sorted = Array.isArray(data) ? data.slice() : [];
    if (sortMode === "alphabetical") {
      sorted.sort((a, b) => fastCompare(safeStr(a.title), safeStr(b.title)));
    }

    // Bucket assets by page, skip hidden ones.
    const pageBuckets = new Map();
    for (const asset of sorted) {
      const statusRaw = safeStr(asset.status).toLowerCase();
      const typeRaw   = safeStr(asset.type).toLowerCase();
      // skip hidden/ignored
      if (statusRaw === "hide" || statusRaw === "hidden") continue;
      if (statusRaw.split("|").map(s => s.trim()).includes("ignore")) continue;
      if (typeRaw.split("|").map(s => s.trim()).includes("ignore")) continue;
      const p = Number(asset.page) || 1;
      if (!pageBuckets.has(p)) pageBuckets.set(p, []);
      pageBuckets.get(p).push(asset);
    }

    // Flatten in page order so DOM order matches page order.
    const domOrdered = [];
    for (const p of [...pageBuckets.keys()].sort((a, b) => a - b)) {
      domOrdered.push(...pageBuckets.get(p));
    }

    const badgeMap = {
      featured: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/featured-cover.png",
      new:      "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/new-cover.png",
      fixed:    "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/fixed-cover.png",
      fix:      "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/fixing.png",
    };

    const addOverlay = (wrapper, src, alt, cls, fullCover = false) => {
      const o = document.createElement("img");
      o.src = src; o.alt = alt; o.className = `status-overlay ${cls}`;
      Object.assign(o.style, {
        position: "absolute", top: "0", left: "0",
        width: "100%", height: "100%", objectFit: "cover",
        pointerEvents: "none", zIndex: fullCover ? "10" : "5",
      });
      wrapper.appendChild(o);
    };

    for (const asset of domOrdered) {
      const title      = safeStr(asset.title).trim();
      const author     = safeStr(asset.author).trim();
      const imageSrc   = safeStr(asset.image) || config.fallbackImage;
      const link       = safeStr(asset.link)  || config.fallbackLink;
      const pageNum    = Number(asset.page)   || 1;
      const isActivePage = pageNum === activePage;

      // ── Parse stacked status (col G) and type (col I) ──
      // status: ok | soon | fix | cooked | ignore   (pipe-separated for stacking)
      // type:   featured | new | fixed | shiny | disco | animated | grail   (pipe-separated)
      const parseStack = (raw) => new Set(
        safeStr(raw).toLowerCase().split("|").map(s => s.trim()).filter(Boolean)
      );
      const statusSet = parseStack(asset.status);
      const typeSet   = parseStack(asset.type);

      // "ignore" moves to status — skip silently
      if (statusSet.has("ignore")) continue;

      // Legacy: if old code put ignore/shiny/disco/animated/grail in status col, treat as type
      for (const t of ["shiny","disco","animated","grail"]) {
        if (statusSet.has(t)) { typeSet.add(t); statusSet.delete(t); }
      }
      // Legacy: cooked may have been in type — move to status
      if (typeSet.has("cooked")) { statusSet.add("cooked"); typeSet.delete("cooked"); }

      const card = document.createElement("div");
      card.className = "asset-card";
      // Stamp display:none immediately — before the card is in the DOM.
      // This means NO card ever takes layout space until renderPage explicitly
      // shows it, eliminating the page-leak where off-page cards briefly fill
      // page 1 on first load or after an assets reload.
      card.style.display = "none";
      Object.assign(card.dataset, {
        title:       title.toLowerCase(),
        author:      author.toLowerCase(),
        page:        String(pageNum),
        filtered:    "true",
        category:    safeStr(asset.category).toLowerCase().trim(),
        subcategory: safeStr(asset["sub-category"]).toLowerCase().trim(),
      });

      // ── Link / click interceptor ──
      const a   = document.createElement("a");
      a.href    = link;
      a.className = "asset-link";
      a.title   = `Click to open "${title || "this asset"}" in a new tab!`;

      a.addEventListener("click", async (e) => {
        e.preventDefault();

        const incognitoMode = localStorage.getItem("incognitoMode") || "off";
        const matched       = window.assetsData?.find(row => safeStr(row.link).trim() === link);
        const resolvedLink  = matched ? safeStr(matched.link).trim()  : link;
        const renderTitle   = matched ? safeStr(matched.title).trim() || "Embed" : "Embed";
        const renderFav     = matched ? safeStr(matched.image).trim() || "" : "";

        // jsDelivr CDN .html or .txt/.html.txt — fetch and open as blob.
        if (
          /^https:\/\/cdn\.jsdelivr\.net\/.+\.html$/i.test(resolvedLink) ||
          /\.html\.txt$|\.txt$/.test(resolvedLink)
        ) {
          try { await fetchAndOpenHTML(resolvedLink); }
          catch (err) { console.error("[html/txt loader] fetch failed:", err); }
          return;
        }

        // Incognito / normal routing.
        if (incognitoMode === "blob" && matched) {
          window.open(
            URL.createObjectURL(
              new Blob([buildEmbedShell(resolvedLink, renderTitle, renderFav)], { type: "text/html;charset=utf-8" })
            ), "_blank"
          );
        } else if (incognitoMode === "about" && matched) {
          const tab = window.open("about:blank", "_blank");
          if (tab) { tab.document.open("text/html", "replace"); tab.document.write(buildEmbedShell(resolvedLink, renderTitle, renderFav)); tab.document.close(); }
        } else {
          window.open(resolvedLink, "_blank");
        }
      });

      // ── Image wrapper ──
      const wrapper = document.createElement("div");
      wrapper.className = "asset-img-wrapper";
      Object.assign(wrapper.style, { position: "relative", display: "inline-block", borderRadius: "14px" });

      const img = document.createElement("img");
      img.alt           = title;
      img.className     = "asset-img";
      img.fetchPriority = isActivePage ? "high" : "auto";

      const imgPromise = new Promise((resolve) => {
        const onLoad  = () => resolve();
        const onError = () => { img.src = config.fallbackImage; img.onload = onLoad; img.onerror = resolve; };
        img.onload  = onLoad;
        img.onerror = onError;
        img.src = imageSrc;
      });
      imagePromises.push({ promise: imgPromise, page: pageNum, card });
      wrapper.appendChild(img);

      // ── Type overlays (badge images) ──
      if (typeSet.has("featured")) addOverlay(wrapper, badgeMap.featured, "featured badge", "overlay-featured");
      if (typeSet.has("new"))      addOverlay(wrapper, badgeMap.new,      "new badge",      "overlay-new");
      if (typeSet.has("fixed"))    addOverlay(wrapper, badgeMap.fixed,    "fixed badge",    "overlay-fixed");

      // ── Grail — spinning background layer behind the card image ──
      if (typeSet.has("grail")) {
        const grailEl = document.createElement("img");
        grailEl.src = "data:image/png;base64,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";
        grailEl.alt = "";
        grailEl.className = "grail-bg";
        wrapper.insertBefore(grailEl, wrapper.firstChild);
        wrapper.classList.add("has-grail");
      }

      // ── Type visual effects (stackable) ──
      if (typeSet.has("disco"))     img.classList.add("img-disco");
      if (typeSet.has("shiny"))     wrapper.classList.add("img-shiny");
      if (typeSet.has("pixelated")) img.style.imageRendering = "pixelated";

      // ── Status-driven card classes (stackable) ──
      if (statusSet.has("fix"))  { addOverlay(wrapper, badgeMap.fix, "fixing overlay", "overlay-fix", true); card.classList.add("fix"); }
      if (statusSet.has("soon"))   card.classList.add("soon");
      if (statusSet.has("cooked")) {
        const isDmca    = typeSet.has("dmca") || statusSet.has("dmca");
        const isBlocked = typeSet.has("blocked") || statusSet.has("blocked");
        if (isDmca || isBlocked) {
          img.src = "assets/images/cooked.png";
          img.style.imageRendering = "pixelated";
        }
        card.classList.add("cooked");
      }

      // ── Animated swap (type: animated) ──
      const animatedSrc = safeStr(asset.animated || "").trim();
      if (typeSet.has("animated") && animatedSrc) {
        const isVideo = /\.(mp4|webm|ogg)([?]|$)/i.test(animatedSrc);
        let animEl = null, animTimeout = null, isAnimating = false;

        const scheduleNext = () => {
          animTimeout = setTimeout(playAnim, (3 + Math.random() * 57) * 1000);
        };
        const playAnim = () => {
          if (isAnimating) return;
          isAnimating = true;
          animEl = document.createElement(isVideo ? "video" : "img");
          animEl.src = animatedSrc;
          if (isVideo) Object.assign(animEl, { autoplay: true, muted: true, loop: false, playsInline: true });
          animEl.className = "animated-swap";
          wrapper.insertBefore(animEl, wrapper.firstChild);
          setTimeout(() => { animEl?.remove(); animEl = null; isAnimating = false; scheduleNext(); },
            (3 + Math.random() * 5) * 1000);
        };

        if (img.complete && img.naturalWidth) scheduleNext();
        else img.addEventListener("load", scheduleNext, { once: true });

        const obs = new MutationObserver(() => {
          if (!document.contains(card)) { clearTimeout(animTimeout); animEl?.remove(); obs.disconnect(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }

      // ── Text + star + download ──
      a.appendChild(wrapper);
      const titleEl  = document.createElement("h3"); titleEl.textContent  = title  || "Untitled";
      const authorEl = document.createElement("p");  authorEl.textContent = author || "";

      if (statusSet.has("cooked")) {
        const isDmca    = typeSet.has("dmca") || statusSet.has("dmca");
        const isBlocked = typeSet.has("blocked") || statusSet.has("blocked");
        if (isDmca || isBlocked) {
          a.title              = isDmca ? "DMCA Takedown — unavailable" : "Blocked — unavailable";
          authorEl.textContent = isDmca ? "DMCA TAKEDOWN" : "BLOCKED D:";
        }
      }

      const star = document.createElement("button");
      star.className   = "favorite-star";
      star.textContent = isFav(title) ? "★" : "☆";
      star.title       = "Favourite";
      star.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:16px!important;line-height:1!important;color:#000!important;display:inline-flex!important;align-items:center!important;";
      star.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.textContent = window.favorites.has(key) ? "★" : "☆";
      });

      // ── Download button ──
      const dlBtn = document.createElement("button");
      dlBtn.className = "asset-download-btn";
      dlBtn.title     = `Download "${title || "asset"}" as HTML`;
      dlBtn.innerHTML = `<i class="fa fa-download" aria-hidden="true"></i>`;
      dlBtn.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:14px!important;line-height:1!important;color:#000!important;display:inline-flex!important;align-items:center!important;";
      dlBtn.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();
        try {
          const assetTitle = title    || "Untitled";
          const assetUrl   = link     || "";
          const assetFav   = imageSrc || "";

          // Section D — fetch the card image and convert to base64 PNG data-URI
          let favIconBase64 = "";
          try {
            const imgRes  = await fetch(assetFav, { mode: "cors" });
            const imgBlob = await imgRes.blob();
            favIconBase64 = await new Promise((res) => {
              const reader  = new FileReader();
              reader.onload = () => res(reader.result);
              reader.readAsDataURL(imgBlob);
            });
          } catch (_) { /* image optional — keep empty */ }

          // Build the self-contained HTML:
          //   Section A  →  ${title}    in <title>
          //   Section D  →  ${favIcon}  as base64 <link rel="icon">
          //   Section C  →  ${url}      as <embed src>
          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${assetTitle}</title>
  <link rel="icon" type="image/png" href="${favIconBase64}" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    embed {
      position: absolute;
      top: 0; left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      display: block;
    }
  </style>
</head>
<body>
  <embed id="frame" src="${assetUrl}" />
</body>
</html>`;

          const safeFilename = assetTitle.replace(/[^a-z0-9_\-\. ]/gi, "_").trim() || "asset";
          const blob   = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href     = blobUrl;
          anchor.download = `${safeFilename}.html`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (err) {
          console.error("[asset-download] failed:", err);
        }
      });

      // ── Card actions row (favourite ★ then download ⬇) ──
      const actionsRow = document.createElement("div");
      actionsRow.className = "card-actions";
      actionsRow.style.cssText = "display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:2px!important;width:100%!important;";
      actionsRow.appendChild(star);
      actionsRow.appendChild(dlBtn);

      card.append(a, titleEl, authorEl, actionsRow);
      frag.appendChild(card);

      if (!window._cardIndex.has(pageNum)) window._cardIndex.set(pageNum, []);
      window._cardIndex.get(pageNum).push(card);
      window._allCards.push(card);
    }

    container.appendChild(frag);

    // Per-page load state registry: tracks whether each page has fully settled.
    // Persists across renderPage calls so revisiting a loaded page is instant.
    if (!window._pageLoadState) window._pageLoadState = new Map();

    // Group image promises by page and stagger card reveal.
    const pagePromiseMap = new Map();
    for (const { promise, page, card } of imagePromises) {
      if (!pagePromiseMap.has(page)) pagePromiseMap.set(page, { promises: [], cards: [] });
      pagePromiseMap.get(page).promises.push(promise);
      pagePromiseMap.get(page).cards.push(card);
    }

    for (const [pageNum, { promises, cards }] of pagePromiseMap) {
      const isActive = pageNum === activePage;

      // Settle each card individually so images appear as they load.
      let settled = 0;
      const total = cards.length;
      cards.forEach((card, i) => {
        promises[i].finally(() => {
          setTimeout(() => {
            card.classList.add("ready");
            settled++;
            if (settled === total && typeof window.renderPage === "function") {
              window.renderPage();
            }
          }, isActive ? i * 30 : i * 60);
        });
      });

      // When ALL images on this page settle, mark the page as fully loaded.
      // Store the settled promise so navigation can await it on demand.
      const pageSettled = Promise.allSettled(promises).then(() => {
        window._pageLoadState.set(pageNum, "loaded");
        // If the user is currently viewing this page when it finishes, run the
        // loader sequence to dismiss the per-page loading gif.
        if (+window.currentPage === pageNum) {
          if (isActive) {
            runLoaderSequence();
          } else {
            // Navigated to this page while it was still loading — trigger dismiss now.
            _dismissPageLoader(pageNum);
          }
        }
      });

      // Mark page as "pending" while images are in-flight.
      if (!window._pageLoadState.has(pageNum)) {
        window._pageLoadState.set(pageNum, pageSettled);
      }

      // For the initial active page, also kick off the loader sequence once done.
      if (isActive) {
        pageSettled.then(() => {}); // already handled above
      }
    }

    // No images on the active page at all — dismiss loader immediately.
    if (!pagePromiseMap.has(activePage)) {
      window._pageLoadState.set(activePage, "loaded");
      runLoaderSequence();
    }

    return imagePromises;
  }

  /* ---------- Paging + Search ---------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    window._cardIndex = new Map();
    window._allCards  = [];

    const getFilteredCards = () => window._allCards.filter(c => c.dataset.filtered === "true");
    const getPages         = () => [...window._cardIndex.keys()].sort((a, b) => a - b);

    // No-results searching gif.
    let errorGif = document.getElementById("noResultsGif");
    if (!errorGif) {
      errorGif = document.createElement("img");
      errorGif.id        = "noResultsGif";
      // Use applyGifToImg so data-gifState="searching" is stamped — required for
      // applyThemeGifs() to correctly re-resolve this gif on any future theme change.
      if (typeof applyGifToImg === "function") {
        applyGifToImg(errorGif, _getTheme(), "searching");
      } else {
        errorGif.src = getThemeGifSrc(_getTheme(), "searching");
        errorGif.dataset.gifState = "searching";
      }
      errorGif.draggable = false;
      Object.assign(errorGif.style, {
        display: "none", position: "absolute",
        top: "50%", left: "50%", transform: "translate(-50%, 0)",
        transformOrigin: "50% 0%", width: "128px", height: "128px",
        opacity: "0", transition: "opacity 0.25s ease",
        pointerEvents: "auto", cursor: "grab", zIndex: "1000",
        imageRendering: "pixelated",
      });
      container.parentElement.appendChild(errorGif);
      initGifDrag(errorGif);
    }

    const updateVisibility = () => {
      const visible = getFilteredCards().length;
      if (visible === 0) {
        errorGif.style.display = "block";
        requestAnimationFrame(() => (errorGif.style.opacity = "1"));
      } else {
        errorGif.style.opacity = "0";
        setTimeout(() => { if (parseFloat(errorGif.style.opacity) === 0) errorGif.style.display = "none"; }, 250);
      }
    };

    window.renderPage = () => {
      const pages = getPages();
      if (!pages.length) return;

      if (!window._pageRestored) {
        const saved = +sessionStorage.getItem("currentPage") || pages[0];
        window.currentPage = pages.includes(saved) ? saved : pages[0];
        window._pageRestored = true;
      }

      const cur = +window.currentPage;
      const pageState = window._pageLoadState?.get(cur);
      const pageFullyLoaded = pageState === "loaded";

      for (const [pageNum, cards] of window._cardIndex) {
        const onThisPage = pageNum === cur;
        for (const c of cards) {
          const isReady   = c.classList.contains("ready");
          // On the current page: show ready+filtered cards only if the whole page
          // has finished loading. Otherwise keep them hidden (loader is showing).
          const want = onThisPage && isReady && pageFullyLoaded && c.dataset.filtered === "true" ? "flex" : "none";
          if (c.style.display !== want) c.style.display = want;
        }
      }

      if (pageIndicator) {
        const idx = pages.indexOf(cur);
        pageIndicator.textContent = `Page ${idx + 1}/${pages.length}`;
      }

      sessionStorage.setItem("currentPage", cur);
      updateVisibility();
    };

    window.filterAssets = (q) => {
      const query      = safeStr(q).toLowerCase().trim();
      const words      = query.length ? query.split(/\s+/) : null;
      const isSearching = query.length > 0;

      for (const c of window._allCards) {
        if (!words) { c.dataset.filtered = "true"; continue; }
        const haystack = c.dataset.title + " " + c.dataset.author;
        let hit = haystack.includes(query);
        if (!hit) for (const w of words) if (haystack.includes(w)) { hit = true; break; }
        c.dataset.filtered = hit ? "true" : "false";
      }

      if (isSearching) {
        for (const c of window._allCards) {
          // Non-ready cards stay hidden regardless of search match — they haven't
          // loaded yet and must not appear. Ready cards follow the filter result.
          const show = c.classList.contains("ready") && c.dataset.filtered === "true";
          c.style.display = show ? "flex" : "none";
        }
        if (pageIndicator) pageIndicator.textContent = "Searching all pages…";
        const pagesAnchor = document.querySelector(".pages-anchor");
        if (pagesAnchor) pagesAnchor.style.visibility = "hidden";
      } else {
        const pagesAnchor = document.querySelector(".pages-anchor");
        if (pagesAnchor) pagesAnchor.style.visibility = "";
        renderPage();
      }

      updateVisibility();
    };

    window.prevPage = () => {
      if (window._reloading) return;
      const pages = getPages();
      const i     = pages.indexOf(+window.currentPage);
      window.currentPage = i <= 0 ? pages[pages.length - 1] : pages[i - 1];
      _handlePageNavigation(+window.currentPage);
      renderPage();
    };

    window.nextPage = () => {
      if (window._reloading) return;
      const pages = getPages();
      const i     = pages.indexOf(+window.currentPage);
      window.currentPage = i === -1 || i === pages.length - 1 ? pages[0] : pages[i + 1];
      _handlePageNavigation(+window.currentPage);
      renderPage();
    };

    // Show the loading gif for a page that hasn't finished loading yet, and
    // dismiss it once that page's images are all settled.
    function _handlePageNavigation(pageNum) {
      const pageState = window._pageLoadState?.get(pageNum);
      if (pageState === "loaded" || pageState === undefined) {
        // Already loaded or no tracked state — nothing to do.
        return;
      }
      // Page is still loading: show the loader gif and wait for this page to settle.
      const loader = document.getElementById("containerLoader");
      if (!loader) {
        // Recreate loader if it was removed after the initial page load.
        const newLoader = document.createElement("div");
        newLoader.id = "containerLoader";
        const loaderImg = document.createElement("img");
        loaderImg.alt = "";
        applyGifToImg(loaderImg, _getTheme(), "loading");
        newLoader.appendChild(loaderImg);
        document.body.appendChild(newLoader);
        window._loaderSequenceRunning = false;
        document.body.classList.add("ws-loading");
      } else {
        // Loader exists but may have already run its sequence — reset it to loading state.
        const img = loader.querySelector("img");
        if (img) applyGifToImg(img, _getTheme(), "loading");
        window._loaderSequenceRunning = false;
        document.body.classList.add("ws-loading");
        loader.style.display = "";
      }

      // Wait for this page's promise to resolve, then dismiss.
      Promise.resolve(pageState).then(() => {
        _dismissPageLoader(pageNum);
      });
    }

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));

    window.currentPage = +sessionStorage.getItem("currentPage") || 1;
    renderPage();

    /* ---------- Sub-Header Category Filter ---------- */
    (function initSubHeaderFilter() {
      const categoryMap = {
        "Friday Night Funkin'": "FNF",
        "Fnaf":                 "FNAF",
        "Sports":               "sports",
        "Action":               "action",
        "Racing":               "racing",
        "Blumgi Studios":       "arcade",
        "rpg":                  "rpg",
        "2 player+":            "2-player",
        "Pokemon":              "turn-based-combat",
        "idle":                 "idle",
        "simulator":            "simulator",
        "puzzle":               "puzzle",
        "ruffle":               "ruffle",
        "Nintendo":             "nintendo",
        "SEGA":                 "SEGA"
      };

      let activeCategory = null;
      const subBtns = document.querySelectorAll(".sub-header button");
      if (!subBtns.length) return;

      function applySubHeaderFilter() {
        const pagesAnchor = document.querySelector(".pages-anchor");

        for (const c of window._allCards || []) {
          if (!activeCategory) {
            c.dataset.filtered = "true";
            continue;
          }
          const cat = c.dataset.category    || "";
          const sub = c.dataset.subcategory || "";
          c.dataset.filtered = (cat === activeCategory || sub === activeCategory)
            ? "true"
            : "false";
        }

        if (!activeCategory) {
          // No category active — restore normal per-page view.
          if (pagesAnchor) pagesAnchor.style.visibility = "";
          if (pageIndicator) {
            const pages = getPages();
            const idx   = pages.indexOf(+window.currentPage);
            pageIndicator.textContent = idx >= 0 ? `Page ${idx + 1}/${pages.length}` : `Page 1/${pages.length}`;
          }
          if (typeof renderPage === "function") renderPage();
        } else {
          // Category active — show all matching cards across every page.
          if (pagesAnchor) pagesAnchor.style.visibility = "hidden";
          if (pageIndicator) pageIndicator.textContent = "Browsing all pages…";
          for (const c of window._allCards || []) {
            const show = c.classList.contains("ready") && c.dataset.filtered === "true";
            c.style.display = show ? "flex" : "none";
          }
          if (typeof updateVisibility === "function") updateVisibility();
        }
      }

      subBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const cat = categoryMap[btn.textContent.trim()];
          if (!cat) return;

          if (activeCategory === cat) {
            activeCategory = null;
            btn.classList.remove("active");
          } else {
            activeCategory = cat;
            subBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
          }
          applySubHeaderFilter();
        });
      });
    })();
  }

  /* ---------- Placeholder Cycle ---------- */
  function initPlaceholders() {
    const { searchInput } = dom || {};
    if (!searchInput) return;

    const FADE = 400, HOLD = 4000;

    const fadePlaceholder = (input, text, cb) => {
      input.classList.add("fade-out");
      setTimeout(() => {
        input.placeholder = text;
        input.classList.replace("fade-out", "fade-in");
        setTimeout(() => { input.classList.remove("fade-in"); cb?.(); }, FADE);
      }, FADE);
    };

    window.startPlaceholderCycle = () => {
      if (window._placeholderRunning) return;
      window._placeholderRunning = true;
      const loop = async () => {
        const curPageCards = window._cardIndex?.get(+window.currentPage) || [];
        const visible = curPageCards.filter(c => c.dataset.filtered === "true").length;
        await new Promise(r => fadePlaceholder(searchInput, `${visible} assets on this page`, r));
        await delay(HOLD);
        await new Promise(r => fadePlaceholder(searchInput, "Search assets...", r));
        await delay(HOLD);
        if (window._placeholderRunning) loop();
      };
      loop();
    };
  }

  /* ---------- Version UI ---------- */
  let _resolveVersionReady;
  window._versionReady = new Promise(res => { _resolveVersionReady = res; });

  function applyVersionUI(raw) {
    const footerAnchor = document.getElementById("footerVersion");
    try {
      const lastRow = raw.filter(d => d.version?.toString().trim()).slice(-1)[0];
      const version = lastRow?.version?.toString().trim() || "V0.8";
      const message = lastRow?.message?.toString().trim() || "";
      if (footerAnchor) footerAnchor.textContent = `Version ${version}`;
      const p = dom.updatePopup;
      if (p) {
        const titleEl = p.querySelector("h2");
        const msgEl   = p.querySelector("p");
        if (titleEl) titleEl.textContent = `🎉 Version ${version} Update!`;
        if (msgEl && message) msgEl.textContent = message;
        const dismissed = localStorage.getItem("dismissedUpdateVersion");
        const closed    = sessionStorage.getItem("updatePopupClosed");
        if (!closed && dismissed !== version) setTimeout(() => p.classList.add("show"), 600);
      }
    } catch {
      if (footerAnchor) footerAnchor.textContent = "Version V0.8";
    }
  }

  /* ---------- Asset Loader ---------- */
  const ASSETS_CACHE_KEY = "__ws_assetsCache__";

  function _isCacheValid(data) {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.some(row =>
      row && typeof row === "object" &&
      (safeStr(row.title).trim() || safeStr(row.link).trim() || safeStr(row.image).trim())
    );
  }

  async function loadAssets() {
    const fetchUrl = window._activeFetchUrl || config.sheetUrl;
    let raw;

    const cached = (() => {
      try { return JSON.parse(sessionStorage.getItem(ASSETS_CACHE_KEY) || "null"); }
      catch { return null; }
    })();

    if (cached !== null && _isCacheValid(cached)) {
      raw = cached;
    } else {
      if (cached !== null) {
        console.warn("[loadAssets] Cache invalid — evicting and re-fetching.", cached);
        sessionStorage.removeItem(ASSETS_CACHE_KEY);
      }
      try {
        const res = await fetch(fetchUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
        if (!_isCacheValid(raw)) {
          console.error("[loadAssets] Network response also invalid:", raw);
          _resolveVersionReady();
          runCrashSequence();
          throw new Error("Invalid data from network");
        }
        try { sessionStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(raw)); } catch { /* quota */ }
      } catch (err) {
        console.error("[loadAssets] fetch failed:", err);
        _resolveVersionReady();
        runCrashSequence();
        throw err;
      }
    }

    applyVersionUI(raw);
    _resolveVersionReady();

    const data = raw.filter(i => Object.values(i).some(v => safeStr(v).trim()));
    window.assetsData = data;

    const savedPage = +sessionStorage.getItem("currentPage") || 1;
    window.currentPage   = savedPage;
    window._pageRestored = true;

    const earlyIndicator = window.dom?.pageIndicator;
    if (earlyIndicator) earlyIndicator.textContent = `Page ${savedPage}`;

    const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
    const filtered  = isFavPage
      ? data.filter(a => window.favorites.has(safeStr(a.title).toLowerCase()))
      : data;

    getLoadedGifDuration().catch(() => {});
    const promises = createAssetCards(filtered || []);

    const activePromises = promises.filter(p => p.page === savedPage).map(p => p.promise);
    const settle         = activePromises.length ? Promise.all(activePromises) : Promise.resolve();
    settle.finally(() => {
      if (typeof window._restoreScrollY === "function") window._restoreScrollY();
    });

    return true;
  }

  /* ---------- Reload (R key + dev console) ---------- */
  window._reloading           = false;
  window._reloadCooldownUntil = 0;
  const RELOAD_COOLDOWN_MS    = 15000;

  window.reloadAssets = async function () {
    if (window._reloading) return;
    window._reloading          = true;
    window._pageRestored       = false;
    window._placeholderRunning = false;

    sessionStorage.removeItem(ASSETS_CACHE_KEY);
    sessionStorage.removeItem("scrollY");

    window._cardIndex = new Map();
    window._allCards  = [];
    window._pageLoadState = new Map();

    document.body.classList.add("ws-loading");

    // Recreate the loader element fresh.
    document.getElementById("containerLoader")?.remove();
    const loader = document.createElement("div");
    loader.id = "containerLoader";
    // Build the img via applyGifToImg so data-gifState="loading" is stamped immediately.
    // This ensures applyThemeGifs() can correctly re-resolve the gif on any theme change
    // that happens while the loader is still on screen.
    const loaderImg = document.createElement("img");
    loaderImg.alt = "";
    applyGifToImg(loaderImg, _getTheme(), "loading");
    loader.appendChild(loaderImg);
    document.body.appendChild(loader);
    window._loaderSequenceRunning = false;

    window._versionReady = Promise.resolve();
    _resolveVersionReady = () => {};

    try {
      await loadAssets();
      window._reloadCooldownUntil = Date.now() + RELOAD_COOLDOWN_MS;
      if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
      return true;
    } catch {
      throw new Error("reload failed");
    } finally {
      window._reloading = false;
    }
  };

  /* ---------- Bootstrap ---------- */
  /* ---------- Mute Button ---------- */
  // Image toggling is handled inline in index.html (onclick + id="muteToggleImg").
  // This function only owns: applying the saved mute state to audio elements on load
  // and re-applying it to any audio injected later via MutationObserver.
  function initMuteButton() {
    const MUTE_KEY = "ws_muted";

    window._quotesMuted = localStorage.getItem(MUTE_KEY) === "true";

    function _applyAudioMute(muted) {
      document.querySelectorAll("audio, video").forEach(a => { a.muted = muted; });
    }

    // Apply persisted mute state immediately on load.
    _applyAudioMute(window._quotesMuted);

    // Re-apply to any audio/video injected into the DOM later.
    const _audioObserver = new MutationObserver(() => {
      _applyAudioMute(window._quotesMuted);
    });
    _audioObserver.observe(document.body, { childList: true, subtree: true });

    // Public setter so the inline HTML onclick can update the mute state.
    window.WS_Audio = {
      setMuted: function (value) {
        window._quotesMuted = !!value;
        _applyAudioMute(window._quotesMuted);
      },
      isMuted: function () {
        return window._quotesMuted;
      }
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    initFavorites();
    initPaging();
    initPlaceholders();
    initMuteButton();

    window.applyThemeGifs?.(_getTheme());

    await loadAssets().catch(() => {});

    if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
    console.log("Ready :)");
  });
})();