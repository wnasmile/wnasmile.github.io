/* ============================================================
   WannaSmile — commands.js  (v0.8.1)
   Secret dev console. Type "debugplz!" anywhere to open.

   Depends on app.js being loaded first:
     window.config            — sheetUrl, devBuildUrl
     window._activeFetchUrl   — swapped by !fetch commands
     window.reloadAssets()    — triggers a live re-fetch
   ============================================================ */

"use strict";

/* ============================================================
   SECRET WORD DETECTOR
   ============================================================ */

let devConsole  = null;
let typedBuffer = "";
const SECRET_WORD = "debugplz!";

document.addEventListener("keydown", (e) => {
  // Ignore modifier combos and multi-char keys (Shift, Enter, etc.)
  if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

  typedBuffer += e.key.toLowerCase();
  if (typedBuffer.length > SECRET_WORD.length) {
    typedBuffer = typedBuffer.slice(-SECRET_WORD.length);
  }

  if (typedBuffer === SECRET_WORD && !devConsole) {
    spawnDevConsole();
    typedBuffer = "";
  }
});

/* ============================================================
   CONSOLE SPAWN
   ============================================================ */

function spawnDevConsole() {
  devConsole = document.createElement("div");
  devConsole.id = "devConsole";
  Object.assign(devConsole.style, {
    position:    "fixed",
    bottom:      "10px",
    left:        "50%",
    transform:   "translateX(-50%)",
    background:  "rgba(0,0,0,0.88)",
    padding:     "10px 14px",
    borderRadius:"10px",
    zIndex:      "999999",
    display:     "flex",
    flexDirection:"column",
    gap:         "6px",
    minWidth:    "340px",
    boxShadow:   "0 0 18px rgba(0,255,0,0.18)",
  });

  // Label
  const label = document.createElement("div");
  label.textContent = "⌨ WannaSmile Dev Console";
  Object.assign(label.style, {
    color: "lime", fontFamily: "monospace", fontSize: "11px",
    opacity: "0.6", userSelect: "none",
  });

  // Output line
  const output = document.createElement("div");
  output.id = "devConsoleOutput";
  Object.assign(output.style, {
    color: "#aaffaa", fontFamily: "monospace", fontSize: "12px",
    minHeight: "16px", wordBreak: "break-all",
  });

  // Input
  const input = document.createElement("input");
  input.type        = "text";
  input.placeholder = "Enter command… (:help: for list)";
  input.autocomplete = "off";
  input.spellcheck  = false;
  Object.assign(input.style, {
    width:      "100%",
    padding:    "6px 8px",
    fontFamily: "monospace",
    fontSize:   "13px",
    color:      "lime",
    background: "#000",
    border:     "1px solid lime",
    borderRadius:"4px",
    outline:    "none",
    boxSizing:  "border-box",
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      if (cmd) handleCommand(cmd, output);
      input.value = "";
    }
    if (e.key === "Escape") closeConsole();
    e.stopPropagation(); // prevent Escape triggering panic redirect
  });

  devConsole.appendChild(label);
  devConsole.appendChild(output);
  devConsole.appendChild(input);
  document.body.appendChild(devConsole);
  wireTabComplete(input, output);
  input.focus();

  devLog(output, "Console ready. Type :help: for commands.");
}

function closeConsole() {
  clearSuggestions();
  if (devConsole) { devConsole.remove(); devConsole = null; }
}

function devLog(output, msg, color = "#aaffaa") {
  if (!output) output = document.getElementById("devConsoleOutput");
  if (output) { output.style.color = color; output.textContent = msg; }
  console.log("[DevConsole]", msg);
}

/* ============================================================
   COMMAND REGISTRY
   Flat list of every real command. Used by the fuzzy matcher
   and Tab autocomplete. Template tokens like <text> are stripped
   during matching so partial real input still resolves.
   ============================================================ */

const COMMAND_REGISTRY = [
  // utility
  { cmd: ":help:",          desc: "Show the help panel"                        },
  { cmd: "commands",        desc: "Show the help panel (alias)"                },
  { cmd: ":clear:",         desc: "Remove all overlays"                        },
  { cmd: ":clear-all:",     desc: "Remove overlays + close console"            },
  { cmd: "close",           desc: "Close the console"                          },
  // fetch
  { cmd: "!fetch:devBuild", desc: "Switch to devBuildUrl and reload"           },
  { cmd: "!fetch:refresh",  desc: "Re-fetch with the current active URL"       },
  { cmd: "!fetch:failTest", desc: "Force crash/fail state, hide pages"         },
  { cmd: "!fetch:R",        desc: "Reset to canonical sheetUrl and reload"     },
  // theme — !themifyMe
  { cmd: "!themifyMe0",     desc: "Theme → Root"                               },
  { cmd: "!themifyMe1",     desc: "Theme → Redux"                              },
  { cmd: "!themifyMe2",     desc: "Theme → Classic"                            },
  { cmd: "!themifyMe3",     desc: "Theme → Light"                              },
  { cmd: "!themifyMe4",     desc: "Theme → Dark"                               },
  { cmd: "!themifyMe5",     desc: "Theme → Slackerish"                         },
  { cmd: "!themifyMe6",     desc: "Theme → Graduation"                         },
  { cmd: "!themifyMe7",     desc: "Theme → Flower Boy"                         },
  { cmd: "!themifyMe8",     desc: "Theme → IGOR"                               },
  { cmd: "!themifyMe9",     desc: "Theme → I Am Music"                         },
  { cmd: "!themifyMeR",     desc: "Theme → Reset to root"                      },
  { cmd: "set:theme()",     desc: "Set theme by name or number"                },
  // widgets
  { cmd: "#install:widget/buddy!",           desc: "Mark buddy! as installed"          },
  { cmd: "#install:widget/soundscapev1",      desc: "Mark soundscapev1 as installed"   },
  { cmd: "!appy.widget-apply:buddy!",         desc: "Enable buddy! on load"            },
  { cmd: "!appy.widget-apply:soundscapev1",   desc: "Enable soundscapev1 on load"      },
  { cmd: "!appy.widget-rem:buddy!",           desc: "Disable buddy! (keep installed)"  },
  { cmd: "!appy.widget-rem:soundscapev1",     desc: "Disable soundscapev1 (keep installed)" },
  { cmd: "!appy.instalr-UNINST;buddy!",       desc: "Fully uninstall buddy!"           },
  { cmd: "!appy.instalr-UNINST;soundscapev1", desc: "Fully uninstall soundscapev1"    },
  // marquee / gif
  { cmd: "marquee",                           desc: "Start rotating dev marquee"       },
  { cmd: "marquee: <text>;",                  desc: "Show a custom one-liner marquee"  },
  { cmd: "gif",                               desc: "Spawn a demo gif"                 },
  { cmd: "gif-<file>:<n>,set-position:random;", desc: "Spawn N gifs, optionally random" },
];

/* ============================================================
   FUZZY / SIMILARITY ENGINE
   Combines three signals, highest score wins:
     1. Prefix match     — typed string is a prefix of the command
     2. Substring match  — typed string appears anywhere in command
     3. Levenshtein      — edit distance on the stripped token
   Returns top-N matches sorted by score desc, score > 0 only.
   ============================================================ */

function _levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Strip template tokens (<text>, <n>, <file>) so matching works on real input.
function _stripTokens(s) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function findSuggestions(typed, maxResults = 5) {
  if (!typed) return [];
  const q = typed.toLowerCase().trim();

  const scored = COMMAND_REGISTRY.map(({ cmd, desc }) => {
    const clean = _stripTokens(cmd);
    let score = 0;

    if (clean === q)              score = 100;                            // exact
    else if (clean.startsWith(q)) score = 80 - (clean.length - q.length); // prefix
    else if (clean.includes(q))   score = 55 - (clean.length - q.length); // substring

    if (score === 0) {
      // Levenshtein on shortest comparable window
      const dist = _levenshtein(q, clean.slice(0, Math.max(q.length, 3)));
      const maxDist = Math.max(3, Math.floor(q.length * 0.55));
      if (dist <= maxDist) score = 40 - dist * 8;
    }

    return { cmd, desc, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/* ============================================================
   SUGGESTION DROPDOWN
   Appears above the console input when a command is unknown.
   Clicking a suggestion copies it into the input.
   ============================================================ */

let _suggestionBox = null;

function showSuggestions(suggestions, inputEl, output) {
  clearSuggestions();
  if (!suggestions.length || !devConsole) return;

  _suggestionBox = document.createElement("div");
  _suggestionBox.id = "devSuggestions";
  Object.assign(_suggestionBox.style, {
    position:     "absolute",
    bottom:       "100%",
    left:         "0",
    right:        "0",
    marginBottom: "6px",
    background:   "#0d0d0d",
    border:       "1px solid #2a2a2a",
    borderRadius: "8px",
    overflow:     "hidden",
    boxShadow:    "0 -4px 20px rgba(0,0,0,0.6)",
    fontFamily:   "monospace",
    fontSize:     "12px",
    zIndex:       "1",
  });

  // Header
  const hdr = document.createElement("div");
  hdr.textContent = `did you mean…  (${suggestions.length} suggestion${suggestions.length > 1 ? "s" : ""})`;
  Object.assign(hdr.style, {
    padding:    "5px 10px",
    fontSize:   "10px",
    color:      "#555",
    borderBottom:"1px solid #1a1a1a",
    userSelect: "none",
  });
  _suggestionBox.appendChild(hdr);

  suggestions.forEach(({ cmd, desc }, i) => {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display:    "flex",
      gap:        "10px",
      padding:    "6px 10px",
      cursor:     "pointer",
      transition: "background 0.1s",
      alignItems: "baseline",
      borderBottom: i < suggestions.length - 1 ? "1px solid #151515" : "none",
    });

    row.addEventListener("mouseenter", () => { row.style.background = "#1a1a1a"; });
    row.addEventListener("mouseleave", () => { row.style.background = "transparent"; });

    row.addEventListener("click", () => {
      // Populate input, clear suggestions, refocus
      inputEl.value = _stripTokens(cmd) === cmd ? cmd : cmd.replace(/<[^>]+>/g, "");
      clearSuggestions();
      inputEl.focus();
      devLog(output, `Suggestion applied — press Enter to run.`, "#ffcc44");
    });

    // Keyboard number shortcut hint (1-5)
    const num = document.createElement("span");
    num.textContent = `[${i + 1}]`;
    Object.assign(num.style, { color: "#333", minWidth: "24px", flexShrink: "0" });

    const cmdEl = document.createElement("span");
    cmdEl.textContent = cmd;
    Object.assign(cmdEl.style, {
      color:      "#1fff8a",
      minWidth:   "200px",
      flexShrink: "0",
    });

    const descEl = document.createElement("span");
    descEl.textContent = `→  ${desc}`;
    Object.assign(descEl.style, { color: "#555" });

    row.appendChild(num);
    row.appendChild(cmdEl);
    row.appendChild(descEl);
    _suggestionBox.appendChild(row);
  });

  // Make devConsole the positioning parent
  devConsole.style.position = "fixed"; // already fixed, ensure relative context
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";

  // Re-parent: move the existing children into wrapper, then append suggestionBox
  // Actually just insert the suggestionBox before the input in devConsole.
  inputEl.insertAdjacentElement("beforebegin", _suggestionBox);
}

function clearSuggestions() {
  if (_suggestionBox) { _suggestionBox.remove(); _suggestionBox = null; }
}

/* ============================================================
   TAB AUTOCOMPLETE
   Wired into the input keydown — completes to the top suggestion.
   Number keys 1-5 while suggestions are visible pick that row.
   ============================================================ */

function wireTabComplete(inputEl, output) {
  inputEl.addEventListener("keydown", (e) => {
    const suggestions = _suggestionBox
      ? [..._suggestionBox.querySelectorAll("div[style*='cursor: pointer']")]
      : [];

    // Tab — apply top suggestion
    if (e.key === "Tab") {
      e.preventDefault();
      if (_suggestionBox) {
        const first = _suggestionBox.querySelector("div[style*='cursor']");
        if (first) first.click();
      } else {
        // No open box — try to autocomplete from current input
        const results = findSuggestions(inputEl.value, 1);
        if (results.length) {
          inputEl.value = results[0].cmd.replace(/<[^>]+>/g, "");
          clearSuggestions();
          devLog(output, `Autocompleted → ${results[0].cmd}`, "#ffcc44");
        }
      }
      return;
    }

    // Number keys 1-5 — pick that suggestion row
    if (_suggestionBox && e.key >= "1" && e.key <= "5" && !e.ctrlKey && !e.metaKey) {
      const idx = parseInt(e.key) - 1;
      const rows = [..._suggestionBox.querySelectorAll("div + div")]; // skip header
      const target = rows[idx];
      if (target) { e.preventDefault(); target.click(); }
    }
  });

  // Live: show inline suggestions as the user types (only for unknown/partial input)
  inputEl.addEventListener("input", () => {
    const val = inputEl.value.trim();
    if (!val) { clearSuggestions(); return; }

    // Don't show while typing a known prefix that will execute fine
    const isKnownPrefix = COMMAND_REGISTRY.some(({ cmd }) =>
      _stripTokens(cmd).startsWith(val.toLowerCase())
    );
    if (isKnownPrefix && val.length >= 3) {
      // Show as "completing…" style — top 3 prefix matches only
      const results = findSuggestions(val, 3).filter(r => _stripTokens(r.cmd).startsWith(val.toLowerCase()));
      if (results.length > 1) showSuggestions(results, inputEl, output);
      else clearSuggestions();
    } else {
      clearSuggestions();
    }
  });
}

/* ============================================================
   COMMAND ROUTER
   ============================================================ */

function handleCommand(raw, output) {
  const input = raw.trim();
  clearSuggestions(); // always dismiss on Enter

  /* ── HELP ── */
  if (input === ":help:" || input === "commands") {
    showHelpPanel();
    devLog(output, "Opened help panel.");
    return;
  }

  /* ── CLEAR ── */
  if (input === ":clear:") {
    document.querySelectorAll(".overlay").forEach(el => el.remove());
    devLog(output, "Overlays cleared.");
    return;
  }
  if (input === ":clear-all:") {
    document.querySelectorAll(".overlay").forEach(el => el.remove());
    closeConsole();
    return;
  }

  /* ── CLOSE ── */
  if (input === "close") { closeConsole(); return; }

  /* ── FETCH COMMANDS ── */
  if (input.startsWith("!fetch:")) {
    handleFetch(input.slice(7).trim(), output);
    return;
  }

  /* ── THEME COMMANDS ── */
  if (/^!themifyMe[0-9R]$/.test(input)) {
    const key = input.slice(-1);
    handleThemify(key, output);
    return;
  }
  if (input.startsWith("set:theme")) {
    const match = input.match(/\(([^)]+)\)/);
    const val   = match ? match[1].trim().toLowerCase() : null;
    if (!val) { devLog(output, "Usage: set:theme(name or 0-9)", "#ffaa00"); return; }
    handleThemify(val, output);
    return;
  }

  /* ── WIDGET COMMANDS ── */
  if (input.startsWith("#install:widget/")) {
    handleWidgetInstall(input.slice(16), output);
    return;
  }
  if (input.startsWith("!appy.widget-apply:")) {
    handleWidgetApply(input.slice(19), true, output);
    return;
  }
  if (input.startsWith("!appy.widget-rem:")) {
    handleWidgetApply(input.slice(17), false, output);
    return;
  }
  if (input.startsWith("!appy.instalr-UNINST;")) {
    handleWidgetUninstall(input.slice(21), output);
    return;
  }

  /* ── MARQUEE ── */
  if (input === "marquee") { startCommandMarquee(); devLog(output, "Marquee started."); return; }
  if (input.startsWith("marquee:")) {
    const text = input.slice(8).replace(/;$/, "").trim();
    showMarquee(text);
    devLog(output, `Marquee: "${text}"`);
    return;
  }

  /* ── GIF ── */
  if (input === "gif") {
    showGif("https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif");
    devLog(output, "Demo gif spawned.");
    return;
  }
  if (input.startsWith("gif-")) {
    const [gifPart, settingsPart] = input.split(":");
    const filename = gifPart.replace("gif-", "").trim();
    const settings = settingsPart ? settingsPart.replace(/;$/, "").split(",") : [];
    let count = 1, randomPos = false;
    settings.forEach(s => {
      if (s.includes("set-position") && s.split(":")[1]?.trim() === "random") randomPos = true;
      else if (!isNaN(parseInt(s))) count = parseInt(s);
    });
    for (let i = 0; i < count; i++) showGif(filename, randomPos);
    devLog(output, `Spawned ${count} gif(s): ${filename}`);
    return;
  }

  // Unknown — run fuzzy match and surface suggestions
  const suggestions = findSuggestions(input);
  const inputEl = devConsole?.querySelector("input");

  if (suggestions.length && inputEl) {
    devLog(output,
      `Unknown: "${input}" — ${suggestions.length} suggestion${suggestions.length > 1 ? "s" : ""} ↑  (Tab or [1–5] to apply)`,
      "#ff9944"
    );
    showSuggestions(suggestions, inputEl, output);
  } else {
    devLog(output, `Unknown command: "${input}" — try :help:`, "#ff6666");
  }
  console.warn("[DevConsole] Unknown command:", input);
}

/* ============================================================
   !fetch HANDLERS
   ============================================================ */

function handleFetch(sub, output) {
  const cfg = window.config;
  if (!cfg) { devLog(output, "window.config not ready yet.", "#ff6666"); return; }

  switch (sub) {

    /* Switch to devBuildUrl and reload */
    case "devBuild": {
      if (!cfg.devBuildUrl) {
        devLog(output, "devBuildUrl not set in config.", "#ff6666");
        return;
      }
      window._activeFetchUrl = cfg.devBuildUrl;
      devLog(output, "Switched to devBuildUrl. Reloading…", "#ffff00");
      _triggerReload(output);
      break;
    }

    /* Re-fetch with whatever URL is currently active */
    case "refresh": {
      const active = window._activeFetchUrl || cfg.sheetUrl;
      devLog(output, `Refreshing from: ${active.slice(0, 60)}…`, "#ffff00");
      _triggerReload(output);
      break;
    }

    /* Force the crash/fail state — hides pages, shows crash gif */
    case "failTest": {
      devLog(output, "Forcing fetch fail state…", "#ff9900");
      // Hide all cards so the crash state is unobstructed
      document.querySelectorAll(".asset-card").forEach(c => { c.style.display = "none"; });
      // Temporarily swap to a guaranteed-dead URL, reload, then restore
      window._activeFetchUrl = "https://0.0.0.0/force-fail";
      window._failTestActive = true;
      _triggerReload(output);
      break;
    }

    /* Reset to canonical sheetUrl and reload */
    case "R": {
      window._activeFetchUrl = cfg.sheetUrl;
      window._failTestActive = false;
      devLog(output, "Reset to sheetUrl. Reloading…", "#00ffaa");
      _triggerReload(output);
      break;
    }

    default:
      devLog(output, `Unknown fetch sub-command: "${sub}"`, "#ff6666");
  }
}

function _triggerReload(output) {
  if (typeof window.reloadAssets !== "function") {
    devLog(output, "window.reloadAssets not available.", "#ff6666");
    return;
  }
  window.reloadAssets()
    .then(() => devLog(output, "Reload complete ✓", "#00ffaa"))
    .catch(() => devLog(output, "Reload failed (expected for failTest)", "#ff9900"));
}

/* ============================================================
   THEME HANDLER
   ============================================================ */

const THEME_MAP = {
  "0": "root", "1": "redux", "2": "classic", "3": "light", "4": "dark",
  "5": "slackerish", "6": "graduation", "7": "flower-boy", "8": "igor", "9": "i-am-music",
  "R": "root",
  // also accept names directly
  "root": "root", "redux": "redux", "classic": "classic", "light": "light",
  "dark": "dark", "slackerish": "slackerish", "graduation": "graduation",
  "flower-boy": "flower-boy", "igor": "igor", "i-am-music": "i-am-music",
};

function handleThemify(val, output) {
  const theme = THEME_MAP[val] || val;
  document.documentElement.setAttribute("theme", theme);
  window.currentTheme = theme;
  localStorage.setItem("selectedTheme", theme);
  if (typeof window.applyThemeGifs === "function") window.applyThemeGifs(theme);
  devLog(output, `Theme → "${theme}" ✓`);
  console.log(`[DevConsole] Theme set to "${theme}"`);
}

/* ============================================================
   WIDGET HANDLERS

   Storage keys:
     ws_widget_installed_{name}  →  "true" | absent
     ws_widget_active_{name}     →  "true" | "false"

   On page init (in index.html / a future widgets.js) check:
     localStorage.getItem("ws_widget_active_buddy!")  === "true"
   ============================================================ */

function _widgetKey(type, name) {
  return `ws_widget_${type}_${name}`;
}

function handleWidgetInstall(name, output) {
  localStorage.setItem(_widgetKey("installed", name), "true");
  devLog(output, `#install: "${name}" marked as installed.`);
  console.log(`[DevConsole] Widget installed: ${name}`);
}

function handleWidgetApply(name, active, output) {
  if (localStorage.getItem(_widgetKey("installed", name)) !== "true") {
    devLog(output, `"${name}" not installed. Run #install:widget/${name} first.`, "#ff9900");
    return;
  }
  localStorage.setItem(_widgetKey("active", name), active ? "true" : "false");
  devLog(output, `"${name}" ${active ? "enabled (will apply on next load)" : "disabled (kept installed)"}.`);
  console.log(`[DevConsole] Widget "${name}" active=${active}`);
}

function handleWidgetUninstall(name, output) {
  localStorage.removeItem(_widgetKey("installed", name));
  localStorage.removeItem(_widgetKey("active", name));
  devLog(output, `"${name}" fully uninstalled.`);
  console.log(`[DevConsole] Widget uninstalled: ${name}`);
}

/* ============================================================
   MARQUEE — simple one-liner
   ============================================================ */

function showMarquee(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "overlay marquee";
  Object.assign(wrapper.style, {
    position: "fixed", top: "0", left: "0", width: "100%",
    background: "rgba(0,0,0,0.8)", color: "yellow",
    fontFamily: "monospace", padding: "5px", zIndex: "999999",
    whiteSpace: "nowrap", overflow: "hidden",
  });
  wrapper.textContent = text;
  document.body.appendChild(wrapper);

  wrapper.animate(
    [{ transform: "translateX(100vw)" }, { transform: "translateX(-100%)" }],
    { duration: 10000, iterations: Infinity, easing: "linear" }
  );
}

/* ============================================================
   MARQUEE — rotating dev quotes
   ============================================================ */

function startCommandMarquee() {
  if (document.getElementById("commandMarquee")) return;

  const wrapper = document.createElement("div");
  wrapper.id        = "commandMarquee";
  wrapper.className = "overlay";
  Object.assign(wrapper.style, {
    position: "fixed", top: "0", left: "0", width: "100%", height: "40px",
    background: "rgba(0,0,0,0.8)", overflow: "hidden", zIndex: "999999",
    display: "flex", alignItems: "center",
  });

  const quoteBox = document.createElement("div");
  quoteBox.id = "commandQuoteBox";
  Object.assign(quoteBox.style, {
    whiteSpace: "nowrap", color: "yellow",
    fontFamily: "monospace", fontSize: "18px",
  });

  wrapper.appendChild(quoteBox);
  document.body.appendChild(wrapper);

  const QUOTES = [
    "slackrr now bg.uhm", "jouyuss now bg.uhm",
    "v1 release on sept 26th 2025", "POKEMON NOW WORKING!!!",
    "join the discord! https://discord.gg/vskTb44F5j",
    "Support Selenite and contributors on Sources/credits page or Github!",
    "one for all.", "all for one.", "24 songs, 76 projects.",
    "i make music too!", "smash karts is working fine idk what jayden is on about.",
    "cloak is gonna be fixed soon...", "genizy genius",
    "click the arrows to view more projects!", "page 2 is gonna be added on friday!",
    "no way its a week before release T-T", "im so cooked bro.", "page one is finished!",
    "ddlc soon??", "pokemon green version soon??",
    "login and sign up is NOT gonna happen any time soon ✌",
    "you think v1 gonna come out on time?",
    "should probably get more people to help me on the website..",
    "choppy orc da best music", "MUSIC NOW WORKING!!", "fixed music page :D",
    "math aint make no sense. oh wait nvm i think i get it.",
    "dont search blank you will find a mob of angry git octocats!",
  ];

  let baseSpeed = 120, targetMult = 1, currentMult = 1;
  let position, lastTime = null, paused = false;

  const setRandomQuote = () => {
    quoteBox.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    position = wrapper.offsetWidth + 50;
    quoteBox.style.transform = `translateX(${position}px)`;
  };

  const animate = (ts) => {
    if (lastTime !== null) {
      const dt = (ts - lastTime) / 1000;
      currentMult += (targetMult - currentMult) * 2 * dt;
      if (!paused) {
        position -= baseSpeed * currentMult * dt;
        quoteBox.style.transform = `translateX(${position}px)`;
      }
      if (position + quoteBox.offsetWidth < 0) setRandomQuote();
    }
    lastTime = ts;
    requestAnimationFrame(animate);
  };

  wrapper.addEventListener("mouseenter", () => { targetMult = 0.8; });
  wrapper.addEventListener("mouseleave", () => { targetMult = 1; });
  wrapper.addEventListener("mousedown",  () => { paused = true; });
  window.addEventListener("mouseup",     () => { paused = false; });

  setRandomQuote();
  requestAnimationFrame(animate);
}

/* ============================================================
   HELP PANEL
   ============================================================ */

function showHelpPanel() {
  // Only one at a time
  const existing = document.getElementById("devHelpPanel");
  if (existing) { existing.remove(); return; }

  const SECTIONS = [
    {
      label: "UTILITY",
      color: "#00ffcc",
      commands: [
        [":help:  /  commands",         "Show this panel (toggle)"],
        [":clear:",                      "Remove all overlays"],
        [":clear-all:",                  "Remove overlays + close console"],
        ["close",                        "Close the console only"],
      ],
    },
    {
      label: "FETCH",
      color: "#ffcc00",
      commands: [
        ["!fetch:devBuild",   "Switch to devBuildUrl and reload"],
        ["!fetch:refresh",    "Re-fetch with the current active URL"],
        ["!fetch:failTest",   "Force crash/fail state, hide pages"],
        ["!fetch:R",          "Reset to canonical sheetUrl and reload"],
      ],
    },
    {
      label: "THEME",
      color: "#cc88ff",
      commands: [
        ["!themifyMe0",          "Root (default)"],
        ["!themifyMe1",          "Redux"],
        ["!themifyMe2",          "Classic"],
        ["!themifyMe3",          "Light"],
        ["!themifyMe4",          "Dark"],
        ["!themifyMe5",          "Slackerish"],
        ["!themifyMe6",          "Graduation"],
        ["!themifyMe7",          "Flower Boy"],
        ["!themifyMe8",          "IGOR"],
        ["!themifyMe9",          "I Am Music"],
        ["!themifyMeR",          "Reset to root"],
        ["set:theme(name/0-9)",  "Same as above by name or number"],
      ],
    },
    {
      label: "WIDGETS",
      color: "#88ccff",
      commands: [
        ["#install:widget/buddy!",          "Mark buddy! as installed"],
        ["#install:widget/soundscapev1",     "Mark soundscapev1 as installed"],
        ["!appy.widget-apply:buddy!",        "Enable buddy! on load"],
        ["!appy.widget-apply:soundscapev1",  "Enable soundscapev1 on load"],
        ["!appy.widget-rem:buddy!",          "Disable buddy! (keep installed)"],
        ["!appy.widget-rem:soundscapev1",    "Disable soundscapev1 (keep installed)"],
        ["!appy.instalr-UNINST;buddy!",      "Fully uninstall buddy!"],
        ["!appy.instalr-UNINST;soundscapev1","Fully uninstall soundscapev1"],
      ],
    },
    {
      label: "FUN",
      color: "#ff8888",
      commands: [
        ["marquee",                           "Start rotating dev marquee"],
        ["marquee: <text>;",                  "Show a custom one-liner marquee"],
        ["gif",                               "Spawn a demo gif"],
        ["gif-<file>:<n>,set-position:random;","Spawn N gifs, optionally random"],
      ],
    },
  ];

  /* ── Backdrop ── */
  const backdrop = document.createElement("div");
  backdrop.id = "devHelpPanel";
  Object.assign(backdrop.style, {
    position:       "fixed",
    inset:          "0",
    zIndex:         "9999998",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    background:     "rgba(0,0,0,0.65)",
    backdropFilter: "blur(3px)",
  });

  /* ── Panel ── */
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background:    "#0a0a0a",
    border:        "1px solid #1fff8a33",
    borderRadius:  "14px",
    padding:       "24px 28px",
    maxWidth:      "640px",
    width:         "90vw",
    maxHeight:     "80vh",
    overflowY:     "auto",
    boxShadow:     "0 0 40px rgba(0,255,120,0.12), 0 8px 32px rgba(0,0,0,0.7)",
    fontFamily:    "monospace",
    color:         "#e0e0e0",
    scrollbarWidth:"thin",
    scrollbarColor:"#1fff8a22 transparent",
  });

  /* ── Title row ── */
  const titleRow = document.createElement("div");
  Object.assign(titleRow.style, {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   "18px",
  });

  const title = document.createElement("div");
  title.textContent = "⌨  WannaSmile Dev Console — Commands";
  Object.assign(title.style, {
    fontSize:    "13px",
    color:       "#1fff8a",
    fontWeight:  "bold",
    letterSpacing:"0.04em",
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  Object.assign(closeBtn.style, {
    background:   "transparent",
    border:       "1px solid #333",
    color:        "#888",
    borderRadius: "6px",
    padding:      "2px 8px",
    cursor:       "pointer",
    fontFamily:   "monospace",
    fontSize:     "13px",
    lineHeight:   "1.4",
  });
  closeBtn.addEventListener("mouseenter", () => { closeBtn.style.color = "#fff"; closeBtn.style.borderColor = "#666"; });
  closeBtn.addEventListener("mouseleave", () => { closeBtn.style.color = "#888"; closeBtn.style.borderColor = "#333"; });
  closeBtn.addEventListener("click", () => backdrop.remove());

  titleRow.appendChild(title);
  titleRow.appendChild(closeBtn);
  panel.appendChild(titleRow);

  /* ── Sections ── */
  SECTIONS.forEach(({ label, color, commands }) => {
    // Section header
    const header = document.createElement("div");
    header.textContent = `── ${label}`;
    Object.assign(header.style, {
      color:         color,
      fontSize:      "11px",
      letterSpacing: "0.1em",
      marginBottom:  "8px",
      marginTop:     "18px",
      opacity:       "0.85",
    });
    panel.appendChild(header);

    // Command rows
    commands.forEach(([cmd, desc]) => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display:       "flex",
        gap:           "12px",
        alignItems:    "baseline",
        padding:       "4px 8px",
        borderRadius:  "5px",
        cursor:        "default",
        transition:    "background 0.12s",
      });

      row.addEventListener("mouseenter", () => { row.style.background = "#ffffff08"; });
      row.addEventListener("mouseleave", () => { row.style.background = "transparent"; });

      // Click to copy command into console input
      row.title = "Click to copy into console";
      row.style.cursor = "pointer";
      row.addEventListener("click", () => {
        const consoleInput = document.querySelector("#devConsole input");
        if (consoleInput) { consoleInput.value = cmd; consoleInput.focus(); }
        // Quick flash
        row.style.background = "#1fff8a18";
        setTimeout(() => { row.style.background = "transparent"; }, 300);
      });

      const cmdEl = document.createElement("span");
      cmdEl.textContent = cmd;
      Object.assign(cmdEl.style, {
        color:      color,
        fontSize:   "12px",
        minWidth:   "230px",
        flexShrink: "0",
      });

      const descEl = document.createElement("span");
      descEl.textContent = `→  ${desc}`;
      Object.assign(descEl.style, {
        color:    "#777",
        fontSize: "12px",
      });

      row.appendChild(cmdEl);
      row.appendChild(descEl);
      panel.appendChild(row);
    });
  });

  /* ── Footer hint ── */
  const footer = document.createElement("div");
  footer.textContent = "Click any row to copy the command into the console input.";
  Object.assign(footer.style, {
    marginTop:  "20px",
    fontSize:   "10px",
    color:      "#444",
    textAlign:  "center",
  });
  panel.appendChild(footer);

  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);

  // Close on backdrop click (outside panel)
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });

  // Escape closes it too (won't trigger panic — panel captures before document)
  const onKey = (e) => { if (e.key === "Escape") { backdrop.remove(); document.removeEventListener("keydown", onKey, true); } };
  document.addEventListener("keydown", onKey, true);
}

/* ============================================================
   GIF SPAWNER
   ============================================================ */

function showGif(filename, randomPos = false) {
  const el = document.createElement("img");
  el.className = "overlay gif";
  el.src = filename;
  Object.assign(el.style, { position: "fixed", width: "100px", zIndex: "999999" });

  if (randomPos) {
    el.style.left = Math.floor(Math.random() * (window.innerWidth  - 100)) + "px";
    el.style.top  = Math.floor(Math.random() * (window.innerHeight - 100)) + "px";
  } else {
    el.style.left      = "50%";
    el.style.top       = "50%";
    el.style.transform = "translate(-50%, -50%)";
  }

  document.body.appendChild(el);
}
