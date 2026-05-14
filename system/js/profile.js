"use strict";

const PROFILE_IMAGES = [
  "bleh", "catcher", "clown", "clowninabox", "dream", "eye", "eyes",
  "glitched", "me", "purpleu", "sleeppy", "smile", "starry", "starwalk", "yum",
].map(n =>
  `https://cdn.jsdelivr.net/gh/mcmattyobriore/yogurtyooo.github.io@main/system/images/profile/${n}.${n === "smile" ? "png" : "jpeg"}`
);

const DEFAULT_PIC = "https://raw.githubusercontent.com/bguhm/bguhm.github.io/main/system/images/profile.png";

/* ── helpers ───────────────────────────────────────────────────── */

function loadProfile() {
  const savedPic  = localStorage.getItem("profilePic")   || DEFAULT_PIC;
  const savedName = localStorage.getItem("nickname")     || "Nickname";
  const pixelated = localStorage.getItem("pfpPixelated") === "true";

  // header pfp
  const pfpEl = document.getElementById("pfp");
  if (pfpEl) {
    pfpEl.src = savedPic;
    pfpEl.style.imageRendering = pixelated ? "pixelated" : "";
  }

  // dashboard nickname
  const dashNick = document.getElementById("dashNickname");
  if (dashNick) dashNick.textContent = savedName;

  // overlay elements (may not exist yet on first call)
  const profilePreview  = document.getElementById("profilePreview");
  const usernameDisplay = document.getElementById("profileOverlayUsername");
  const usernameInput   = document.getElementById("usernameInput");
  const pixelBtn        = document.getElementById("pixelToggleBtn");

  if (profilePreview) {
    profilePreview.src = savedPic;
    profilePreview.style.imageRendering = pixelated ? "pixelated" : "";
  }
  if (usernameDisplay) usernameDisplay.textContent = savedName;
  if (usernameInput)   usernameInput.value          = savedName;
  if (pixelBtn)        pixelBtn.textContent          = pixelated ? "🔲 Un-Pixelate" : "🟦 Pixelate";
}

function saveProfile({ pic, name, pixelated } = {}) {
  if (pic      !== undefined) localStorage.setItem("profilePic",    pic);
  if (name     !== undefined) localStorage.setItem("nickname",      name);
  if (pixelated !== undefined) localStorage.setItem("pfpPixelated", pixelated ? "true" : "false");
  loadProfile();
}

/* ── overlay open / close ──────────────────────────────────────── */

function openProfileOverlay() {
  loadProfile(); // sync latest stored values into overlay fields
  const overlay = document.getElementById("profileOverlay");
  if (overlay) overlay.classList.add("visible");
}

function closeProfileOverlay() {
  const overlay = document.getElementById("profileOverlay");
  if (overlay) overlay.classList.remove("visible");
}

/* ── DOMContentLoaded ──────────────────────────────────────────── */

window.addEventListener("DOMContentLoaded", () => {
  loadProfile();

  /* header pfp click → open overlay (detach navigation) */
  const pfpEl = document.getElementById("pfp");
  if (pfpEl) {
    pfpEl.style.cursor = "pointer";
    pfpEl.addEventListener("click", (e) => {
      e.preventDefault();
      openProfileOverlay();
    });
    // If pfp is wrapped in an <a>, kill the link
    const parent = pfpEl.parentElement;
    if (parent && parent.tagName === "A") {
      parent.removeAttribute("href");
      parent.style.cursor = "default";
      parent.style.pointerEvents = "none";
      pfpEl.style.pointerEvents = "auto";
    }
  }

  /* close button */
  const closeBtn = document.getElementById("profileOverlayClose");
  if (closeBtn) closeBtn.addEventListener("click", closeProfileOverlay);

  /* click backdrop to close */
  const overlay = document.getElementById("profileOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeProfileOverlay();
    });
  }

  /* ── cropper ── */
  let cropper          = null;
  let croppedImageData = null;

  const profilePreview = document.getElementById("profilePreview");
  const fileInput      = document.getElementById("profilePicInput");
  const cropContainer  = document.getElementById("cropContainer");
  const cropPreviewImg = document.getElementById("cropPreview");
  const cropConfirmBtn = document.getElementById("cropConfirm");
  const cropCancelBtn  = document.getElementById("cropCancel");
  const removeBtn      = document.getElementById("removePicBtn");
  const saveBtn        = document.getElementById("profileSaveBtn");
  const usernameInput  = document.getElementById("usernameInput");
  const pixelToggleBtn = document.getElementById("pixelToggleBtn");

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (cropContainer)  cropContainer.style.display  = "block";
        if (cropPreviewImg) cropPreviewImg.src            = ev.target.result;
        if (cropper) cropper.destroy();
        if (cropPreviewImg && typeof Cropper !== "undefined") {
          cropper = new Cropper(cropPreviewImg, {
            aspectRatio: 1,
            viewMode: 1,
            background: false,
            dragMode: "move",
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (cropConfirmBtn) {
    cropConfirmBtn.addEventListener("click", () => {
      if (!cropper) return;
      const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
      croppedImageData = canvas.toDataURL("image/png");
      if (profilePreview) profilePreview.src = croppedImageData;
      if (cropContainer)  cropContainer.style.display = "none";
      cropper.destroy();
      cropper = null;
    });
  }

  if (cropCancelBtn) {
    cropCancelBtn.addEventListener("click", () => {
      if (cropContainer) cropContainer.style.display = "none";
      if (cropper) { cropper.destroy(); cropper = null; }
      if (fileInput) fileInput.value = "";
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      croppedImageData = null;
      if (profilePreview) profilePreview.src = DEFAULT_PIC;
      saveProfile({ pic: DEFAULT_PIC });
    });
  }

  if (pixelToggleBtn) {
    pixelToggleBtn.addEventListener("click", () => {
      const cur = localStorage.getItem("pfpPixelated") === "true";
      saveProfile({ pixelated: !cur });
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const name    = usernameInput ? usernameInput.value.trim() : null;
      const finalPic = croppedImageData
        || (profilePreview ? profilePreview.src : null)
        || DEFAULT_PIC;
      saveProfile({
        pic:  finalPic,
        name: name || undefined,
      });
      croppedImageData = null;
      closeProfileOverlay();
    });
  }
});