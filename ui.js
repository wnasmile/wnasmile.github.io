/* ============================================================
   ui.js — UI controls: sort toggle, keyboard shortcuts,
           update popup, dashboard, scroll-to-top,
           download button, welcome modal
   Load ORDER: 5th (depends on: utils.js, theme.js)
   ============================================================ */

"use strict";

/* ---------- Sort Mode Toggle ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const sheetOrderBtn   = document.getElementById("sheetOrderBtn");
  const alphabeticalBtn = document.getElementById("alphabeticalBtn");
  if (!sheetOrderBtn || !alphabeticalBtn) return;

  const updateButtons = (mode) => {
    sheetOrderBtn.classList.toggle("active",   mode === "sheet");
    alphabeticalBtn.classList.toggle("active", mode === "alphabetical");
  };

  updateButtons(getSortMode());

  const setSortMode = (mode) => {
    localStorage.setItem("sortMode", mode);
    updateButtons(mode);
    showToast(`Sort mode: ${mode === "sheet" ? "Sheet Order" : "Alphabetical"}`);
    document.dispatchEvent(new CustomEvent("sortModeChanged", { detail: mode }));
  };

  sheetOrderBtn.addEventListener("click",   () => setSortMode("sheet"));
  alphabeticalBtn.addEventListener("click", () => setSortMode("alphabetical"));
});

document.addEventListener("sortModeChanged", () => {
  if (window.assetsData && typeof window.refreshCards === "function") window.refreshCards();
});

/* ---------- Keyboard Shortcuts (Escape, R, T) ---------- */

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  // ESC — panic redirect
  if (e.key === "Escape") {
    const panicURL = localStorage.getItem("panicURL");
    if (panicURL) window.location.href = panicURL;
    return;
  }

  // R — reload assets
  if (e.key === "r" || e.key === "R") {
    if (typeof window.reloadAssets !== "function") return;
    const now = Date.now();
    if (window._reloading) {
      showToast("Already refreshing, idoit...");
    } else if (now < (window._reloadCooldownUntil || 0)) {
      showToast(`Cooldown: ${Math.ceil((window._reloadCooldownUntil - now) / 1000)}s remaining`);
    } else {
      showToast("Re-fetching assets...");
      const toHide = window._allCards?.length
        ? window._allCards
        : [...document.querySelectorAll(".asset-card")];
      toHide.forEach(c => { c.style.display = "none"; });
      window.reloadAssets()
        .then(ok => { if (ok) showToast("Assets reloaded!"); })
        .catch(() => showToast("Reload failed — check connection."));
    }
    return;
  }

  // T — cycle incognito mode: off → about → blob → off
  if (e.key === "t" || e.key === "T") {
    const modes   = ["off", "about", "blob"];
    const current = localStorage.getItem("incognitoMode") || "off";
    const next    = modes[(modes.indexOf(current) + 1) % modes.length];
    localStorage.setItem("incognitoMode", next);
    const indicator = document.getElementById("incognitoIndicator");
    const labels = { off: null, about: "about:blank mode", blob: "blob:null mode" };
    const msgs   = {
      off:   "Normal mode — standard new tab",
      about: "Incognito: about:blank mode",
      blob:  "Incognito: blob:null mode — switched mode: blobNull system",
    };
    showToast(msgs[next]);
    if (indicator) {
      if (next === "off") { indicator.classList.remove("show"); }
      else { indicator.textContent = labels[next]; indicator.classList.add("show"); }
    }
  }
});

/* ---------- Update Popup + Dashboard + Scroll-to-Top ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const popup          = document.getElementById("updatePopup");
  const video          = document.getElementById("updateVideo");
  const closeBtn       = document.getElementById("closeUpdateBtn");
  const viewUpdateBtn  = document.getElementById("viewUpdateBtn");
  const viewInfoBtn    = document.getElementById("viewUpdateInfoBtn");
  const dontShowBtn    = document.getElementById("dontShowBtn");
  const dashboardMenu  = document.getElementById("dashboardMenu");
  const dashboardBtn   = document.getElementById("dashboardBtn");
  const toTopBtn       = document.getElementById("toTopBtn");
  const pfp            = document.getElementById("pfp");

  // ── Update popup ──
  function stopVideo() {
    if (!video) return;
    const src = video.src; video.src = ""; video.src = src;
  }

  function closePopup() {
    if (!popup) return;
    popup.classList.remove("show");
    sessionStorage.setItem("updatePopupClosed", "true");
    stopVideo();
  }

  if (popup) {
    closeBtn?.addEventListener("click", closePopup);
    dontShowBtn?.addEventListener("click", () => {
      const version = document.getElementById("footerVersion")
        ?.textContent?.replace("Version ", "").trim() || "v0.8";
      localStorage.setItem("dismissedUpdateVersion", version);
      closePopup();
    });
    viewUpdateBtn?.addEventListener("click", () => window.open("system/pages/updates.html", "_blank"));
    viewInfoBtn?.addEventListener("click",   () => window.open("system/pages/update-info.html", "_blank"));
  }

  // ── Dashboard toggle ──
  if (dashboardBtn && dashboardMenu) {
    dashboardMenu.style.display = "none";
    dashboardMenu.style.opacity = 0;
    dashboardMenu.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    const toggleDashboard = (e) => {
      e.stopPropagation();
      const isVisible = dashboardMenu.style.display === "block";
      if (isVisible) {
        dashboardMenu.style.opacity = 0;
        dashboardBtn.setAttribute("aria-expanded", "false");
        dashboardMenu.setAttribute("aria-hidden", "true");
        setTimeout(() => (dashboardMenu.style.display = "none"), 300);
      } else {
        dashboardMenu.style.display = "block";
        dashboardBtn.setAttribute("aria-expanded", "true");
        dashboardMenu.setAttribute("aria-hidden", "false");
        setTimeout(() => (dashboardMenu.style.opacity = 1), 10);
      }
    };

    dashboardBtn.addEventListener("click", toggleDashboard);
    document.addEventListener("click", (e) => {
      if (
        dashboardMenu.style.display === "block" &&
        !dashboardMenu.contains(e.target) &&
        e.target !== dashboardBtn
      ) toggleDashboard(e);
    });
  }

  // ── Scroll to top ──
  if (toTopBtn) {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    toTopBtn.style.position = "fixed";
    toTopBtn.style.zIndex   = "999999";

    window.addEventListener("scroll", () => {
      const y = document.body.scrollTop || document.documentElement.scrollTop;
      toTopBtn.style.display = y > 200 ? "block" : "none";
    });

    toTopBtn.addEventListener("click",    scrollToTop);
    toTopBtn.addEventListener("dblclick", scrollToTop);

    const y = document.body.scrollTop || document.documentElement.scrollTop;
    toTopBtn.style.display = y > 200 ? "block" : "none";
  }

  // ── Profile pic (secondary — primary handled in profile.js) ──
  if (pfp) {
    const saved = localStorage.getItem("profilePic");
    if (saved) pfp.src = saved;
  }
});

/* ---------- Download Button ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const dlBtn = document.getElementById("downloadBtn");
  if (!dlBtn) return;

  dlBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const html = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href     = url;
    a.download = "wnasmilev08.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
});

/* ---------- Welcome Modal ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const overlay    = document.getElementById("welcomeOverlay");
  const dismissBtn = document.getElementById("welcomeDismiss");
  const neverBtn   = document.getElementById("welcomeNeverShow");
  const indicator  = document.getElementById("incognitoIndicator");

  const savedMode = localStorage.getItem("incognitoMode") || "off";
  if (indicator && savedMode !== "off") {
    indicator.textContent = savedMode === "blob" ? "blob:null mode" : "about:blank mode";
    indicator.classList.add("show");
  }

  const neverShow        = localStorage.getItem("welcomeNeverShow");
  const shownThisSession = sessionStorage.getItem("welcomeShown");
  if (!neverShow && !shownThisSession && overlay) {
    sessionStorage.setItem("welcomeShown", "true");
    const d = sessionStorage.getItem("introPlayed") ? 300 : 9000;
    setTimeout(() => overlay.classList.add("show"), d);
  }

  const hideOverlay = () => overlay?.classList.remove("show");
  dismissBtn?.addEventListener("click", hideOverlay);
  neverBtn?.addEventListener("click", () => {
    localStorage.setItem("welcomeNeverShow", "true");
    hideOverlay();
  });
  overlay?.addEventListener("click", (e) => { if (e.target === overlay) hideOverlay(); });
});

/* ---------- Debug Theme Hotkeys (0–9) ---------- */

(() => {
  const DEBUG_THEMES = {
    "0": "root", "1": "redux", "2": "classic", "3": "light", "4": "dark",
    "5": "slackerish", "6": "graduation", "7": "flower-boy", "8": "igor", "9": "i-am-music",
  };
  const THEME_LABELS = {
    root: "Root (default)", redux: "Redux", classic: "Classic", light: "Light",
    dark: "Dark", slackerish: "Slackerish", graduation: "Graduation",
    "flower-boy": "Flower Boy", igor: "IGOR", "i-am-music": "I Am Music",
  };

  const applyDebugTheme = (key) => {
    const theme = DEBUG_THEMES[key];
    if (!theme) return;
    document.documentElement.setAttribute("theme", theme);
    window.currentTheme = theme;
    localStorage.setItem("selectedTheme", theme);
    if (typeof window.applyThemeGifs === "function") window.applyThemeGifs(theme);
    showToast(`[DEBUG] Theme → ${THEME_LABELS[theme]}`);
    console.log(`[DEBUG] Theme set to "${theme}" via key ${key}`);
  };

  document.addEventListener("keydown", e => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (DEBUG_THEMES[e.key] !== undefined) applyDebugTheme(e.key);
  });

  console.log(
    "%c[DEBUG] Theme hotkeys: 0=Root 1=Redux 2=Classic 3=Light 4=Dark 5=Slackerish 6=Graduation 7=Flower Boy 8=IGOR 9=I Am Music",
    "color:#0af;font-family:monospace"
  );
})();
