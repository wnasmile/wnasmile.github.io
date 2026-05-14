(() => {
  const ICON_DEFAULT = "https://raw.githubusercontent.com/syndicatelibrary/awhtpwkuitsfs/main/defaultFav.png";
  const ICON_CLOSE   = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><line x1='18' y1='6' x2='6' y2='18' stroke='white' stroke-width='2.5' stroke-linecap='round'/><line x1='6' y1='6' x2='18' y2='18' stroke='white' stroke-width='2.5' stroke-linecap='round'/></svg>";
  const IFRAME_SRC   = "https://syndicatelibrary.github.io./awhtpwkuitsfs/";

  const widget       = document.getElementById("soundscape-widget");
  const panel        = document.getElementById("soundscape-panel");
  const frameWrap    = document.getElementById("soundscape-frame-wrap");
  const closeBtn     = document.getElementById("ss-close-btn");
  const minBtn       = document.getElementById("ss-min-btn");
  const fsBtn        = document.getElementById("ss-fs-btn");
  const resizeHandle = document.getElementById("ss-resize-handle");
  const icon         = document.getElementById("soundscape-widget-icon");

  if (!widget || !panel) return; 

  
  
  let state        = "closed";
  let isFullscreen = false;
  let iframe       = null;
  let savedStyle   = {};

  
  let dragging = false;
  let moved    = false;
  let dOffX = 0, dOffY = 0;

  
  let resizing = false;
  let rStartX = 0, rStartY = 0, rStartW = 0, rStartH = 0;

  
  function iframePointers(on) {
    if (iframe) iframe.style.pointerEvents = on ? "auto" : "none";
  }

  function applyState() {
    if (state === "closed") {
      panel.style.display = "none";
      icon.src = ICON_DEFAULT;
    } else if (state === "open") {
      panel.style.display = "flex";
      icon.src = ICON_CLOSE;
    } else {
      
      panel.style.display = "none";
      icon.src = ICON_CLOSE;
    }
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

  
  function openPanel()     { createIframe(); state = "open";      applyState(); }
  function minimizePanel() { if (isFullscreen) exitFullscreen(false); state = "minimized"; applyState(); }
  function closePanel()    { if (isFullscreen) exitFullscreen(false); state = "closed";    applyState(); destroyIframe(); }

  
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
    btnsOverlay.style.display   = "flex";
    btnsOverlay.style.opacity   = "1";
    btnsOverlay.style.transform = "translateY(0)";
    btnsOverlay.style.pointerEvents = "all";
  }
  function hideOverlay() {
    btnsOverlay.style.opacity   = "0";
    btnsOverlay.style.transform = "translateY(-6px)";
    btnsOverlay.style.pointerEvents = "none";
    setTimeout(() => { if (btnsOverlay.style.opacity === "0") btnsOverlay.style.display = "none"; }, 260);
  }

  
  function enterFullscreen() {
    savedStyle = {
      width: panel.style.width || "", height: panel.style.height || "",
      top: panel.style.top || "", left: panel.style.left || "",
      right: panel.style.right || "", bottom: panel.style.bottom || "",
    };
    panel.classList.add("ss-fullscreen");
    isFullscreen = true;
    fsBtn.textContent = "⊠"; fsBtn.title = "Exit Fullscreen";
    syncOverlay();
    showOverlay();
    document.body.style.overflow = "hidden";
  }

  function exitFullscreen(reapply) {
    panel.classList.remove("ss-fullscreen");
    Object.assign(panel.style, savedStyle);
    isFullscreen = false;
    fsBtn.textContent = "⛶"; fsBtn.title = "Fullscreen";
    syncOverlay();
    hideOverlay();
    document.body.style.overflow = "";
    if (reapply !== false) applyState();
  }

  document.addEventListener("mousemove", (e) => {
    if (!isFullscreen) return;
    if (e.clientY < 60) showOverlay(); else hideOverlay();
  });

  fsBtn.addEventListener("click",   (e) => { e.stopPropagation(); if (state === "open") { isFullscreen ? exitFullscreen() : enterFullscreen(); } });
  closeBtn.addEventListener("click",(e) => { e.stopPropagation(); closePanel(); });
  minBtn.addEventListener("click",  (e) => { e.stopPropagation(); minimizePanel(); });

  
  widget.addEventListener("click", () => {
    if (moved) { moved = false; return; }
    if      (state === "closed")    openPanel();
    else if (state === "open")      minimizePanel();
    else                            { state = "open"; applyState(); }
  });

  
  widget.addEventListener("mousedown", (e) => {
    dragging = true; moved = false;
    const rect = widget.getBoundingClientRect();
    dOffX = e.clientX - rect.left; dOffY = e.clientY - rect.top;
    widget.style.right = "auto"; widget.style.bottom = "auto";
    widget.style.left  = rect.left + "px"; widget.style.top = rect.top + "px";
    iframePointers(false); e.preventDefault();
  });

  widget.addEventListener("touchstart", (e) => {
    dragging = true; moved = false;
    const t = e.touches[0]; const rect = widget.getBoundingClientRect();
    dOffX = t.clientX - rect.left; dOffY = t.clientY - rect.top;
    widget.style.right = "auto"; widget.style.bottom = "auto";
    widget.style.left  = rect.left + "px"; widget.style.top = rect.top + "px";
    iframePointers(false);
  }, { passive: true });

  
  resizeHandle?.addEventListener("mousedown", (e) => {
    if (isFullscreen) return;
    e.preventDefault(); e.stopPropagation();
    resizing = true; rStartX = e.clientX; rStartY = e.clientY;
    rStartW = panel.offsetWidth; rStartH = panel.offsetHeight;
    iframePointers(false);
  });

  
  document.addEventListener("mousemove", (e) => {
    if (dragging) {
      moved = true;
      const x = Math.max(0, Math.min(e.clientX - dOffX, window.innerWidth  - widget.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - dOffY, window.innerHeight - widget.offsetHeight));
      widget.style.left = x + "px"; widget.style.top = y + "px";
    }
    if (resizing) {
      const newW = Math.max(260, Math.min(rStartW + (e.clientX - rStartX), window.innerWidth  * 0.9));
      const newH = Math.max(320, Math.min(rStartH + (e.clientY - rStartY), window.innerHeight * 0.85));
      panel.style.width = newW + "px"; panel.style.height = newH + "px";
    }
  });

  document.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    moved = true;
    const t = e.touches[0];
    const x = Math.max(0, Math.min(t.clientX - dOffX, window.innerWidth  - widget.offsetWidth));
    const y = Math.max(0, Math.min(t.clientY - dOffY, window.innerHeight - widget.offsetHeight));
    widget.style.left = x + "px"; widget.style.top = y + "px";
  }, { passive: true });

  document.addEventListener("mouseup", () => {
    if (dragging || resizing) iframePointers(true);
    if (dragging) { dragging = false; setTimeout(() => { moved = false; }, 0); }
    if (resizing) resizing = false;
  });

  document.addEventListener("touchend", () => {
    if (dragging) iframePointers(true);
    dragging = false; setTimeout(() => { moved = false; }, 0);
  });

  panel.addEventListener("wheel", (e) => { e.stopPropagation(); }, { passive: true });
})();