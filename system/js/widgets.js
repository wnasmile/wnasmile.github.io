/* widgets.js
   Drop-in replacement for soundscape.js.

   Smart behaviours:
   ┌─────────────────────────────────────────────────────────────┐
   │  Panel follows widget button in real time while dragging    │
   │  Widget left  of screen centre → panel opens to the RIGHT  │
   │  Widget right of screen centre → panel opens to the LEFT   │
   │  Resize handle sits at the far corner (away from widget)   │
   │    - right-side panel → bottom-right handle (se-resize)    │
   │    - left-side  panel → bottom-left  handle (sw-resize)    │
   │  Resizing in left mode anchors the RIGHT edge of the panel  │
   │  so the panel grows/shrinks leftward correctly             │
   └─────────────────────────────────────────────────────────────┘
*/
(() => {
  const STORAGE_KEY  = "ws_active_widget";
  const WIDGETS_JSON = "system/json/widgets.json";   // relative to index.html

  const ICON_CLOSE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><line x1='18' y1='6' x2='6' y2='18' stroke='white' stroke-width='2.5' stroke-linecap='round'/><line x1='6' y1='6' x2='18' y2='18' stroke='white' stroke-width='2.5' stroke-linecap='round'/></svg>";

  /* ── DOM refs (IDs unchanged from soundscape era) ── */
  const widget       = document.getElementById("soundscape-widget");
  const panel        = document.getElementById("soundscape-panel");
  const frameWrap    = document.getElementById("soundscape-frame-wrap");
  const closeBtn     = document.getElementById("ss-close-btn");
  const minBtn       = document.getElementById("ss-min-btn");
  const fsBtn        = document.getElementById("ss-fs-btn");
  const resizeHandle = document.getElementById("ss-resize-handle");
  const icon         = document.getElementById("soundscape-widget-icon");

  if (!widget || !panel) return;

  /* ── Runtime config ── */
  let ICON_DEFAULT = "";
  let IFRAME_SRC   = "";

  /* ── State ── */
  let state        = "closed";
  let isFullscreen = false;
  let iframe       = null;
  let savedStyle   = {};

  /* ── Drag state ── */
  let dragging = false;
  let moved    = false;
  let dOffX = 0, dOffY = 0;

  /* ── Resize state ── */
  let resizing        = false;
  let resizeOnLeft    = false;   // true when handle is on the left side
  let rStartX         = 0;
  let rStartY         = 0;
  let rStartW         = 0;
  let rStartH         = 0;
  let rStartPanelLeft = 0;      // panel's left px when resize began (left-mode anchor)
  let rStartPanelTop  = 0;      // panel's top px when resize began

  /* ─────────────────────────────────────────────────────────────
     SMART PANEL POSITIONING
     Called whenever the widget moves OR the panel opens.
     Panel always sits beside the widget with a small gap.
  ───────────────────────────────────────────────────────────── */
  const GAP = 12; // px gap between widget edge and panel edge

  function positionPanel() {
    if (state !== "open" || isFullscreen) return;

    const wRect = widget.getBoundingClientRect();
    // Use widget horizontal centre to decide which side to open on
    const wCentreX = wRect.left + wRect.width / 2;
    const onLeft   = wCentreX < window.innerWidth / 2;  // widget in left half?

    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Vertical: try to align panel's vertical centre with widget's centre,
    // then clamp so it stays inside viewport
    const wCentreY = wRect.top + wRect.height / 2;
    let top = wCentreY - ph / 2;
    top = Math.max(8, Math.min(top, vh - ph - 8));

    // Horizontal: place on the appropriate side of the widget
    let left;
    if (onLeft) {
      // Widget on left → panel opens to the RIGHT
      left = wRect.right + GAP;
      // Clamp so panel doesn't overflow right edge
      left = Math.min(left, vw - pw - 8);
    } else {
      // Widget on right → panel opens to the LEFT
      left = wRect.left - pw - GAP;
      // Clamp so panel doesn't overflow left edge
      left = Math.max(8, left);
    }

    panel.style.left   = left + "px";
    panel.style.top    = top  + "px";
    panel.style.right  = "auto";
    panel.style.bottom = "auto";

    // Keep resize handle in the correct corner
    setResideHandle(onLeft);
  }

  /* ── Place resize handle at the corner farthest from the widget ── */
  function setResideHandle(widgetOnLeft) {
    if (!resizeHandle) return;
    // data-side drives the CSS dot pattern (see widgets.css)
    resizeHandle.dataset.side = widgetOnLeft ? "right" : "left";
  }

  /* ─────────────────────────────────────────────────────────────
     THEME
  ───────────────────────────────────────────────────────────── */
  function applyWidgetTheme(cfg) {
    const root = document.documentElement;
    const bg   = cfg["background-color"] || "#ff5a00";
    const sh   = cfg["shadow-color"]     || "rgba(255,90,0,0.65)";

    let shadow2 = sh;
    const m = sh.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
    if (m) shadow2 = `rgba(${m[1]},${m[2]},${m[3]},0.3)`;

    root.style.setProperty("--ws-widget-bg",      bg);
    root.style.setProperty("--ws-widget-shadow1",  sh);
    root.style.setProperty("--ws-widget-shadow2",  shadow2);

    ICON_DEFAULT = cfg["widget-icon"] || "";
    IFRAME_SRC   = cfg["widget-url"]  || "";
  }

  /* ─────────────────────────────────────────────────────────────
     LOAD widgets.json
  ───────────────────────────────────────────────────────────── */
  async function loadActiveWidget() {
    let widgets = [];
    try {
      const res = await fetch(WIDGETS_JSON);
      widgets   = await res.json();
    } catch (_) {
      widgets = [{
        id: "soundscape",
        "widget-name":      "SoundScape",
        "widget-icon":      "https://raw.githubusercontent.com/syndicatelibrary/awhtpwkuitsfs/main/defaultFav.png",
        "widget-url":       "https://syndicatelibrary.github.io./awhtpwkuitsfs/",
        "background-color": "#ff5a00",
        "shadow-color":     "rgba(255,90,0,0.65)"
      }];
    }

    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, widgets[0].id);
    }

    const activeId = localStorage.getItem(STORAGE_KEY);
    const cfg      = widgets.find(w => w.id === activeId) || widgets[0];

    applyWidgetTheme(cfg);
    applyState();
  }

  /* ─────────────────────────────────────────────────────────────
     IFRAME
  ───────────────────────────────────────────────────────────── */
  function iframePointers(on) {
    if (iframe) iframe.style.pointerEvents = on ? "auto" : "none";
  }

  function createIframe() {
    destroyIframe();
    iframe = document.createElement("iframe");
    iframe.id      = "soundscape-iframe";
    iframe.src     = IFRAME_SRC;
    iframe.loading = "eager";
    iframe.allow   = "fullscreen; autoplay";
    frameWrap.appendChild(iframe);
  }

  function destroyIframe() {
    const el = document.getElementById("soundscape-iframe");
    if (el) { el.src = "about:blank"; el.remove(); }
    if (iframe && iframe !== el) { iframe.src = "about:blank"; try { iframe.remove(); } catch (_) {} }
    iframe = null;
  }

  /* ─────────────────────────────────────────────────────────────
     STATE MACHINE
  ───────────────────────────────────────────────────────────── */
  function applyState() {
    if (state === "closed") {
      panel.style.display = "none";
      icon.src = ICON_DEFAULT;
    } else if (state === "open") {
      panel.style.display = "flex";
      icon.src = ICON_CLOSE;
      // Wait one frame for the panel to have real dimensions, then position
      requestAnimationFrame(() => requestAnimationFrame(positionPanel));
    } else {
      // minimized
      panel.style.display = "none";
      icon.src = ICON_CLOSE;
    }
  }

  function openPanel()     { createIframe(); state = "open";      applyState(); }
  function minimizePanel() { if (isFullscreen) exitFullscreen(false); state = "minimized"; applyState(); }
  function closePanel()    { if (isFullscreen) exitFullscreen(false); state = "closed";    applyState(); destroyIframe(); }

  /* ─────────────────────────────────────────────────────────────
     FULLSCREEN OVERLAY BUTTONS
  ───────────────────────────────────────────────────────────── */
  const btnsOverlay = document.createElement("div");
  btnsOverlay.id = "ss-btns-overlay";
  Object.assign(btnsOverlay.style, {
    position: "fixed", top: "10px", right: "10px",
    display: "none", gap: "5px", zIndex: "2147483647",
    pointerEvents: "all", transition: "opacity .25s,transform .25s",
    opacity: "0", transform: "translateY(-6px)",
  });
  ["ss-fs-btn", "ss-min-btn", "ss-close-btn"].forEach((id) => {
    const orig  = document.getElementById(id);
    const clone = orig.cloneNode(true);
    clone.dataset.mirrorOf = id;
    clone.addEventListener("click", (e) => { e.stopPropagation(); orig.click(); });
    btnsOverlay.appendChild(clone);
  });
  btnsOverlay.style.flexDirection = "row";
  document.body.appendChild(btnsOverlay);

  function syncOverlay() {
    btnsOverlay.querySelectorAll("[data-mirror-of]").forEach((clone) => {
      const orig = document.getElementById(clone.dataset.mirrorOf);
      clone.textContent = orig.textContent;
      clone.title = orig.title;
    });
  }
  function showOverlay() {
    btnsOverlay.style.display       = "flex";
    btnsOverlay.style.opacity       = "1";
    btnsOverlay.style.transform     = "translateY(0)";
    btnsOverlay.style.pointerEvents = "all";
  }
  function hideOverlay() {
    btnsOverlay.style.opacity       = "0";
    btnsOverlay.style.transform     = "translateY(-6px)";
    btnsOverlay.style.pointerEvents = "none";
    setTimeout(() => { if (btnsOverlay.style.opacity === "0") btnsOverlay.style.display = "none"; }, 260);
  }

  function enterFullscreen() {
    savedStyle = {
      width:  panel.style.width  || "",
      height: panel.style.height || "",
      top:    panel.style.top    || "",
      left:   panel.style.left   || "",
      right:  panel.style.right  || "",
      bottom: panel.style.bottom || "",
    };
    panel.classList.add("ss-fullscreen");
    isFullscreen = true;
    fsBtn.textContent = "⊠"; fsBtn.title = "Exit Fullscreen";
    syncOverlay(); showOverlay();
    document.body.style.overflow = "hidden";
  }

  function exitFullscreen(reapply) {
    panel.classList.remove("ss-fullscreen");
    Object.assign(panel.style, savedStyle);
    isFullscreen = false;
    fsBtn.textContent = "⛶"; fsBtn.title = "Fullscreen";
    syncOverlay(); hideOverlay();
    document.body.style.overflow = "";
    if (reapply !== false) applyState();
  }

  document.addEventListener("mousemove", (e) => {
    if (!isFullscreen) return;
    if (e.clientY < 60) showOverlay(); else hideOverlay();
  });

  fsBtn.addEventListener("click",    (e) => { e.stopPropagation(); if (state === "open") { isFullscreen ? exitFullscreen() : enterFullscreen(); } });
  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closePanel(); });
  minBtn.addEventListener("click",   (e) => { e.stopPropagation(); minimizePanel(); });

  /* ─────────────────────────────────────────────────────────────
     WIDGET DRAG
     Panel follows the widget in real time via positionPanel().
  ───────────────────────────────────────────────────────────── */
  widget.addEventListener("click", () => {
    if (moved) { moved = false; return; }
    if      (state === "closed") openPanel();
    else if (state === "open")   minimizePanel();
    else                         { state = "open"; applyState(); }
  });

  widget.addEventListener("mousedown", (e) => {
    dragging = true; moved = false;
    const rect = widget.getBoundingClientRect();
    dOffX = e.clientX - rect.left;
    dOffY = e.clientY - rect.top;
    // Switch from right/bottom anchoring to absolute left/top
    widget.style.right  = "auto";
    widget.style.bottom = "auto";
    widget.style.left   = rect.left + "px";
    widget.style.top    = rect.top  + "px";
    iframePointers(false);
    e.preventDefault();
  });

  widget.addEventListener("touchstart", (e) => {
    dragging = true; moved = false;
    const t = e.touches[0];
    const rect = widget.getBoundingClientRect();
    dOffX = t.clientX - rect.left;
    dOffY = t.clientY - rect.top;
    widget.style.right  = "auto";
    widget.style.bottom = "auto";
    widget.style.left   = rect.left + "px";
    widget.style.top    = rect.top  + "px";
    iframePointers(false);
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────────
     RESIZE
     Captures which side the handle is on at mousedown, then
     grows/shrinks the panel in the correct direction.
  ───────────────────────────────────────────────────────────── */
  resizeHandle?.addEventListener("mousedown", (e) => {
    if (isFullscreen) return;
    e.preventDefault();
    e.stopPropagation();

    resizing     = true;
    resizeOnLeft = (resizeHandle.dataset.side === "left");
    rStartX      = e.clientX;
    rStartY      = e.clientY;
    rStartW      = panel.offsetWidth;
    rStartH      = panel.offsetHeight;

    const pRect      = panel.getBoundingClientRect();
    rStartPanelLeft  = pRect.left;
    rStartPanelTop   = pRect.top;

    iframePointers(false);
  });

  /* ─────────────────────────────────────────────────────────────
     UNIFIED MOUSEMOVE
  ───────────────────────────────────────────────────────────── */
  document.addEventListener("mousemove", (e) => {

    /* ── DRAG widget, panel follows ── */
    if (dragging) {
      moved = true;
      const x = Math.max(0, Math.min(e.clientX - dOffX, window.innerWidth  - widget.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - dOffY, window.innerHeight - widget.offsetHeight));
      widget.style.left = x + "px";
      widget.style.top  = y + "px";
      positionPanel();   // panel snaps to new position in real time
    }

    /* ── RESIZE panel ── */
    if (resizing) {
      const dx = e.clientX - rStartX;
      const dy = e.clientY - rStartY;

      // Height always grows downward from the resize handle
      const newH = Math.max(320, Math.min(rStartH + dy, window.innerHeight * 0.85));
      panel.style.height = newH + "px";

      if (resizeOnLeft) {
        // Handle is bottom-LEFT → dragging left makes panel WIDER
        // The right edge must stay fixed, so we shift left edge
        const newW     = Math.max(260, Math.min(rStartW - dx, window.innerWidth * 0.9));
        const newLeft  = rStartPanelLeft + rStartW - newW;   // keeps right edge anchored
        panel.style.width = newW    + "px";
        panel.style.left  = Math.max(8, newLeft) + "px";
      } else {
        // Handle is bottom-RIGHT → normal, grow rightward
        const newW = Math.max(260, Math.min(rStartW + dx, window.innerWidth * 0.9));
        panel.style.width = newW + "px";
      }
    }
  });

  document.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    moved = true;
    const t = e.touches[0];
    const x = Math.max(0, Math.min(t.clientX - dOffX, window.innerWidth  - widget.offsetWidth));
    const y = Math.max(0, Math.min(t.clientY - dOffY, window.innerHeight - widget.offsetHeight));
    widget.style.left = x + "px";
    widget.style.top  = y + "px";
    positionPanel();
  }, { passive: true });

  document.addEventListener("mouseup", () => {
    if (dragging || resizing) iframePointers(true);
    if (dragging) { dragging = false; setTimeout(() => { moved = false; }, 0); }
    if (resizing) { resizing = false; }
  });

  document.addEventListener("touchend", () => {
    if (dragging) iframePointers(true);
    dragging = false;
    setTimeout(() => { moved = false; }, 0);
  });

  panel.addEventListener("wheel", (e) => { e.stopPropagation(); }, { passive: true });

  // Reposition when viewport is resized
  window.addEventListener("resize", () => positionPanel());

  /* ── Boot ── */
  loadActiveWidget();
})();