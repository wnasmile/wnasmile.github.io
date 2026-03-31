/* ============================================================
   settings.js — Settings page (cloak, panic, password)
   Load ORDER: 4th (depends on: utils.js, theme.js)
   Only activates when .settings-page is present in DOM.
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".settings-page")) return;

  const webnameInput       = document.getElementById("webname");
  const webiconInput       = document.getElementById("webicon");
  const presetCloaksSelect = document.getElementById("presetCloaks");
  const panicInput         = document.getElementById("panicURL");
  const passInput          = document.getElementById("pass");

  if (webnameInput) webnameInput.value = localStorage.getItem("cloakTitle") || "";
  if (webiconInput) webiconInput.value = localStorage.getItem("cloakIcon")  || "";
  if (panicInput)   panicInput.value   = localStorage.getItem("panicURL")   || "";

  const CLOAK_PRESETS = {
    google:     { title: "Google",                            icon: "icons/google.png"     },
    drive:      { title: "My Drive - Google Drive",           icon: "icons/drive.png"      },
    classroom:  { title: "Classes",                           icon: "icons/classroom.png"  },
    newtab:     { title: "New Tab",                           icon: "icons/newtab.png"     },
    docs:       { title: "Untitled document - Google Docs",   icon: "icons/docs.png"       },
    schoology:  { title: "Schoology",                         icon: "icons/schoology.png"  },
  };

  presetCloaksSelect?.addEventListener("change", () => {
    const preset = CLOAK_PRESETS[presetCloaksSelect.value];
    if (!preset) return;
    if (webnameInput) webnameInput.value = preset.title;
    if (webiconInput) webiconInput.value = preset.icon;
  });

  window.setCloakCookie = function (e) {
    e?.preventDefault();
    if (webnameInput) localStorage.setItem("cloakTitle", webnameInput.value.trim());
    if (webiconInput) localStorage.setItem("cloakIcon",  webiconInput.value.trim());
    if (webnameInput?.value) document.title = webnameInput.value;
    if (webiconInput?.value) setFavicon(webiconInput.value);
    showToast("Tab cloak set!");
  };

  window.clearCloak = function () {
    localStorage.removeItem("cloakTitle");
    localStorage.removeItem("cloakIcon");
    document.title = "WannaSmile";
    setFavicon("https://raw.githubusercontent.com/mcmattyobriore/yogurtyooo.github.io/main/system/images/favicons/logo.png");
    if (webnameInput) webnameInput.value = "";
    if (webiconInput) webiconInput.value = "";
    showToast("Cloak cleared!");
  };

  window.setPanicMode = function (e) {
    e?.preventDefault();
    if (panicInput?.value.trim()) {
      localStorage.setItem("panicURL", panicInput.value.trim());
      showToast("Panic URL saved!");
    }
  };

  window.setPassword = function (e) {
    e?.preventDefault();
    const pw = passInput?.value.trim();
    if (!pw) return showToast("Enter a password first.");
    localStorage.setItem("accessPassword", pw);
    showToast("Access password set!");
  };

  window.delPassword = function () {
    localStorage.removeItem("accessPassword");
    if (passInput) passInput.value = "";
    showToast("Password cleared!");
  };
});
