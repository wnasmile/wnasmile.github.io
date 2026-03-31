/* ============================================================
   quotes.js — Marquee quote ticker
   Load ORDER: 6th (depends on: utils.js, theme.js)
   Activates only when #quoteWrapper + #quoteBox are present.
   ============================================================ */

"use strict";

/* ---------- Injected Styles ---------- */
(function injectQuoteStyles() {
  if (document.getElementById("_qs-styles")) return;
  const style = document.createElement("style");
  style.id = "_qs-styles";
  style.textContent = `
    /* ── Reset: never inherit monospace or bold ── */
    #quoteBox,
    #quoteBox * {
      font-family: monospace !important;
      font-weight: 600 !important;
      box-sizing: border-box;
    }

    /* ── Anchor spans ── */
    .qs-anchor {
      cursor: pointer;
      transition: color 0.15s, opacity 0.15s;
    }
    .qs-anchor:hover {
      opacity: 0.8;
    }

    /* ── Text animations — applied per character via .qs-char spans ── */

    /* wrapper span: just needs to not break layout */
    .qs-anim-shake,
    .qs-anim-wave,
    .qs-anim-jumpy,
    .qs-anim-tremble,
    .qs-anim-crawl {
      display: inline;
    }

    /* each letter gets this class; animation name+duration set inline */
    .qs-char {
      display: inline-block; /* required for transform to work on inline text */
      white-space: pre;      /* preserve spaces */
    }

    /* Shake — rapid horizontal jitter */
    @keyframes _qs-shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-3px); }
      40%     { transform: translateX(3px); }
      60%     { transform: translateX(-2px); }
      80%     { transform: translateX(2px); }
    }

    /* Wave — gentle sine up/down */
    @keyframes _qs-wave {
      0%,100% { transform: translateY(0); }
      25%     { transform: translateY(-5px); }
      75%     { transform: translateY(5px); }
    }

    /* Jumpy — bouncy upward pop */
    @keyframes _qs-jumpy {
      0%,55%,100% { transform: translateY(0); }
      35%         { transform: translateY(-10px); }
      45%         { transform: translateY(-7px); }
    }

    /* Tremble — fast micro-shake in all directions */
    @keyframes _qs-tremble {
      0%   { transform: translate(0,0) rotate(0deg); }
      15%  { transform: translate(-1px, 1px) rotate(-0.5deg); }
      30%  { transform: translate(1px,-1px) rotate(0.5deg); }
      45%  { transform: translate(-1px,-1px) rotate(0deg); }
      60%  { transform: translate(1px, 1px) rotate(0.5deg); }
      75%  { transform: translate(0,-1px) rotate(-0.5deg); }
      90%  { transform: translate(-1px,0) rotate(0deg); }
      100% { transform: translate(0,0) rotate(0deg); }
    }

    /* Crawl — slow creeping vertical drift */
    @keyframes _qs-crawl {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-3px); }
    }

    /* ── Sticker images ── */
    .quote-sticker {
      display: inline-block;
      vertical-align: middle;
      max-height: 1.6em;
      width: auto;
    }
  `;
  document.head.appendChild(style);
})();

/* ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("quoteWrapper");
  const box     = document.getElementById("quoteBox");
  if (!wrapper || !box) return;

  const SHEETS_URL = "https://script.google.com/macros/s/AKfycby9p5RqOqCig0pRPe-aiJ4eyY9WqDCyTSZBjdw56u5yEzH5iBJdOm3CXW9MirG6Y3PBPA/exec";

  let LOCAL_QUOTES = [];

  // --- 2-layer refresh state ---
  let seenIndices   = new Set();
  let pendingQuotes = null;
  let fetchInFlight = false;

  function parseQuotes(data) {
    if (!Array.isArray(data) || data.length === 0) return null;
    const result = data
      .map(row => (row && typeof row.quote === "string" ? row.quote : ""))
      .filter(q => q.trim().length > 0);
    return result.length > 0 ? result : null;
  }

  function backgroundRefetch() {
    if (fetchInFlight) return;
    fetchInFlight = true;
    fetch(SHEETS_URL)
      .then(r => r.json())
      .then(data => {
        const fresh = parseQuotes(data);
        if (fresh) pendingQuotes = fresh;
      })
      .catch(() => {})
      .finally(() => { fetchInFlight = false; });
  }

  fetch(SHEETS_URL)
    .then(r => r.json())
    .then(data => {
      const initial = parseQuotes(data);
      if (initial) LOCAL_QUOTES = initial;
    })
    .catch(() => { LOCAL_QUOTES = ["404 quotes not found."]; })
    .finally(() => { setQuote(); requestAnimationFrame(animate); });

  /* ---------- Sticker Resolver ---------- */

  if (!window._qsNextSrc) {
    window._qsNextSrc = function (img, key, idx) {
      const list = window[key];
      if (!list || idx >= list.length) { img.onerror = null; img.style.display = "none"; return; }
      img.onerror = function () { window._qsNextSrc(img, key, idx + 1); };
      img.src = list[idx];
    };
  }

  function buildStickerImg(path, ext) {
    if (path.includes("..")) return `:${path}:`; // safety — no path traversal

    const packs = (window.stickerPacksLibrary || []);
    if (!packs.length) return `:${path}:`;

    const fallbacks = [];
    const seen = new Set();
    const push = (url) => { if (!seen.has(url)) { seen.add(url); fallbacks.push(url); } };

    if (ext) {
      const primary   = (ext === "gif") ? "dynamic" : "static";
      const secondary = (ext === "gif") ? "static"  : "dynamic";
      for (const p of packs) {
        push(p[primary]  + path);
        push(p[secondary] + path);
      }
    } else {
      for (const p of packs) {
        push(p.static  + path + ".png");
        push(p.dynamic + path + ".gif");
        push(p.static  + path);
        push(p.dynamic + path);
      }
    }

    if (!fallbacks.length) return `:${path}:`;

    const key = "_qsFB_" + btoa(unescape(encodeURIComponent(path))).replace(/[^a-zA-Z0-9]/g, "");
    window[key] = fallbacks;

    return `<img src="${fallbacks[0]}" class="quote-sticker" alt="${path}" loading="lazy" onerror="window._qsNextSrc(this,'${key}',1)">`;
  }

  /* ---------- Style Parser Helpers ---------- */

  function parseStyleProps(raw) {
    const props = {};
    (raw || "").split(";").forEach(part => {
      const eq = part.indexOf(":");
      if (eq < 1) return;
      const k = part.slice(0, eq).trim();
      const v = part.slice(eq + 1).trim();
      if (k) props[k] = v;
    });
    return props;
  }

  /* ---------- Audio Box ---------- */

  let _audCtx      = null;
  let _audSource   = null;
  let _audGain     = null;
  let _audPanner   = null;
  let _audBuffer   = null;
  let _audSrc      = null;
  let _audVol      = 1.0;
  let _audPanAnim  = null;

  function stopAudio() {
    _clearLoopTimer();
    // Cancel any in-flight CDN fetch so prepareAudio bails cleanly
    if (_audFetchCtrl) { _audFetchCtrl.abort(); _audFetchCtrl = null; }
    if (_audSource) { try { _audSource.stop(); } catch (_) {} _audSource = null; }
    if (_audPanAnim) { cancelAnimationFrame(_audPanAnim); _audPanAnim = null; }
    _audBuffer = null;
    _audSrc    = null;
  }

  let _audLoopStart = 0;
  let _audLoopEnd   = 0;
  let _audStartedAt = 0;
  let _audLoopTimer = null;

  function _clearLoopTimer() {
    if (_audLoopTimer !== null) { clearTimeout(_audLoopTimer); _audLoopTimer = null; }
  }

  function _spawnSource() {
    if (!_audCtx || !_audBuffer || !_audPanner || !_audGain) return;
    _clearLoopTimer();
    if (_audSource) { try { _audSource.stop(); } catch (_) {} }

    _audSource        = _audCtx.createBufferSource();
    _audSource.buffer = _audBuffer;
    _audSource.loop   = false;

    _audSource.connect(_audPanner).connect(_audGain).connect(_audCtx.destination);
    _audSource.start(0, _audLoopStart);
    _audStartedAt = _audCtx.currentTime;

    const clipLen = _audLoopEnd - _audLoopStart;
    _audLoopTimer = setTimeout(_spawnSource, clipLen * 1000);
  }

  let _audReadyPromise = null;
  let _audFetchCtrl    = null; // AbortController for the active CDN fetch

  // Resolves only after _spawnSource() has called .start() — audio is genuinely playing.
  // Always resolves (never rejects) so a bad CDN fetch never permanently stalls a quote.
  function prepareAudio(src, vol, startSec, endSec) {
    if (!src) return Promise.resolve();
    _audSrc = src;
    _audVol = vol;

    return new Promise(async (resolve) => {
      try {
        if (!_audCtx) _audCtx = new AudioContext();
        if (_audCtx.state === "suspended") await _audCtx.resume();

        // Cancel any previous stale fetch immediately
        if (_audFetchCtrl) { _audFetchCtrl.abort(); _audFetchCtrl = null; }
        const ctrl = new AbortController();
        _audFetchCtrl = ctrl;

        const response = await fetch(src, { signal: ctrl.signal });
        const arrayBuf = await response.arrayBuffer();

        // If stopAudio() fired mid-fetch and reset _audFetchCtrl, bail without playing
        if (_audFetchCtrl !== ctrl) { resolve(); return; }
        _audFetchCtrl = null;

        _audBuffer = await _audCtx.decodeAudioData(arrayBuf);

        const duration = _audBuffer.duration;
        _audLoopStart  = Math.min(Math.max(startSec || 0, 0), duration);
        _audLoopEnd    = endSec ? Math.min(Math.max(endSec, _audLoopStart + 0.1), duration) : duration;

        _audPanner          = _audCtx.createStereoPanner();
        _audGain            = _audCtx.createGain();
        _audGain.gain.value = 0;

        // Audio is live — resolve here so the marquee is released exactly when playback starts
        _spawnSource();
        startPanVolumeAnimation();
        resolve();

      } catch (e) {
        if (e?.name !== "AbortError") {
          console.warn("[audbox] Failed to load/play audio:", e);
        }
        resolve(); // always unblock — don't strand the quote on a network failure
      }
    });
  }

  function startAudio(src, vol, startSec, endSec) {
    _audReadyPromise = prepareAudio(src, vol, startSec, endSec);
  }

  function startPanVolumeAnimation() {
    if (_audPanAnim) cancelAnimationFrame(_audPanAnim);

    const animatePanVol = () => {
      if (!_audPanner || !_audGain || !_audSource) return;

      const wrapperEl = document.getElementById("quoteWrapper");
      const boxEl     = document.getElementById("quoteBox");

      if (wrapperEl && boxEl) {
        const ww = wrapperEl.offsetWidth || window.innerWidth;
        // bx = left edge of the box in wrapper-space
        const bx = parseFloat(boxEl.style.transform?.match(/translateX\(([^)]+)px\)/)?.[1] ?? 0);
        const bw = boxEl.offsetWidth || 0;

        // Centre of the box in wrapper-space
        const cx = bx + bw / 2;

        // Pan: map box centre across wrapper width → -1 (left/exiting) to +1 (right/entering)
        const pan = Math.max(-1, Math.min(1, (cx / ww) * 2 - 1));
        _audPanner.pan.value = pan;

        // --- Volume fade ---
        // The box travels right→left. ww is total wrapper width.
        //
        // FADE IN  (entering from the right):
        //   Box leading edge (bx) starts at ww and moves left.
        //   We want silence while bx >= ww, and full volume once bx <= ww - fadeZone.
        //   entryProgress = how far the leading edge has crossed into the wrapper.
        //
        // FADE OUT (exiting to the left):
        //   Box trailing edge (bx + bw) approaches 0 from the right.
        //   We want full volume while (bx + bw) >= fadeZone, and silence at (bx + bw) <= 0.
        //   exitProgress = how much trailing edge remains before it leaves.
        //
        const fadeZone = Math.max(ww * 0.18, 80); // at least 80px ramp

        // entryProgress: 0 when box just touches right edge, 1 when fully entered by fadeZone
        const entryProgress = Math.min(1, Math.max(0, (ww - bx) / fadeZone));

        // exitProgress: 1 while trailing edge well inside, 0 when trailing edge has exited
        const exitProgress  = Math.min(1, Math.max(0, (bx + bw) / fadeZone));

        _audGain.gain.value = _audVol * Math.min(entryProgress, exitProgress);
      }

      _audPanAnim = requestAnimationFrame(animatePanVol);
    };

    _audPanAnim = requestAnimationFrame(animatePanVol);
  }

  /* ---------- Main Quote Parser ---------- */

  const _TEXT_ANIMATION_TYPES = new Set(["shake", "wave", "jumpy", "tremble", "crawl"]);

  function parseQuoteWithImages(text) {
    let out = text;

    // Pass 1: [{style;}] … [/] — generic styled spans
    out = out.replace(
      /\[\{([^}]*)\}\]([\s\S]*?)\[\/\]/g,
      (_, rawProps, inner) => {
        const props = parseStyleProps(rawProps);
        const css   = [];
        const data  = {};
        if (props.c)  css.push(`color:${props.c}`);
        if (props.u === "true") css.push("text-decoration:underline");
        if (props.type && _TEXT_ANIMATION_TYPES.has(props.type)) data["anim"] = props.type;
        if (props.sp) data["sp"] = props.sp;

        const styleAttr = css.length ? ` style="${css.join(";")}"` : "";
        const dataAttrs = Object.entries(data)
          .map(([k, v]) => `data-qs-${k}="${String(v).replace(/"/g, "&quot;")}"`)
          .join(" ");
        // qs-anim-* drives the @keyframes declared in the injected <style>
        const animClass = data.anim ? ` qs-anim-${data.anim}` : "";
        const cls = `qs-styled${animClass}`;
        return `<span class="${cls}"${styleAttr}${dataAttrs ? " " + dataAttrs : ""}>${inner}</span>`;
      }
    );

    // Pass 2: [a{style;}] … [/a]  and  [a] … [/a] — anchors
    // Props: u (underline), ac (accent/hover color), src (URL to open on click)
    out = out.replace(
      /\[a\{([^}]*)\}\]([\s\S]*?)\[\/a\]/g,
      (_, rawProps, inner) => {
        const props = parseStyleProps(rawProps);
        const css   = [];
        if (props.u === "true") css.push("text-decoration:underline");
        const accentAttr = props.ac  ? ` data-qs-ac="${props.ac}"`   : "";
        const srcAttr    = props.src ? ` data-qs-src="${props.src}"` : "";
        const styleAttr  = css.length ? ` style="${css.join(";")}"` : "";
        return `<span class="qs-anchor"${styleAttr}${accentAttr}${srcAttr}>${inner}</span>`;
      }
    );
    out = out.replace(
      /\[a\]([\s\S]*?)\[\/a\]/g,
      (_, inner) => `<span class="qs-anchor">${inner}</span>`
    );

    // Pass 3: [audbox{style;}] … [/audbox] — audio boxes
    out = out.replace(
      /\[audbox\{([^}]*)\}\]([\s\S]*?)\[\/audbox\]/g,
      (_, rawProps, inner) => {
        const props    = parseStyleProps(rawProps);
        const src      = props.src || "";
        const volPc    = props.vol || "100%";
        const vol      = parseFloat(volPc) / 100;
        const startSec = props.start ? parseFloat(props.start) : 0;
        const endSec   = props.end   ? parseFloat(props.end)   : 0;
        if (src) {
          startAudio(src, isNaN(vol) ? 1 : Math.min(1, Math.max(0, vol)), startSec, endSec || undefined);
        }
        return `<span class="qs-audbox" data-qs-src="${src}" data-qs-vol="${volPc}">${inner}</span>`;
      }
    );

    // Pass 4: :sticker: — images
    out = out.replace(
      /:([a-zA-Z0-9_\-\/]+(?:\.(png|gif|webp|jpg|jpeg))?):/gi,
      (match, path, ext) => {
        if (path.includes("..")) return match;
        return buildStickerImg(path, ext || null);
      }
    );

    return out;
  }

  /* ---------- Per-character animation splitter ---------- */

  // Animation configs: name → { keyframe, duration, easing, delayPerChar (ms) }
  const _ANIM_CONFIG = {
    shake:   { kf: "_qs-shake",   dur: "0.4s",  ease: "ease-in-out", step: 40  },
    wave:    { kf: "_qs-wave",    dur: "1.2s",  ease: "ease-in-out", step: 80  },
    jumpy:   { kf: "_qs-jumpy",   dur: "0.8s",  ease: "ease-in-out", step: 60  },
    tremble: { kf: "_qs-tremble", dur: "0.25s", ease: "linear",      step: 20  },
    crawl:   { kf: "_qs-crawl",   dur: "2.5s",  ease: "ease-in-out", step: 120 },
  };

  function splitAnimatedSpans(containerEl) {
    // Find every animated wrapper span
    containerEl.querySelectorAll("[data-qs-anim]").forEach(spanEl => {
      const animName = spanEl.dataset.qsAnim;
      const cfg = _ANIM_CONFIG[animName];
      if (!cfg) return;

      const animDecl = `${cfg.kf} ${cfg.dur} ${cfg.ease} infinite`;

      // Walk child nodes; split text nodes into per-char spans, leave elements as-is
      let charIndex = 0;
      const newChildren = [];

      spanEl.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Split each character into its own animated span
          for (const ch of node.textContent) {
            const charSpan = document.createElement("span");
            charSpan.className = "qs-char";
            charSpan.textContent = ch;
            charSpan.style.animation = animDecl;
            charSpan.style.animationDelay = `${charIndex * cfg.step}ms`;
            newChildren.push(charSpan);
            charIndex++;
          }
        } else {
          // Element node (e.g. sticker <img>) — keep as-is, count as one "character" for delay
          const clone = node.cloneNode(true);
          newChildren.push(clone);
          charIndex++;
        }
      });

      // Replace span contents with the per-char spans
      spanEl.innerHTML = "";
      newChildren.forEach(child => spanEl.appendChild(child));
    });
  }

  /* ---------- Anchor interactions (delegated) ---------- */

  // Click → open src URL in new tab
  box.addEventListener("click", (e) => {
    const anchor = e.target.closest(".qs-anchor");
    if (!anchor) return;
    const src = anchor.dataset.qsSrc;
    if (src) window.open(src, "_blank", "noopener,noreferrer");
  });

  // Hover → apply accent color
  box.addEventListener("mouseover", (e) => {
    const anchor = e.target.closest(".qs-anchor");
    if (!anchor) return;
    const ac = anchor.dataset.qsAc;
    if (ac) anchor.style.color = ac;
  });
  box.addEventListener("mouseout", (e) => {
    const anchor = e.target.closest(".qs-anchor");
    if (!anchor) return;
    anchor.style.color = "";
  });

  /* ---------- Speed & Hover ---------- */

  let _customSpeeds = null;

  function readCustomSpeeds(boxEl) {
    const span = boxEl.querySelector("[data-qs-sp]");
    if (!span) { _customSpeeds = null; return; }
    const parts = span.dataset.qsSp.split(",").map(s => parseFloat(s.trim()));
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
      _customSpeeds = parts;
    } else {
      _customSpeeds = null;
    }
  }

  const SPEED_BASE   = 120;
  const SPEED_SLOW   = 70;
  const SPEED_SLOWER = 30;

  let pos = 0, lastTime = null, currentSpeed = SPEED_BASE;
  let isHoveringBox = false, isHoveringText = false, isMouseDown = false;

  const updateSpeed = () => {
    const speeds = _customSpeeds
      ? { base: _customSpeeds[0], slow: _customSpeeds[1], slower: _customSpeeds[2] }
      : { base: SPEED_BASE,       slow: SPEED_SLOW,       slower: SPEED_SLOWER     };
    if (isMouseDown)         currentSpeed = 0;
    else if (isHoveringText) currentSpeed = speeds.slower;
    else if (isHoveringBox)  currentSpeed = speeds.slow;
    else                     currentSpeed = speeds.base;
  };

  let lastIdx = -1;

  /* ---------- Quote Ready Gate ---------- */

  // Images get 5s, audio gets 12s — CDN cold-start fetches can be slow.
  // Both are hard fallback ceilings; the promises resolve earlier on success.
  function waitForQuoteReady(containerEl, imgTimeoutMs = 5000, audTimeoutMs = 12000) {
    const imgs = [...containerEl.querySelectorAll("img")];
    const imgPromise = imgs.length
      ? new Promise((resolve) => {
          let remaining = imgs.length;
          const done = () => { if (--remaining === 0) resolve(); };
          setTimeout(resolve, imgTimeoutMs);
          imgs.forEach((img) => {
            if (img.complete) { done(); return; }
            img.addEventListener("load",  done, { once: true });
            img.addEventListener("error", done, { once: true });
          });
        })
      : Promise.resolve();

    const audPromise = _audReadyPromise
      ? Promise.race([
          _audReadyPromise,
          new Promise((r) => setTimeout(r, audTimeoutMs)),
        ])
      : Promise.resolve();

    _audReadyPromise = null;
    return Promise.all([imgPromise, audPromise]);
  }

  let _quoteReady = true;

  const setQuote = () => {
    stopAudio();

    if (pendingQuotes) {
      LOCAL_QUOTES = pendingQuotes;
      pendingQuotes = null;
      seenIndices.clear();
      lastIdx = -1;
    }

    let idx;
    if (LOCAL_QUOTES.length === 1) {
      idx = 0;
    } else {
      do {
        idx = Math.floor(Math.random() * LOCAL_QUOTES.length);
      } while (idx === lastIdx);
    }
    lastIdx = idx;
    seenIndices.add(idx);

    box.innerHTML = parseQuoteWithImages(LOCAL_QUOTES[idx]);
    splitAnimatedSpans(box);
    readCustomSpeeds(box);
    updateSpeed();
    pos = wrapper.offsetWidth;
    box.style.transform = `translateX(${pos}px)`;
    _quoteReady = false;
    waitForQuoteReady(box).then(() => { _quoteReady = true; lastTime = null; });

    if (seenIndices.size >= LOCAL_QUOTES.length) {
      seenIndices.clear();
      backgroundRefetch();
    }
  };

  const animate = (time) => {
    if (_quoteReady && lastTime !== null) {
      pos -= currentSpeed * ((time - lastTime) / 1000);
      box.style.transform = `translateX(${pos}px)`;
      if (pos + box.offsetWidth < 0) {
        stopAudio();
        setQuote();
      }
    }
    lastTime = _quoteReady ? time : null;
    requestAnimationFrame(animate);
  };

  wrapper.addEventListener("mouseenter",  () => { isHoveringBox  = true;  updateSpeed(); });
  wrapper.addEventListener("mouseleave",  () => { isHoveringBox  = false; isHoveringText = false; updateSpeed(); });
  box.addEventListener("mouseenter",      () => { isHoveringText = true;  updateSpeed(); });
  box.addEventListener("mouseleave",      () => { isHoveringText = false; updateSpeed(); });
  wrapper.addEventListener("mousedown",   () => { isMouseDown    = true;  updateSpeed(); });
  document.addEventListener("mouseup",    () => { if (!isMouseDown) return; isMouseDown = false; updateSpeed(); });

  // startup deferred to fetch .finally() above
});