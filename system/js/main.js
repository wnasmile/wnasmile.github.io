"use strict";

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

function initGifDrag(gif) {
  const SWAY_STRENGTH = 0.6;
  const RETURN_SPEED  = 0.08;
  const DROP_DURATION = 1600;

  const _getDragTheme = () =>
    document.documentElement.getAttribute("theme") || DEFAULT_THEME;

  

  

  let dragging = false, dropping = false;
  let mouseX = 0, mouseY = 0, lastMouseX = 0, rotation = 0;

  new MutationObserver(() => {
    if (gif.style.display !== "none") gif.style.pointerEvents = "auto";
  }).observe(gif, { attributes: true, attributeFilter: ["style"] });

  const _applyDragGif = (key) => {
    const theme = _getDragTheme();
    if (typeof applyGifToImg === "function") {
      applyGifToImg(gif, theme, key);
    } else {
      gif.src = getThemeGifSrc(theme, key) || getThemeGifSrc(theme, "searching");
    }
  };

  gif.addEventListener("mousedown", (e) => {
    if (dropping) return;
    dragging = true;
    _applyDragGif("held");
    gif.style.cursor = "grabbing";
    mouseX = e.clientX; mouseY = e.clientY; lastMouseX = mouseX;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false; dropping = true;
    gif.style.cursor = "grab";
    _applyDragGif("drop");
    gif.style.top = (parseFloat(gif.style.top) || 0) + 6 + "px";
    setTimeout(() => { _applyDragGif("searching"); dropping = false; }, DROP_DURATION);
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

window.addEventListener("load", () => {
  if (typeof Crate !== "undefined") {
    new Crate({ server: "1451796462517096642", channel: "1451796463368667218" });
  }
});

(() => {
  
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
        name:    "legacy",
        dynamic: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/stickers/",
        static:  "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/stickers/",
      },
      {
        name:    "wnasmile",
        dynamic: "https://cdn.jsdelivr.net/gh/wnasmile/stickpack@main/dynamic/",
        static:  "https://cdn.jsdelivr.net/gh/wnasmile/stickpack@main/static/",
      },
    ];

    if (!window._activeFetchUrl) window._activeFetchUrl = window.config.sheetUrl;
  }

  
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

  

  

  

  const _gifDurationCache = new Map();

  

  

  

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

    

    const crashSrc = getThemeGifSrc(_getTheme(), "crash");
    getGifDuration(crashSrc)
      .catch(() => 2000)
      .then(ms => {
        applyGifToImg(img, _getTheme(), "crash");
        setTimeout(() => { applyGifToImg(img, _getTheme(), "ded"); }, ms);
      });
  }

  
  

  

  function _dismissPageLoader(pageNum) {
    if (+window.currentPage !== pageNum) return; 

    runLoaderSequence();
  }

  
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

  
  async function fetchAndOpenHTML(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const raw     = await res.text();
    const pageURL = URL.createObjectURL(
      new Blob([sanitizeHTML(raw)], { type: "text/html;charset=utf-8" })
    );
    window.open(pageURL, "_blank");
  }

  

  (function injectIgnoreGuardCSS() {
    if (document.getElementById("__ws_ignore_guard__")) return;
    const s = document.createElement("style");
    s.id = "__ws_ignore_guard__";
    

    

    

    

    

    s.textContent = [
      

      

      

      

      `.asset-card[data-ignore="true"]{display:none!important;opacity:0!important;width:0!important;height:0!important;margin:0!important;padding:0!important;pointer-events:none!important;overflow:hidden!important;}`,
    ].join("");
    document.head.appendChild(s);
  })();

  
  (function injectAssetActionStyles() {
    if (document.getElementById("__ws_asset_actions__")) return;

    

    if (!document.querySelector("link[href*='font-awesome']")) {
      const fa = document.createElement("link");
      fa.rel  = "stylesheet";
      fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
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
      .asset-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 3px;
        font-size: 14px;
        line-height: 1;
        color: #111 !important;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
      }
      .asset-action-btn i { pointer-events: none; }

      .description-panel {
        position: fixed;
        left: -340px;
        top: 85%;
        transform: translateY(-50%);
        width: 300px;
        transition: left .35s ease;
        z-index: 999999;
        pointer-events: none;
        background: rgba(0,0,0,0.3);
        border-left: 6px solid red;
        border-radius: 10px;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        box-shadow: none;
        padding: 12px 16px;
      }
      .description-panel.desc-visible {
        left: 20px;
        pointer-events: all;
      }
      .description-panel .alert-text {
        color: white;
        font-family: monospace;
        text-align: left;
        white-space: normal;
        word-wrap: break-word;
        line-height: 1.5;
        font-size: 13px;
      }
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

    

    const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
    const FAV_PAGE_SIZE = 75;
    const pageBuckets = new Map();
    let favPageCounter = 0;
    for (const asset of sorted) {
      const statusRaw = safeStr(asset.status).toLowerCase();
      const typeRaw   = safeStr(asset.type).toLowerCase();
      

      if (statusRaw === "hide" || statusRaw === "hidden") continue;
      if (statusRaw.split("|").map(s => s.trim()).includes("ignore")) continue;
      if (typeRaw.split("|").map(s => s.trim()).includes("ignore")) continue;

      let p;
      if (isFavPage) {
        

        p = Math.floor(favPageCounter / FAV_PAGE_SIZE) + 1;
        favPageCounter++;
      } else {
        p = Number(asset.page) || 1;
      }
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
      const title      = safeStr(asset.title).trim();
      const author     = safeStr(asset.author).trim();
      const imageSrc   = safeStr(asset.image) || config.fallbackImage;
      const link       = safeStr(asset.link)  || config.fallbackLink;
      const pageNum    = Number(asset.page)   || 1;
      const isActivePage = pageNum === activePage;

      

      

      

      const parseStack = (raw) => new Set(
        safeStr(raw).toLowerCase().split("|").map(s => s.trim()).filter(Boolean)
      );
      const statusSet = parseStack(asset.status);
      const typeSet   = parseStack(asset.type);

      

      if (statusSet.has("ignore")) continue;

      

      for (const t of ["shiny","disco","animated","grail"]) {
        if (statusSet.has(t)) { typeSet.add(t); statusSet.delete(t); }
      }
      

      if (typeSet.has("cooked")) { statusSet.add("cooked"); typeSet.delete("cooked"); }

      const card = document.createElement("div");
      card.className = "asset-card" + (isFav(title) ? " ws-favorited" : "");
      

      

      

      

      card.style.display = "none";
      Object.assign(card.dataset, {
        title:       title.toLowerCase(),
        author:      author.toLowerCase(),
        page:        String(pageNum),
        filtered:    "true",
        category:    safeStr(asset.category).toLowerCase().trim(),
        subcategory: safeStr(asset["sub-category"]).toLowerCase().trim(),
      });

      

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

        

        if (
          /^https:\/\/cdn\.jsdelivr\.net\/.+\.html$/i.test(resolvedLink) ||
          /\.html\.txt$|\.txt$/.test(resolvedLink)
        ) {
          try { await fetchAndOpenHTML(resolvedLink); }
          catch (err) { console.error("[html/txt loader] fetch failed:", err); }
          return;
        }

        

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

      

      if (typeSet.has("featured")) addOverlay(wrapper, badgeMap.featured, "featured badge", "overlay-featured");
      if (typeSet.has("new"))      addOverlay(wrapper, badgeMap.new,      "new badge",      "overlay-new");
      if (typeSet.has("fixed"))    addOverlay(wrapper, badgeMap.fixed,    "fixed badge",    "overlay-fixed");

      

      if (typeSet.has("grail")) {
        const grailEl = document.createElement("img");
        grailEl.src = "https://raw.githubusercontent.com/wnasmile/wnasmile.github.io/main/assets/images/grail.png";
        grailEl.alt = "";
        grailEl.className = "grail-bg";
        wrapper.insertBefore(grailEl, wrapper.firstChild);
        wrapper.classList.add("has-grail");
      }

      

      if (typeSet.has("disco"))     img.classList.add("img-disco");
      if (typeSet.has("shiny"))     wrapper.classList.add("img-shiny");
      if (typeSet.has("pixelated")) img.style.imageRendering = "pixelated";
      if (typeSet.has("cover")) {
        

        

        Object.assign(wrapper.style, {
          overflow: "hidden",
          maxHeight: "250px",
          height:    "250px",
          width:     "100%",
          display:   "block",
        });
        Object.assign(img.style, {
          width:      "100%",
          height:     "120px",
          objectFit:  "cover", 

          objectPosition: "center top",
          display:    "block",
        });
      }

      

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
      star.className = "favorite-star";
      star.innerHTML = isFav(title)
        ? `<i class="fa-solid fa-star" aria-hidden="true"></i>`
        : `<i class="fa-regular fa-star" aria-hidden="true"></i>`;
      star.title     = "Favourite";
      star.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:16px!important;line-height:1!important;color:#000!important;display:inline-flex!important;align-items:center!important;";
      star.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.innerHTML = window.favorites.has(key)
          ? `<i class="fa-solid fa-star" aria-hidden="true"></i>`
          : `<i class="fa-regular fa-star" aria-hidden="true"></i>`;
        

        if (window.favorites.has(key)) {
          card.classList.add("ws-favorited");
        } else {
          card.classList.remove("ws-favorited");
          

          if (location.pathname.toLowerCase().includes("favorites.html")) {
            card.style.transition = "opacity 0.22s";
            card.style.opacity    = "0";
            setTimeout(() => {
              card.style.display = "none";
              if (typeof window.renderPage === "function") window.renderPage();
            }, 230);
          }
        }
      });

      

      const dlBtn = document.createElement("button");
      dlBtn.className = "asset-download-btn";
      dlBtn.title     = `Download "${title || "asset"}" as HTML`;
      dlBtn.innerHTML = `<i class="fa-solid fa-download" aria-hidden="true"></i>`;
      dlBtn.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:14px!important;line-height:1!important;color:#000!important;display:inline-flex!important;align-items:center!important;";
      dlBtn.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();
        try {
          const assetTitle = title    || "Untitled";
          const assetUrl   = link     || "";
          const assetFav   = imageSrc || "";

          

          let favIconBase64 = "";
          try {
            const imgRes  = await fetch(assetFav, { mode: "cors" });
            const imgBlob = await imgRes.blob();
            favIconBase64 = await new Promise((res) => {
              const reader  = new FileReader();
              reader.onload = () => res(reader.result);
              reader.readAsDataURL(imgBlob);
            });
          } catch (_) {  }

          

          

          

          

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

      

      const descText = safeStr(asset.description || "").trim();
      const descMsg  = descText || `No description available for "${title || "this asset"}".`;

      const descBtn = document.createElement("button");
      descBtn.className = "asset-action-btn asset-desc-btn";
      descBtn.innerHTML = `<i class="fa-solid fa-circle-question" aria-hidden="true"></i>`;
      descBtn.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:14px!important;line-height:1!important;color:#111!important;display:inline-flex!important;align-items:center!important;";
      descBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });

      const descPanel = document.createElement("div");
      descPanel.className = "description-panel";

      const descAlertText = document.createElement("div");
      descAlertText.className = "alert-text";
      descAlertText.textContent = descMsg;

      descPanel.appendChild(descAlertText);
      document.body.appendChild(descPanel);

      descBtn.addEventListener("mouseenter", () => descPanel.classList.add("desc-visible"));
      descBtn.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (!descPanel.matches(":hover")) descPanel.classList.remove("desc-visible");
        }, 80);
      });
      descPanel.addEventListener("mouseleave", () => descPanel.classList.remove("desc-visible"));

      

      const bugBtn = document.createElement("button");
      bugBtn.className = "asset-action-btn asset-bug-btn";
      bugBtn.title     = `Report a bug for "${title || "asset"}"`;
      bugBtn.innerHTML = `<i class="fa-solid fa-biohazard" aria-hidden="true"></i>`;
      bugBtn.style.cssText = "background:transparent!important;border:none!important;cursor:pointer!important;padding:2px 3px!important;font-size:14px!important;line-height:1!important;color:#111!important;display:inline-flex!important;align-items:center!important;";
      bugBtn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const padletUrl = "https://padlet.com/rhap5ody/wannasmile-suggestion-report-page-t8t6pg32hl71ri9m";
        window.open(padletUrl, "_blank");
      });

      

      const actionsRow = document.createElement("div");
      actionsRow.className = "card-actions";
      actionsRow.style.cssText = "display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:2px!important;width:100%!important;";
      actionsRow.appendChild(star);
      actionsRow.appendChild(dlBtn);
      actionsRow.appendChild(descBtn);
      actionsRow.appendChild(bugBtn);

      card.append(a, titleEl, authorEl, actionsRow);
      frag.appendChild(card);

      if (!window._cardIndex.has(pageNum)) window._cardIndex.set(pageNum, []);
      window._cardIndex.get(pageNum).push(card);
      window._allCards.push(card);
    }

    container.appendChild(frag);

    

    

    if (!window._pageLoadState) window._pageLoadState = new Map();

    

    const pagePromiseMap = new Map();
    for (const { promise, page, card } of imagePromises) {
      if (!pagePromiseMap.has(page)) pagePromiseMap.set(page, { promises: [], cards: [] });
      pagePromiseMap.get(page).promises.push(promise);
      pagePromiseMap.get(page).cards.push(card);
    }

    for (const [pageNum, { promises, cards }] of pagePromiseMap) {
      const isActive = pageNum === activePage;

      

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

      

      

      const pageSettled = Promise.allSettled(promises).then(() => {
        window._pageLoadState.set(pageNum, "loaded");
        

        

        if (+window.currentPage === pageNum) {
          if (isActive) {
            runLoaderSequence();
          } else {
            

            _dismissPageLoader(pageNum);
          }
        }
      });

      

      if (!window._pageLoadState.has(pageNum)) {
        window._pageLoadState.set(pageNum, pageSettled);
      }

      

      if (isActive) {
        pageSettled.then(() => {}); 

      }
    }

    

    if (!pagePromiseMap.has(activePage)) {
      window._pageLoadState.set(activePage, "loaded");
      runLoaderSequence();
    }

    return imagePromises;
  }

  
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    window._cardIndex = new Map();
    window._allCards  = [];

    const getFilteredCards = () => window._allCards.filter(c => c.dataset.filtered === "true");
    const getPages         = () => [...window._cardIndex.keys()].sort((a, b) => a - b);

    

    let errorGif = document.getElementById("noResultsGif");
    if (!errorGif) {
      errorGif = document.createElement("img");
      errorGif.id        = "noResultsGif";
      

      

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

    const _isFavPage = location.pathname.toLowerCase().includes("favorites.html");

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
          

          const isFavOK   = !_isFavPage || c.classList.contains("ws-favorited");
          

          

          const want = onThisPage && isReady && pageFullyLoaded && c.dataset.filtered === "true" && isFavOK ? "flex" : "none";
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

    

    

    function _handlePageNavigation(pageNum) {
      const pageState = window._pageLoadState?.get(pageNum);
      if (pageState === "loaded" || pageState === undefined) {
        

        return;
      }
      

      const loader = document.getElementById("containerLoader");
      if (!loader) {
        

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
        

        const img = loader.querySelector("img");
        if (img) applyGifToImg(img, _getTheme(), "loading");
        window._loaderSequenceRunning = false;
        document.body.classList.add("ws-loading");
        loader.style.display = "";
      }

      

      Promise.resolve(pageState).then(() => {
        _dismissPageLoader(pageNum);
      });
    }

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));

    window.currentPage = +sessionStorage.getItem("currentPage") || 1;
    renderPage();

    
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
          

          if (pagesAnchor) pagesAnchor.style.visibility = "";
          if (pageIndicator) {
            const pages = getPages();
            const idx   = pages.indexOf(+window.currentPage);
            pageIndicator.textContent = idx >= 0 ? `Page ${idx + 1}/${pages.length}` : `Page 1/${pages.length}`;
          }
          if (typeof renderPage === "function") renderPage();
        } else {
          

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

  
  let _resolveVersionReady;
  window._versionReady = new Promise(res => { _resolveVersionReady = res; });

  function applyVersionUI(raw) {
    const footerAnchor = document.getElementById("footerVersion");
    try {
      // Gather all rows that have a version string and a valid release tag.
      // release values: "obsolete" or "ignore" = skip entirely
      // "current" = candidate for display
      // "prerelease" = candidate only if version is higher than any "current"
      const rows = raw.filter(d => d.version?.toString().trim());

      // Simple semver-like comparison: split by "." and compare each segment numerically,
      // falling back to lexicographic comparison for non-numeric parts.
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
          if (va > vb) return 1;
        }
        return 0;
      }

      // Separate rows into current candidates and prerelease candidates
      const currentRows    = rows.filter(d => d.release?.toString().trim().toLowerCase() === "current");
      const prereleaseRows = rows.filter(d => d.release?.toString().trim().toLowerCase() === "prerelease");

      // Find the highest "current" version
      const bestCurrent = currentRows.reduce((best, d) => {
        const v = d.version.toString().trim();
        return (best === null || compareVer(v, best.version) > 0) ? { version: v, row: d } : best;
      }, null);

      // Find the highest "prerelease" version
      const bestPrerelease = prereleaseRows.reduce((best, d) => {
        const v = d.version.toString().trim();
        return (best === null || compareVer(v, best.version) > 0) ? { version: v, row: d } : best;
      }, null);

      // Decide which to display:
      // Use prerelease if it is strictly higher than the best current, otherwise use current.
      let displayVersion, displayRow;
      if (bestCurrent === null && bestPrerelease === null) {
        displayVersion = "V0.8";
        displayRow     = null;
      } else if (bestCurrent === null) {
        displayVersion = bestPrerelease.version;
        displayRow     = bestPrerelease.row;
      } else if (bestPrerelease === null) {
        displayVersion = bestCurrent.version;
        displayRow     = bestCurrent.row;
      } else {
        // Both exist — use prerelease only if it is strictly higher
        if (compareVer(bestPrerelease.version, bestCurrent.version) > 0) {
          displayVersion = bestPrerelease.version;
          displayRow     = bestPrerelease.row;
        } else {
          displayVersion = bestCurrent.version;
          displayRow     = bestCurrent.row;
        }
      }

      const message = displayRow?.["version-message"]?.toString().trim() || "";

      if (footerAnchor) footerAnchor.textContent = `Version ${displayVersion}`;
      const p = dom.updatePopup;
      if (p) {
        const titleEl = p.querySelector("h2");
        const msgEl   = p.querySelector("p");
        if (titleEl) titleEl.textContent = `🎉 Version ${displayVersion} Update!`;
        if (msgEl && message) msgEl.textContent = message;
        const dismissed = localStorage.getItem("dismissedUpdateVersion");
        const closed    = sessionStorage.getItem("updatePopupClosed");
        if (!closed && dismissed !== displayVersion) setTimeout(() => p.classList.add("show"), 600);
      }
    } catch {
      if (footerAnchor) footerAnchor.textContent = "Version V0.8";
    }
  }

  
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
        try { sessionStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(raw)); } catch {  }
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

    getLoadedGifDuration().catch(() => {});
    

    

    const promises = createAssetCards(data);

    const activePromises = promises.filter(p => p.page === savedPage).map(p => p.promise);
    const settle         = activePromises.length ? Promise.all(activePromises) : Promise.resolve();
    settle.finally(() => {
      if (typeof window._restoreScrollY === "function") window._restoreScrollY();
    });

    return true;
  }

  
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

    

    document.getElementById("containerLoader")?.remove();
    const loader = document.createElement("div");
    loader.id = "containerLoader";
    

    

    

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

  
  
  

  

  

  function initMuteButton() {
    const MUTE_KEY = "ws_muted";

    window._quotesMuted = localStorage.getItem(MUTE_KEY) === "true";

    function _applyAudioMute(muted) {
      document.querySelectorAll("audio, video").forEach(a => { a.muted = muted; });
    }

    

    _applyAudioMute(window._quotesMuted);

    

    const _audioObserver = new MutationObserver(() => {
      _applyAudioMute(window._quotesMuted);
    });
    _audioObserver.observe(document.body, { childList: true, subtree: true });

    

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