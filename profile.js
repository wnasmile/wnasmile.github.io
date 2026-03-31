/* ============================================================
   profile.js — Profile picture & nickname
   Load ORDER: 3rd (depends on: utils.js)
   ============================================================ */

"use strict";

const PROFILE_IMAGES = [
  "bleh","catcher","clown","clowninabox","dream","eye","eyes",
  "glitched","me","purpleu","sleeppy","smile","starry","starwalk","yum",
].map(n =>
  `https://cdn.jsdelivr.net/gh/mcmattyobriore/yogurtyooo.github.io@main/system/images/profile/${n}.${n === "smile" ? "png" : "jpeg"}`
);

window.addEventListener("DOMContentLoaded", () => {
  const pfpEl = document.getElementById("pfp");
  if (pfpEl) {
    const saved = localStorage.getItem("profilePic");
    pfpEl.src = saved || PROFILE_IMAGES[Math.floor(Math.random() * PROFILE_IMAGES.length)];
  }
  const dashNick = document.getElementById("dashNickname");
  const savedName = localStorage.getItem("nickname");
  if (dashNick && savedName) dashNick.textContent = savedName;
});
