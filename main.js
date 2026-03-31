/* ============================================================
   app.js — Main app: card loader, paging, search, favorites,
            loader sequences, scroll persistence, page physics,
            draggable gif, Discord widget
   Load ORDER: 8th (depends on: utils.js, theme.js, sanitizer.js)
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

  const getIdleSrc = () => {
    const theme = document.documentElement.getAttribute("theme") || "root";
    return typeof getThemeGif === "function"
      ? getThemeGif(theme, "searching")
      : "searching.gif";
  };

  let dragging = false, dropping = false;
  let mouseX = 0, mouseY = 0, lastMouseX = 0, rotation = 0;

  new MutationObserver(() => {
    if (gif.style.display !== "none") gif.style.pointerEvents = "auto";
  }).observe(gif, { attributes: true, attributeFilter: ["style"] });

  gif.addEventListener("mousedown", (e) => {
    if (dropping) return;
    dragging = true;
    gif.src = "held.gif";
    gif.style.cursor = "grabbing";
    mouseX = e.clientX; mouseY = e.clientY; lastMouseX = mouseX;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false; dropping = true;
    gif.style.cursor = "grab";
    gif.src = "drop.gif";
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
      window.favorites = new Set(stored.map((s) => safeStr(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = () =>
      localStorage.setItem("favorites", JSON.stringify([...window.favorites]));

    window.refreshCards = () => {
      if (!window.assetsData || typeof createAssetCards !== "function") return [];
      const savedY = window.scrollY;
      const promises = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
      Promise.all(promises.map(p => p.promise ?? p).filter(Boolean))
        .finally(() => window.scrollTo({ top: savedY, behavior: "instant" }));
      return promises;
    };
  }

  /* ---------- GIF Duration Parser ---------- */
  let _loadedGifDurationCache = null;
  const LOADED_GIF_URL = ROOT_GIFS.loaded;

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
    if (_loadedGifDurationCache !== null) return Promise.resolve(_loadedGifDurationCache);
    return fetch(LOADED_GIF_URL)
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.arrayBuffer(); })
      .then(buf => { _loadedGifDurationCache = parseGifDuration(buf); return _loadedGifDurationCache; });
  }

  /* ---------- Loader Sequences ---------- */
  window._loaderSequenceRunning = false;

  function runLoaderSequence() {
    if (window._loaderSequenceRunning) return;
    const loader = document.getElementById("containerLoader");
    if (!loader) return;
    window._loaderSequenceRunning = true;

    const img = loader.querySelector("img");
    if (!img) { loader.remove(); return; }

    const theme     = document.documentElement.getAttribute("theme") || "root";
    const loadedSrc = getThemeGif(theme, "loaded");

    const finish = () => {
      loader.remove();
      document.body.classList.remove("ws-loading");
    };

    getLoadedGifDuration()
      .then(ms => { img.src = loadedSrc; setTimeout(finish, ms); })
      .catch(()  => { img.src = loadedSrc; setTimeout(finish, 2000); });
  }

  function runCrashSequence() {
    if (window._loaderSequenceRunning) return;
    const loader = document.getElementById("containerLoader");
    if (!loader) return;
    window._loaderSequenceRunning = true;

    const img = loader.querySelector("img");
    if (!img) return;

    const theme    = document.documentElement.getAttribute("theme") || "root";
    const crashSrc = getThemeGif(theme, "crash");
    const dedSrc   = getThemeGif(theme, "ded");

    document.body.classList.remove("ws-loading");

    fetch(crashSrc)
      .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
      .then(buf => parseGifDuration(buf))
      .catch(() => 2000)
      .then(ms  => { img.src = crashSrc; setTimeout(() => { img.src = dedSrc; }, ms); });
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

  /* ---------- Asset Card Builder ---------- */

  // Inject a one-time CSS guard for data-ignore="true" cards.
  (function injectIgnoreGuardCSS() {
    if (document.getElementById("__ws_ignore_guard__")) return;
    const s = document.createElement("style");
    s.id = "__ws_ignore_guard__";
    s.textContent = `.asset-card[data-ignore="true"]{display:none!important;opacity:0!important;width:0!important;height:0!important;margin:0!important;padding:0!important;pointer-events:none!important;overflow:hidden!important;}`;
    document.head.appendChild(s);
  })();

  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return [];

    container.innerHTML = "";
    const imagePromises = [];
    const frag          = document.createDocumentFragment();
    const sortMode      = getSortMode();
    const isFav = (t) => window.favorites.has(safeStr(t).toLowerCase());

    const activePage = +window.currentPage || +sessionStorage.getItem("currentPage") || 1;

    let sorted = Array.isArray(data) ? data.slice() : [];
    if (sortMode === "alphabetical") {
      sorted.sort((a, b) => fastCompare(safeStr(a.title), safeStr(b.title)));
    }

    const pageBuckets = new Map();
    for (const asset of sorted) {
      const p      = Number(asset.page) || 1;
      const status = safeStr(asset.status).toLowerCase();
      if (status === "hide" || status === "hidden") continue;
      if (!pageBuckets.has(p)) pageBuckets.set(p, []);
      pageBuckets.get(p).push(asset);
    }

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
      const title       = safeStr(asset.title).trim();
      const author      = safeStr(asset.author).trim();
      const imageSrc    = safeStr(asset.image) || config.fallbackImage;
      const link        = safeStr(asset.link)  || config.fallbackLink;
      const pageNum     = Number(asset.page)   || 1;
      const status      = safeStr(asset.status).toLowerCase().trim();
      const statusField = safeStr(asset.type || asset.status || "").toLowerCase().trim();
      const typeField   = safeStr(asset.type).toLowerCase().trim();
      const isActivePage = pageNum === activePage;

      if (status === "hide" || status === "hidden") continue;
      if (typeField === "ignore") continue;

      const card = document.createElement("div");
      card.className = "asset-card";
      if (typeField === "ignore") card.dataset.ignore = "true";
      Object.assign(card.dataset, {
        title:    title.toLowerCase(),
        author:   author.toLowerCase(),
        page:     String(pageNum),
        filtered: "true",
      });

      // ── Link / click interceptor ──
      const a = document.createElement("a");
      a.href      = link;
      a.className = "asset-link";
      a.title     = `Click to open "${title || "this asset"}" in a new tab!`;

      a.addEventListener("click", async (e) => {
        e.preventDefault();

        const incognitoMode = localStorage.getItem("incognitoMode") || "off";
        const matched       = window.assetsData?.find(
          (row) => safeStr(row.link).trim() === link
        );
        const resolvedLink = matched ? safeStr(matched.link).trim()  : link;
        const renderTitle  = matched ? safeStr(matched.title).trim() || "Embed" : "Embed";
        const renderFav    = matched ? safeStr(matched.image).trim() || "" : "";

        // jsDelivr CDN .html — fetch and blob-inject
        if (/^https:\/\/cdn\.jsdelivr\.net\/.+\.html$/i.test(resolvedLink)) {
          try {
            const res = await fetch(resolvedLink);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const rawHTML = await res.text();
            const stage = Object.assign(document.createElement("textarea"), {
              style: { cssText: "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;" },
              readOnly: true,
              value: rawHTML,
            });
            document.body.appendChild(stage);
            const staged = stage.value;
            document.body.removeChild(stage);
            const pageURL = URL.createObjectURL(
              new Blob([sanitizeHTML(staged)], { type: "text/html;charset=utf-8" })
            );
            window.open(pageURL, "_blank");
          } catch (err) {
            console.error("[cdn.jsdelivr .html loader] fetch failed:", err);
          }
          return;
        }

        // .txt / .html.txt — fetch and blob-inject
        if (/\.html\.txt$|\.txt$/.test(resolvedLink)) {
          try {
            const res = await fetch(resolvedLink);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const rawHTML = await res.text();
            const stage = Object.assign(document.createElement("textarea"), {
              style: { cssText: "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;" },
              readOnly: true,
              value: rawHTML,
            });
            document.body.appendChild(stage);
            const staged = stage.value;
            document.body.removeChild(stage);
            const pageURL = URL.createObjectURL(
              new Blob([sanitizeHTML(staged)], { type: "text/html;charset=utf-8" })
            );
            window.open(pageURL, "_blank");
          } catch (err) {
            console.error("[txt loader] fetch failed:", err);
          }
          return;
        }

        // Incognito / normal routing
        if (incognitoMode === "blob" && matched) {
          window.open(
            URL.createObjectURL(
              new Blob([buildEmbedShell(resolvedLink, renderTitle, renderFav)],
                { type: "text/html;charset=utf-8" })
            ), "_blank"
          );
        } else if (incognitoMode === "about" && matched) {
          const tab = window.open("about:blank", "_blank");
          if (tab) { tab.document.write(buildEmbedShell(resolvedLink, renderTitle, renderFav)); tab.document.close(); }
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
        if (isActivePage) {
          img.onload  = () => resolve();
          img.onerror = () => { img.src = config.fallbackImage; img.onload = () => resolve(); img.onerror = () => resolve(); };
        } else {
          const offReady = () => resolve();
          img.onload  = offReady;
          img.onerror = () => { img.src = config.fallbackImage; img.onload = offReady; img.onerror = offReady; };
        }
        img.src = imageSrc;
      });
      imagePromises.push({ promise: imgPromise, page: pageNum, card });
      wrapper.appendChild(img);

      // ── Status overlays ──
      if (statusField === "featured") addOverlay(wrapper, badgeMap.featured, "featured badge", "overlay-featured");
      if (statusField === "new")      addOverlay(wrapper, badgeMap.new,      "new badge",      "overlay-new");
      if (statusField === "fixed")    addOverlay(wrapper, badgeMap.fixed,    "fixed badge",    "overlay-fixed");
      if (["new", "updated"].includes(status))
        addOverlay(wrapper, `${config.gifBase}${status}.gif`, `${status} badge`, `status-gif status-${status}`);
      if (status === "fix") { addOverlay(wrapper, badgeMap.fix, "fixing overlay", "overlay-fix", true); card.classList.add("fix"); }
      if (status === "soon") card.classList.add("soon");
      if (status === "cooked" && (statusField === "dmca" || statusField === "blocked")) {
        img.src = "cooked.png";
        img.style.imageRendering = "pixelated";
        card.classList.add("cooked");
      }
      if (status === "disco")  img.classList.add("img-disco");
      if (status === "shiny")  wrapper.classList.add("img-shiny");

      // ── Animated swap ──
      const animatedSrc = safeStr(asset.animated || "").trim();
      if (status === "animated" && animatedSrc) {
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

      // ── Text + star ──
      a.appendChild(wrapper);
      const titleEl  = document.createElement("h3"); titleEl.textContent  = title  || "Untitled";
      const authorEl = document.createElement("p");  authorEl.textContent = author || "";

      if (status === "cooked" && (statusField === "dmca" || statusField === "blocked")) {
        a.title              = statusField === "dmca" ? "DMCA Takedown — unavailable" : "Blocked — unavailable";
        authorEl.textContent = statusField === "dmca" ? "DMCA TAKEDOWN" : "BLOCKED D:";
      }

      const star = document.createElement("button");
      star.className   = "favorite-star";
      star.textContent = isFav(title) ? "★" : "☆";
      Object.assign(star.style, { background: "transparent", border: "none", cursor: "pointer" });
      star.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.textContent = window.favorites.has(key) ? "★" : "☆";
      });

      card.append(a, titleEl, authorEl, star);
      frag.appendChild(card);

      if (!window._cardIndex.has(pageNum)) window._cardIndex.set(pageNum, []);
      window._cardIndex.get(pageNum).push(card);
      window._allCards.push(card);
    }

    container.appendChild(frag);

    const pagePromiseMap = new Map();
    for (const { promise, page, card } of imagePromises) {
      if (!pagePromiseMap.has(page)) pagePromiseMap.set(page, { promises: [], cards: [] });
      pagePromiseMap.get(page).promises.push(promise);
      pagePromiseMap.get(page).cards.push(card);
    }

    let activePageHandled = false;

    for (const [pageNum, { promises, cards }] of pagePromiseMap) {
      const isActive = pageNum === activePage;
      Promise.all(promises).then(() => {
        const last = cards.length - 1;
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.add("ready");
            if (i === last && typeof window.renderPage === "function") {
              window.renderPage();
            }
          }, i * 40);
        });
        if (isActive && !activePageHandled) {
          activePageHandled = true;
          runLoaderSequence();
        }
      });
    }

    if (!pagePromiseMap.has(activePage)) {
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
    const quoteWrapper     = document.getElementById("quoteWrapper");

    // No-results searching gif
    let errorGif = document.getElementById("noResultsGif");
    if (!errorGif) {
      errorGif = document.createElement("img");
      errorGif.id        = "noResultsGif";
      errorGif.src       = getThemeGif(document.documentElement.getAttribute("theme") || "root", "searching");
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
      for (const [pageNum, cards] of window._cardIndex) {
        const onThisPage = pageNum === cur;
        for (const c of cards) {
          if (!c.classList.contains("ready")) continue;
          const want = onThisPage && c.dataset.filtered === "true" ? "flex" : "none";
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
          if (!c.classList.contains("ready")) continue;
          c.style.display = c.dataset.filtered === "true" ? "flex" : "none";
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
      renderPage();
    };

    window.nextPage = () => {
      if (window._reloading) return;
      const pages = getPages();
      const i     = pages.indexOf(+window.currentPage);
      window.currentPage = i === -1 || i === pages.length - 1 ? pages[0] : pages[i + 1];
      renderPage();
    };

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));

    window.currentPage = +sessionStorage.getItem("currentPage") || 1;
    renderPage();
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
        console.warn("[loadAssets] Cached data failed validation — evicting and re-fetching.", cached);
        sessionStorage.removeItem(ASSETS_CACHE_KEY);
      }
      try {
        const res = await fetch(fetchUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
        if (!_isCacheValid(raw)) {
          console.error("[loadAssets] Network response also failed validation:", raw);
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

    const activePage     = savedPage;
    const activePromises = promises.filter(p => p.page === activePage).map(p => p.promise);
    const settle         = activePromises.length ? Promise.all(activePromises) : Promise.resolve();
    settle.finally(() => {
      if (typeof window._restoreScrollY === "function") window._restoreScrollY();
    });

    return true;
  }

  /* ---------- Reload (R key) ---------- */
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

    document.body.classList.add("ws-loading");

    const existingLoader = document.getElementById("containerLoader");
    if (existingLoader) existingLoader.remove();

    const loader = document.createElement("div");
    loader.id = "containerLoader";
    const reloadTheme = document.documentElement.getAttribute("theme") || "root";
    loader.innerHTML = `<img src="${getThemeGif(reloadTheme, "loading")}" alt="" />`;
    document.body.appendChild(loader);
    window._loaderSequenceRunning = false;

    window._versionReady  = Promise.resolve();
    _resolveVersionReady  = () => {};

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
  document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    initFavorites();
    initPaging();
    initPlaceholders();

    if (typeof window.applyThemeGifs === "function") {
      window.applyThemeGifs(document.documentElement.getAttribute("theme") || "root");
    }

    await loadAssets().catch(() => {});

    if (typeof window.startPlaceholderCycle === "function") window.startPlaceholderCycle();
    console.log("Ready :)");
  });
})();
