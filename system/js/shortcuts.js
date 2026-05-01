document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("openShortCuts");
  if (!trigger) return;

  const overlay = document.createElement("div");
  overlay.className = "shortcuts-overlay";
  overlay.innerHTML = `
    <div class="shortcuts-panel">
      <div class="shortcuts-header"><h2>Shortcuts</h2></div>
      <div class="shortcut"><span class="key">ESC</span><span class="label">Panic — redirect to saved panic URL</span></div>
      <div class="shortcut"><span class="key">I</span><span class="label">Toggle tab cloak on / off</span></div>
      <div class="shortcut"><span class="key">T</span><span class="label">Cycle incognito mode (off → about → blob)</span></div>
      <div class="shortcut"><span class="key">R</span><span class="label">Refetch assets</span></div>
      <div class="shortcut"><span class="key">0</span><span class="label">Redux theme</span></div>
      <div class="shortcut"><span class="key">1</span><span class="label">Classic theme</span></div>
      <div class="shortcut"><span class="key">2</span><span class="label">Selenite theme</span></div>
      <div class="shortcut"><span class="key">3</span><span class="label">Slackerish theme</span></div>
      <div class="shortcut"><span class="key">4</span><span class="label">GN Math theme</span></div>
      <div class="shortcut"><span class="key">5</span><span class="label">Graduation theme</span></div>
      <div class="shortcut"><span class="key">6</span><span class="label">IGOR theme</span></div>
      <div class="shortcut"><span class="key">7</span><span class="label">Wolf theme</span></div>
      <div class="shortcut"><span class="key">8</span><span class="label">Cherrybomb theme</span></div>
      <div class="shortcut"><span class="key">9</span><span class="label">I Am Music theme</span></div>
    </div>
  `;
  document.body.appendChild(overlay);

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    overlay.classList.add("active");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) {
      overlay.classList.remove("active");
      e.stopImmediatePropagation();
    }
  }, true);
});
