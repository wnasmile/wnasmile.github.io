(function () {
  const PLAY_ICON = "play.png";
  const MUTE_ICON = "mute.png";

  let muted = false;

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".mute-btn");
    if (!btn) return;

    const img = btn.querySelector("img");
    img.src = PLAY_ICON;

    btn.addEventListener("click", () => {
      muted = !muted;
      img.src = muted ? MUTE_ICON : PLAY_ICON;

      document.querySelectorAll("audio, video").forEach(el => {
        el.muted = muted;
      });
    });
  });

  const observer = new MutationObserver(() => {
    document.querySelectorAll("audio, video").forEach(el => {
      el.muted = muted;
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();