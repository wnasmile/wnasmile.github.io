/* ============================================================
   profile.js — Profile picture & nickname
   Load ORDER: 4th (depends on: utils.js)
   ============================================================ */

"use strict";

const PROFILE_IMAGES = [
  "bleh", "catcher", "clown", "clowninabox", "dream", "eye", "eyes",
  "glitched", "me", "purpleu", "sleeppy", "smile", "starry", "starwalk", "yum",
].map(n =>
  `https://cdn.jsdelivr.net/gh/mcmattyobriore/yogurtyooo.github.io@main/system/images/profile/${n}.${n === "smile" ? "png" : "jpeg"}`
);

window.addEventListener("DOMContentLoaded", () => {
  // Profile picture — prefer saved, fall back to random from the CDN set.
  const pfpEl = document.getElementById("pfp");
  if (pfpEl) {
    pfpEl.src = localStorage.getItem("profilePic")
      || PROFILE_IMAGES[Math.floor(Math.random() * PROFILE_IMAGES.length)];
  }

  // Nickname — only update if a value was saved.
  const dashNick  = document.getElementById("dashNickname");
  const savedName = localStorage.getItem("nickname");
  if (dashNick && savedName) dashNick.textContent = savedName;
});
