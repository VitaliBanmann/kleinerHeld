let canvas;
let world;
let keyboard;
let ctx;

const BG_FIELDS = [
    './assets/background/field1_1920.jpg',
    './assets/background/field2_1920.jpg',
    './assets/background/field3_1920.jpg',
    './assets/background/field4_1920.jpg',
    './assets/background/field5_1920.jpg',
];

const BG_FOREST = [
    './assets/background/forest1_1920.jpg',
    './assets/background/forest2_1920.jpg',
    './assets/background/forest3_1920.jpg',
    './assets/background/forest4_1920.jpg',
    './assets/background/forest5_1920.jpg',
];

let bgSet = BG_FIELDS;
let bgIndex = 0;
let bgTimer = null;
let bgLayers = [];
let levelRefLast = null;
let fsLock = false;

/**
 * Wählt das passende Hintergrund-Set anhand des aktuellen Levels oder Overlay-Zustands.
 *
 * - Wenn das Start-Overlay aktiv ist, wird immer BG_FIELDS gewählt.
 * - Wenn das Level zu einem anderen Set wechselt, wird bgIndex zurückgesetzt.
 *
 * @returns {void}
 */
function pickBgSetForCurrentLevel() {
    if (window.Overlay?.state === 'start') {
        if (bgSet !== BG_FIELDS) {
            bgSet = BG_FIELDS;
            bgIndex = 0;
        }
        return;
    }
    if (!world?.currentLevel) return;

    let newSet = (world.currentLevel === window.level1) ? BG_FIELDS : BG_FOREST;
    if (newSet !== bgSet) {bgSet = newSet; bgIndex = 0;}
    levelRefLast = world.currentLevel;
}

/**
 * Creates a new background layer by cloning from the <template id="bg-layer-tpl">.
 * The element is appended to body and tracked in bgLayers.
 *
 * @param {string} url - Image URL for the layer background.
 * @returns {HTMLDivElement} The newly created layer element.
 */
function createBgLayer(url) {
  const tpl = document.getElementById('bg-layer-tpl');
  const node = tpl?.content?.firstElementChild?.cloneNode(true) || document.createElement('div');
  if (!node.classList.contains('bg-layer')) node.classList.add('bg-layer');
  node.style.backgroundImage = `url('${url}')`;
  document.body.appendChild(node);
  bgLayers.push(node);
  return /** @type {HTMLDivElement} */ (node);
}

/**
 * Cross-fades to the next background.
 * - Preloads image to prevent flicker.
 * - Fades out previous layer, fades in new layer.
 * - Syncs body background when fade-in completes (optional).
 *
 * @returns {Promise<void>}
 */
async function applyBackground() {
  if (!bgSet.length) return;
  const url = bgSet[bgIndex % bgSet.length];
  await preloadImage(url);
  const layer = createBgLayer(url);

  if (bgLayers.length > 1) {
    const prev = bgLayers[bgLayers.length - 2];
    layer.classList.add('fade-in-delayed');
    startFadeOutPrevious(prev);
  } else {
    makeLayerInstant(layer);
  }
  attachFadeInFinalizer(layer, url);
}

/**
 * Preloads an image. Resolves when loading finishes (errors are ignored).
 * @param {string} url
 * @returns {Promise<void>}
 */
function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Starts fade-out on a previous layer and removes it after animation end.
 * @param {HTMLDivElement} prev
 * @returns {void}
 */
function startFadeOutPrevious(prev) {
  prev.classList.remove('fade-in-delayed', 'fade-in-instant');
  prev.classList.add('fade-out');
  prev.addEventListener('animationend', () => {
    prev.remove();
    bgLayers = bgLayers.filter(l => l !== prev);
  }, { once: true });
}

/**
 * Makes a layer visible immediately (no delayed fade-in).
 * @param {HTMLDivElement} layer
 * @returns {void}
 */
function makeLayerInstant(layer) {
  layer.classList.remove('fade-in-delayed');
  layer.classList.add('fade-in-instant');
}

/**
 * After fade-in completes, sets the body's background-image for consistency.
 * @param {HTMLDivElement} layer
 * @param {string} url
 * @returns {void}
 */
function attachFadeInFinalizer(layer, url) {
  layer.addEventListener('animationend', (e) => {
    if (e.animationName === 'bgFadeIn') document.body.style.backgroundImage = `url('${url}')`;
  }, { once: true });
}

/**
 * Requests fullscreen on an element with vendor fallbacks.
 * @param {Element|null} el
 * @returns {Promise<void>|null}
 */
function requestFs(el) {
  try {
    if (el?.requestFullscreen) return el.requestFullscreen();
    if (el?.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  } catch (e) { throw e; }
  return null;
}

/**
 * Returns whether the document is currently in fullscreen.
 * @returns {boolean}
 */
window.isFullscreen = function() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
};

/**
 * Attempts to enter fullscreen (document or canvas). Falls back to pseudo-fs.
 * @returns {Promise<void>|null}
 */
window.enterFullscreen = function() {
  const elDoc = document.documentElement;
  const elCanvas = document.getElementById('gameCanvas') || elDoc;
  try { return requestFs(elDoc) || requestFs(elCanvas); }
  catch { document.body.classList.toggle('pseudo-fs'); return null; }
};

/**
 * Attempts to exit fullscreen; supports vendor prefixes. Falls back to pseudo-fs.
 * @returns {Promise<void>|null}
 */
window.exitFullscreen = function() {
  try { return document.exitFullscreen?.() || document.webkitExitFullscreen?.() || null; }
  catch { document.body.classList.toggle('pseudo-fs'); return null; }
};

/**
 * Toggles fullscreen with a simple lock and consistent icon updates.
 * Ensures ≤14 code lines; delegates to enter/exit helpers.
 * @returns {void}
 */
window.toggleFullscreen = function() {
  if (fsLock) return;
  fsLock = true;
  const done = () => { fsLock = false; window.updateFsIcon?.(); };
  try {
    if (!window.isFullscreen()) {
      const p = window.enterFullscreen();
      if (p?.catch) p.catch(() => document.body.classList.toggle('pseudo-fs')).finally(done);
      else done();
    } else {
      const p = window.exitFullscreen();
      if (p?.finally) p.finally(done); else done();
    }
  } catch { document.body.classList.toggle('pseudo-fs'); done(); }
};

/**
 * Sets up orientation handling and acquires canvas/context.
 * @returns {boolean} True if canvas/context are ready.
 */
function setupOrientationAndCanvas() {
  handleOrientationGate();
  window.addEventListener('resize', handleOrientationGate);
  window.addEventListener('orientationchange', handleOrientationGate);
  canvas = document.getElementById('gameCanvas');
  if (!canvas) { console.warn('gameCanvas missing in index.html'); return false; }
  ctx = canvas.getContext('2d');
  return true;
}

/**
 * Initializes input, audio, and world instance.
 * @returns {Promise<void>}
 */
async function setupSubsystems() {
  keyboard = new Keyboard();
  keyboard.mapEvents?.();
  window.keyboard = keyboard;

  AudioManager.init?.();
  AudioManager.startUserGestureHook?.();
  world = new World(ctx, canvas, null);
  window.world = world;
}

/**
 * Binds global keys and UI buttons. Also syncs icons.
 * @returns {void}
 */
function setupBindings() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') toggleFullscreen();
    if (e.code === 'KeyP' && (Overlay.state === 'none' || Overlay.state === 'pause')) {
      world.togglePause?.();
    }
  });
  bindPress(document.getElementById('pause'), () => { window.world?.togglePause?.(); window.updatePauseIcon(); });
  bindPress(document.getElementById('fullscreen'), async () => { await toggleFullscreen(); });
  const soundBtn = document.getElementById('sound');
  if (soundBtn) bindPress(soundBtn, () => { AudioManager.toggleMute?.(); window.updateSoundIcon(); });
  document.addEventListener('fullscreenchange', window.updateFsIcon);
  window.updatePauseIcon(); window.updateFsIcon(); window.updateSoundIcon();
}

/**
 * Sets up overlay interactions on the canvas and sets start state.
 * @returns {void}
 */
function setupOverlayClick() {
  Overlay.state = 'start';
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (HUD.handleClick?.(x, y, world)) return;
    if (Overlay.handleClick?.(x, y)) return;
    Overlay.handleActionPrimary?.();
  });
}

/**
 * Starts menu music and background rotation.
 * @returns {void}
 */
function finishInit() {
  AudioManager.playMenu?.();
  startBackgroundRotation();
}

/**
 * App entry point: small orchestrator that delegates to short helpers (≤14 lines).
 * @async
 * @returns {Promise<void>}
 */
async function init() {
  if (!setupOrientationAndCanvas()) return;
  await setupSubsystems();
  setupBindings();
  setupOverlayClick();
  finishInit();
}

/**
 * Updates orientation-dependent UI.
 * - Shows a rotate hint for touch devices in portrait mode.
 * - Toggles body class to block game/cpanel when portrait on touch.
 * @returns {void}
 */
function handleOrientationGate() {
  const isTouch = window.matchMedia?.('(pointer: coarse)')?.matches;
  const isPortrait = window.matchMedia?.('(orientation: portrait)')?.matches;
  const hint = document.querySelector('.rotate-hint');
  const show = !!(isTouch && isPortrait);
  if (hint) hint.style.display = show ? 'flex' : 'none';
  document.body.classList.toggle('portrait-blocked', show);
}

/**
 * Binds a "press" handler to an element (click for mouse, pointerup for touch).
 * Prevents default to avoid double triggers on mobile.
 * @param {Element|null} el - Target element.
 * @param {() => void} handler - Callback to execute on press.
 * @returns {void}
 */
function bindPress(el, handler) {
  if (!el) return;
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  const evt = coarse ? 'pointerup' : 'click';
  el.addEventListener(evt, (e) => { e.preventDefault(); handler(); });
}

/**
 * Starts periodic background rotation.
 * - Picks set for current level or overlay.
 * - Applies initial background.
 * - Rotates every 60s (cleans previous timer).
 * @returns {void}
 */
function startBackgroundRotation() {
  pickBgSetForCurrentLevel();
  if (bgTimer) clearInterval(bgTimer);
  applyBackground();
  bgTimer = setInterval(() => {
    bgIndex = (bgIndex + 1) % bgSet.length;
    applyBackground();
  }, 60000);
}

/**
 * Stops background rotation timer.
 * @returns {void}
 */
function stopBackgroundRotation() {
  if (!bgTimer) return;
  clearInterval(bgTimer);
  bgTimer = null;
}

/**
 * Syncs the pause/play icon based on world's paused flag.
 * @returns {void}
 */
window.updatePauseIcon = function() {
  const el = document.getElementById('pauseIcon');
  if (el) el.src = (window.world?.paused) ? './assets/buttons/play.png' : './assets/buttons/pause.png';
};

/**
 * Syncs the fullscreen icon based on document fullscreen state.
 * @returns {void}
 */
window.updateFsIcon = function() {
  const el = document.getElementById('fsIcon') || document.getElementById('fullscreenIcon');
  if (el) el.src = (window.isFullscreen?.()) ? './assets/buttons/fullscreen_exit.png' : './assets/buttons/fullscreen.png';
};

/**
 * Syncs the sound icon based on AudioManager.muted status.
 * @returns {void}
 */
window.updateSoundIcon = function() {
  const el = document.getElementById('soundIcon');
  if (el) el.src = (window.AudioManager?.muted) ? './assets/buttons/sound_off.png' : './assets/buttons/sound_on.png';
};