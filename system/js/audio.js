(function () {
  // Read persisted state; default to unmuted
  let muted = localStorage.getItem('ws_muted') === 'true';

  function applyMute() {
    document.querySelectorAll('audio, video').forEach(function (el) {
      el.muted = muted;
    });
  }

  // Public API — called by the inline toggle in index.html
  window.WS_Audio = {
    setMuted: function (value) {
      muted = !!value;
      applyMute();
    },
    isMuted: function () {
      return muted;
    }
  };

  // Apply saved state to any media already in the DOM
  document.addEventListener('DOMContentLoaded', applyMute);

  // Apply to any media injected later (e.g. iframes, dynamic content)
  var observer = new MutationObserver(applyMute);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();