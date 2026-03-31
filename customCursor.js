/**
 * customCursor.js
 * Replaces the native cursor with custom PNG images.
 * Images expected: normal.png, click.png, grab.png, deny.png, point.png
 * Image size: 320x320px — displayed at a small size via the scale below.
 */

(function () {
  // ── Configuration ────────────────────────────────────────────────────────────
  const IMAGE_PATH = './';          // folder containing the cursor PNGs
  const DISPLAY_SIZE = 32;          // rendered size in px (320px source → 32px display = 10× scale)
  const HOTSPOT = DISPLAY_SIZE / 2; // where the "click point" is inside the image

  // ── Create the cursor element ─────────────────────────────────────────────────
  const cursor = document.createElement('img');
  cursor.id = 'custom-cursor';
  Object.assign(cursor.style, {
    position:      'fixed',
    top:           '0',
    left:          '0',
    width:         DISPLAY_SIZE + 'px',
    height:        DISPLAY_SIZE + 'px',
    pointerEvents: 'none',      // never intercept clicks
    zIndex:        '2147483647',
    transform:     `translate(-${HOTSPOT}px, -${HOTSPOT}px)`,
    imageRendering: 'smooth',
    transition:    'opacity 0.1s',
    userSelect:    'none',
  });
  cursor.src = IMAGE_PATH + 'normal.png';
  document.body.appendChild(cursor);

  // Hide the real cursor everywhere
  const styleTag = document.createElement('style');
  styleTag.textContent = '*, *::before, *::after { cursor: none !important; }';
  document.head.appendChild(styleTag);

  // ── State ─────────────────────────────────────────────────────────────────────
  let currentState = 'normal';
  let isMouseDown  = false;

  const IMAGES = {
    normal: IMAGE_PATH + 'normal.png',
    click:  IMAGE_PATH + 'click.png',
    grab:   IMAGE_PATH + 'grab.png',
    deny:   IMAGE_PATH + 'deny.png',
    point:  IMAGE_PATH + 'point.png',
  };

  // Pre-load all images so swaps are instant
  Object.values(IMAGES).forEach(src => { new Image().src = src; });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function setState(state) {
    if (currentState === state) return;
    currentState = state;
    cursor.src = IMAGES[state];
  }

  /**
   * Derive the cursor state from an element's computed cursor CSS value
   * or from data attributes you can add manually:
   *   data-cursor="grab"  data-cursor="deny"  data-cursor="point"
   */
  function stateForElement(el) {
    if (isMouseDown) return 'click';

    // Walk up the DOM to find a data-cursor attribute
    let node = el;
    while (node && node !== document.body) {
      const dc = node.getAttribute && node.getAttribute('data-cursor');
      if (dc && IMAGES[dc]) return dc;
      node = node.parentElement;
    }

    // Fall back to computed CSS cursor
    const computed = window.getComputedStyle(el).cursor;
    if (computed === 'pointer')                        return 'point';
    if (computed === 'grab' || computed === '-webkit-grab') return 'grab';
    if (computed === 'not-allowed' || computed === 'no-drop') return 'deny';
    return 'normal';
  }

  // ── Event listeners ───────────────────────────────────────────────────────────
  document.addEventListener('mousemove', e => {
    // Move the cursor image
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';

    if (!isMouseDown) {
      setState(stateForElement(e.target));
    }
  });

  document.addEventListener('mousedown', () => {
    isMouseDown = true;
    setState('click');
  });

  document.addEventListener('mouseup', e => {
    isMouseDown = false;
    setState(stateForElement(e.target));
  });

  document.addEventListener('mouseover', e => {
    if (!isMouseDown) setState(stateForElement(e.target));
  });

  // Hide custom cursor when mouse leaves the window
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

  // ── Public API ────────────────────────────────────────────────────────────────
  // Override the cursor state manually from anywhere:
  //   customCursor.set('grab')
  //   customCursor.reset()
  window.customCursor = {
    set:   (state) => { if (IMAGES[state]) setState(state); },
    reset: ()      => setState('normal'),
    states: Object.keys(IMAGES),
  };
})();