/* ============================================================
   ui.js — UI controls: sort toggle, keyboard shortcuts,
           update popup, dashboard, scroll-to-top,
           download button, welcome modal, debug theme hotkeys
   Load ORDER: 6th (depends on: utils.js, themify.js)
   ============================================================ */

"use strict";

/* ---------- Theme map (shared with commands.js debug hotkeys) ---------- */
// Keys 0–9 mapping:
//   0=redux(root/default)  1=classic   2=selenite   3=slackerish  4=gn-math
//   5=graduation           6=igor      7=wolf        8=cherrybomb  9=i-am-music
window.THEME_MAP = {
  // Numeric hotkeys
  "0": "redux",        "1": "classic",      "2": "selenite",    "3": "slackerish",
  "4": "gn-math",      "5": "graduation",   "6": "igor",        "7": "wolf",
  "8": "cherrybomb",   "9": "i-am-music",
  // R resets to default (redux)
  "R": "redux",
  // Name aliases used by set:theme() in commands.js
  wolf: "wolf",             cherrybomb: "cherrybomb",  igor: "igor",
  "gn-math": "gn-math",    selenite: "selenite",       slackerish: "slackerish",
  classic: "classic",       redux: "redux",             graduation: "graduation",
  "i-am-music": "i-am-music",
};

const THEME_LABELS = {
  wolf: "Wolf",           cherrybomb: "Cherry Bomb",  igor: "IGOR",
  "gn-math": "GN Math",  selenite: "Selenite",        slackerish: "Slackerish",
  classic: "Classic",     redux: "Redux",              graduation: "Graduation",
  "i-am-music": "I Am Music",
};

/* ---------- Internal helper: apply a theme by key/name ---------- */
function _applyTheme(keyOrName) {
  // Resolve through THEME_MAP first (handles numeric keys), then validate.
  const mapped = window.THEME_MAP[keyOrName] || keyOrName;
  // _resolveTheme is defined in themify.js (loaded before ui.js).
  const theme  = (typeof _resolveTheme === "function") ? _resolveTheme(mapped) : mapped;
  document.documentElement.setAttribute("theme", theme);
  window.currentTheme = theme;
  localStorage.setItem("selectedTheme", theme);

  // Re-apply any saved custom CSS vars, normalizing bg values so both
  // #hex colours and url("...") image paths are handled correctly.
  if (theme === "custom") {
    try {
      const vars = JSON.parse(localStorage.getItem("customTheme") || "{}");
      if (typeof _applyCustomVars === "function") {
        _applyCustomVars(vars);
      } else {
        // Fallback if themify.js helper isn't available for some reason.
        for (const [k, v] of Object.entries(vars)) {
          document.documentElement.style.setProperty(k, v);
        }
      }
    } catch (_) {}
  } else {
    // Clear any inline custom vars so the new theme's CSS takes over cleanly.
    document.documentElement.style.cssText = "";
  }

  // Sync all live gif elements to the new theme.
  if (typeof window.applyThemeGifs === "function") window.applyThemeGifs(theme);
  // Re-apply loader gif state so it never shows the wrong theme's gif.
  if (typeof window.setLoaderState === "function") {
    const loaderImg = document.querySelector("#containerLoader img");
    if (loaderImg) {
      const currentState = loaderImg.dataset.gifState || "loading";
      window.setLoaderState(currentState);
    }
  }
  return theme;
}

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

/* ---------- Keyboard Shortcuts (Escape, R, T, 0–9) ---------- */

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

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
    const labels    = { off: null, about: "about:blank mode", blob: "blob:null mode" };
    const msgs      = {
      off:   "Normal mode — standard new tab",
      about: "Incognito: about:blank mode",
      blob:  "Incognito: blob:null mode — switched mode: blobNull system",
    };
    showToast(msgs[next]);
    if (indicator) {
      if (next === "off") { indicator.classList.remove("show"); }
      else { indicator.textContent = labels[next]; indicator.classList.add("show"); }
    }
    return;
  }

  // 0–9 — debug theme hotkeys (THEME_MAP defined above)
  if (window.THEME_MAP[e.key] !== undefined) {
    const theme = _applyTheme(e.key);
    showToast(`[DEBUG] Theme → ${THEME_LABELS[theme] || theme}`);
    console.log(`[DEBUG] Theme set to "${theme}" via key ${e.key}`);
  }
});

console.log(
  "%c[DEBUG] Theme hotkeys: 0=Redux(root) 1=Classic 2=Selenite 3=Slackerish 4=GN Math 5=Graduation 6=IGOR 7=Wolf 8=Cherry Bomb 9=I Am Music  |  R=Reset to Redux",
  "color:#0af;font-family:monospace"
);

/* ---------- Update Popup + Dashboard + Scroll-to-Top ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const popup         = document.getElementById("updatePopup");
  const video         = document.getElementById("updateVideo");
  const closeBtn      = document.getElementById("closeUpdateBtn");
  const viewUpdateBtn = document.getElementById("viewUpdateBtn");
  const viewInfoBtn   = document.getElementById("viewUpdateInfoBtn");
  const dontShowBtn   = document.getElementById("dontShowBtn");
  const dashboardMenu = document.getElementById("dashboardMenu");
  const dashboardBtn  = document.getElementById("dashboardBtn");
  const toTopBtn      = document.getElementById("toTopBtn");
  const pfp           = document.getElementById("pfp");

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
    viewUpdateBtn?.addEventListener("click", () => window.open("system/pages/updates.html",     "_blank"));
    viewInfoBtn?.addEventListener("click",   () => window.open("system/pages/update-info.html", "_blank"));
  }

  // ── Dashboard toggle ──
  if (dashboardBtn && dashboardMenu) {
    dashboardMenu.style.display    = "none";
    dashboardMenu.style.opacity    = "0";
    dashboardMenu.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    const toggleDashboard = (e) => {
      e.stopPropagation();
      const isVisible = dashboardMenu.style.display === "block";
      if (isVisible) {
        dashboardMenu.style.opacity = "0";
        dashboardBtn.setAttribute("aria-expanded",  "false");
        dashboardMenu.setAttribute("aria-hidden",   "true");
        setTimeout(() => (dashboardMenu.style.display = "none"), 300);
      } else {
        dashboardMenu.style.display = "block";
        dashboardBtn.setAttribute("aria-expanded",  "true");
        dashboardMenu.setAttribute("aria-hidden",   "false");
        setTimeout(() => (dashboardMenu.style.opacity = "1"), 10);
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
    toTopBtn.style.position = "fixed";
    toTopBtn.style.zIndex   = "999999";

    const updateVisibility = () => {
      const y = document.body.scrollTop || document.documentElement.scrollTop;
      toTopBtn.style.display = y > 200 ? "block" : "none";
    };

    window.addEventListener("scroll", updateVisibility, { passive: true });
    toTopBtn.addEventListener("click",    () => window.scrollTo({ top: 0, behavior: "smooth" }));
    toTopBtn.addEventListener("dblclick", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    updateVisibility();
  }

  // ── Profile pic (secondary — primary is profile.js) ──
  if (pfp) {
    const saved = localStorage.getItem("profilePic");
    if (saved && pfp.src !== saved) pfp.src = saved;
  }
});

/* ---------- Download Button ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const dlBtn = document.getElementById("downloadBtn");
  if (!dlBtn) return;

  dlBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const blob = new Blob(
      ["<!DOCTYPE html>\n" + document.documentElement.outerHTML],
      { type: "text/html;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement("a"), { href: url, download: "wnasmilev08.html" });
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

  // Restore incognito indicator state.
  const savedMode = localStorage.getItem("incognitoMode") || "off";
  if (indicator && savedMode !== "off") {
    indicator.textContent = savedMode === "blob" ? "blob:null mode" : "about:blank mode";
    indicator.classList.add("show");
  }

  // Show welcome overlay unless suppressed.
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
