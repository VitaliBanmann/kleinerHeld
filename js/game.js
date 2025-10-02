let canvasElement;
let worldInstance;
let keyboardInstance;
let canvasContext;

const BACKGROUND_IMAGES_FIELDS = [
    './assets/background/field1_1920.jpg',
    './assets/background/field2_1920.jpg',
    './assets/background/field3_1920.jpg',
    './assets/background/field4_1920.jpg',
    './assets/background/field5_1920.jpg',
];

const BACKGROUND_IMAGES_FOREST = [
    './assets/background/forest1_1920.jpg',
    './assets/background/forest2_1920.jpg',
    './assets/background/forest3_1920.jpg',
    './assets/background/forest4_1920.jpg',
    './assets/background/forest5_1920.jpg',
];

let currentBackgroundSet = BACKGROUND_IMAGES_FIELDS;
let currentBackgroundIndex = 0;
let backgroundRotationTimer = null;
let backgroundLayerElements = [];
let lastLevelReference = null;
let fullscreenLock = false;

/**
 * Selects the appropriate background set based on the current level or overlay state.
 * If the start overlay is active, BACKGROUND_IMAGES_FIELDS is always chosen.
 * If the level changes to a different set, currentBackgroundIndex is reset.
 * @returns {void}
 */
function selectBackgroundSetForCurrentLevel() {
    if (shouldUseFieldsForStartOverlay()) {
        switchToFieldsIfNeeded();
        return;
    }
    if (!worldInstance?.currentLevel) return;
    switchBackgroundSetForLevel();
}

/**
 * Checks if the start overlay is active and requires fields background.
 * @returns {boolean} True if start overlay is active
 */
function shouldUseFieldsForStartOverlay() {
    return window.Overlay?.state === 'start';
}

/**
 * Switches to FIELDS background set if not already active.
 * Resets background index when switching.
 * @returns {void}
 */
function switchToFieldsIfNeeded() {
    if (currentBackgroundSet !== BACKGROUND_IMAGES_FIELDS) {
        currentBackgroundSet = BACKGROUND_IMAGES_FIELDS;
        currentBackgroundIndex = 0;
    }
}

/**
 * Selects background set based on current level and switches if needed.
 * Level 1 uses FIELDS, other levels use FOREST.
 * @returns {void}
 */
function switchBackgroundSetForLevel() {
    const newBackgroundSet = determineBackgroundSetForLevel();
    if (newBackgroundSet !== currentBackgroundSet) {
        currentBackgroundSet = newBackgroundSet;
        currentBackgroundIndex = 0;
    }
    lastLevelReference = worldInstance.currentLevel;
}

/**
 * Determines which background set to use based on current level.
 * @returns {string[]} BACKGROUND_IMAGES_FIELDS or BACKGROUND_IMAGES_FOREST
 */
function determineBackgroundSetForLevel() {
    return (worldInstance.currentLevel === window.level1) 
        ? BACKGROUND_IMAGES_FIELDS 
        : BACKGROUND_IMAGES_FOREST;
}

/**
 * Creates a new background layer by cloning from the <template id="bg-layer-tpl">.
 * The element is appended to body and tracked in backgroundLayerElements.
 * @param {string} imageUrl - Image URL for the layer background.
 * @returns {HTMLDivElement} The newly created layer element.
 */
function createBackgroundLayer(imageUrl) {
    const templateElement = document.getElementById('bg-layer-tpl');
    const backgroundLayerElement = templateElement?.content?.firstElementChild?.cloneNode(true) || document.createElement('div');
    if (!backgroundLayerElement.classList.contains('bg-layer')) backgroundLayerElement.classList.add('bg-layer');
    backgroundLayerElement.style.backgroundImage = `url('${imageUrl}')`;
    document.body.appendChild(backgroundLayerElement);
    backgroundLayerElements.push(backgroundLayerElement);
    return /** @type {HTMLDivElement} */ (backgroundLayerElement);
}

/**
 * Cross-fades to the next background.
 * Preloads image to prevent flicker.
 * Fades out previous layer, fades in new layer.
 * Syncs body background when fade-in completes (optional).
 * @returns {Promise<void>}
 */
async function applyBackgroundImage() {
    if (!currentBackgroundSet.length) return;
    const imageUrl = currentBackgroundSet[currentBackgroundIndex % currentBackgroundSet.length];
    await preloadImage(imageUrl);
    const newLayerElement = createBackgroundLayer(imageUrl);

    if (backgroundLayerElements.length > 1) {
        const previousLayerElement = backgroundLayerElements[backgroundLayerElements.length - 2];
        newLayerElement.classList.add('fade-in-delayed');
        startFadeOutPreviousLayer(previousLayerElement);
    } else {
        makeLayerVisibleInstantly(newLayerElement);
    }
    attachFadeInFinalizer(newLayerElement, imageUrl);
}

/**
 * Preloads an image. Resolves when loading finishes (errors are ignored).
 * @param {string} imageUrl - The image URL to preload.
 * @returns {Promise<void>}
 */
function preloadImage(imageUrl) {
    return new Promise((resolve) => {
        const imageElement = new Image();
        imageElement.onload = () => resolve();
        imageElement.onerror = () => resolve();
        imageElement.src = imageUrl;
    });
}

/**
 * Starts fade-out on a previous layer and removes it after animation end.
 * @param {HTMLDivElement} previousLayerElement - The previous background layer element.
 * @returns {void}
 */
function startFadeOutPreviousLayer(previousLayerElement) {
    previousLayerElement.classList.remove('fade-in-delayed', 'fade-in-instant');
    previousLayerElement.classList.add('fade-out');
    previousLayerElement.addEventListener('animationend', () => {
        previousLayerElement.remove();
        backgroundLayerElements = backgroundLayerElements.filter(layer => layer !== previousLayerElement);
    }, { once: true });
}

/**
 * Makes a layer visible immediately (no delayed fade-in).
 * @param {HTMLDivElement} layerElement - The background layer element.
 * @returns {void}
 */
function makeLayerVisibleInstantly(layerElement) {
    layerElement.classList.remove('fade-in-delayed');
    layerElement.classList.add('fade-in-instant');
}

/**
 * After fade-in completes, sets the body's background-image for consistency.
 * @param {HTMLDivElement} layerElement - The background layer element.
 * @param {string} imageUrl - The image URL.
 * @returns {void}
 */
function attachFadeInFinalizer(layerElement, imageUrl) {
    layerElement.addEventListener('animationend', (animationEvent) => {
        if (animationEvent.animationName === 'bgFadeIn') {
            document.body.style.backgroundImage = `url('${imageUrl}')`;
        }
    }, { once: true });
}

/**
 * Requests fullscreen on an element with vendor fallbacks.
 * @param {Element|null} element - The element to request fullscreen on.
 * @returns {Promise<void>|null}
 */
function requestFullscreenOnElement(element) {
    try {
        if (element?.requestFullscreen) return element.requestFullscreen();
        if (element?.webkitRequestFullscreen) return element.webkitRequestFullscreen();
    } catch (error) { throw error; }
    return null;
}

/**
 * Returns whether the document is currently in fullscreen.
 * @returns {boolean} True if fullscreen is active, otherwise false.
 */
window.isFullscreen = function() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
};

/**
 * Attempts to enter fullscreen (document or canvas). Falls back to pseudo-fs.
 * @returns {Promise<void>|null}
 */
window.enterFullscreen = function() {
    const documentElement = document.documentElement;
    const canvasElementOrDocument = document.getElementById('gameCanvas') || documentElement;
    try { return requestFullscreenOnElement(documentElement) || requestFullscreenOnElement(canvasElementOrDocument); }
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
 * @returns {void}
 */
window.toggleFullscreen = function() {
    if (fullscreenLock) return;
    fullscreenLock = true;
    const unlockAndUpdateIcon = () => { fullscreenLock = false; window.updateFullscreenIcon?.(); };
    try {
        if (!window.isFullscreen()) {
            const promise = window.enterFullscreen();
            if (promise?.catch) promise.catch(() => document.body.classList.toggle('pseudo-fs')).finally(unlockAndUpdateIcon);
            else unlockAndUpdateIcon();
        } else {
            const promise = window.exitFullscreen();
            if (promise?.finally) promise.finally(unlockAndUpdateIcon); else unlockAndUpdateIcon();
        }
    } catch { document.body.classList.toggle('pseudo-fs'); unlockAndUpdateIcon(); }
};

/**
 * Sets up orientation handling and acquires canvas/context.
 * @returns {boolean} True if canvas/context are ready.
 */
function setupOrientationAndCanvas() {
    handleOrientationGate();
    window.addEventListener('resize', handleOrientationGate);
    window.addEventListener('orientationchange', handleOrientationGate);
    canvasElement = document.getElementById('gameCanvas');
    if (!canvasElement) { console.warn('gameCanvas missing in index.html'); return false; }
    canvasContext = canvasElement.getContext('2d');
    return true;
}

/**
 * Initializes input, audio, and world instance.
 * @returns {Promise<void>}
 */
async function setupSubsystems() {
    keyboardInstance = new Keyboard();
    keyboardInstance.mapEvents?.();
    window.keyboard = keyboardInstance;

    AudioManager.init?.();
    AudioManager.startUserGestureHook?.();
    worldInstance = new World(canvasContext, canvasElement, null);
    window.world = worldInstance;
}

/**
 * Binds global keys and UI buttons. Also syncs icons.
 * @returns {void}
 */
function setupBindings() {
    document.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.code === 'KeyF') window.toggleFullscreen();
        if (keyboardEvent.code === 'KeyP' && (Overlay.state === 'none' || Overlay.state === 'pause')) {
            worldInstance.togglePause?.();
        }
    });
    bindPressEvent(document.getElementById('pause'), () => { window.world?.togglePause?.(); window.updatePauseIcon(); });
    bindPressEvent(document.getElementById('fullscreen'), async () => { await window.toggleFullscreen(); });
    const soundButtonElement = document.getElementById('sound');
    if (soundButtonElement) bindPressEvent(soundButtonElement, () => { AudioManager.toggleMute?.(); window.updateSoundIcon(); });
    document.addEventListener('fullscreenchange', window.updateFullscreenIcon);
    window.updatePauseIcon(); window.updateFullscreenIcon(); window.updateSoundIcon();
}

/**
 * Sets up overlay interactions on the canvas and sets start state.
 * Configures mouse cursor changes and click handling for overlay buttons.
 * @returns {void}
 */
function setupOverlayClick() {
    Overlay.setState('start');
    setupCanvasMouseTracking();
    setupCanvasClickHandling();
}

/**
 * Sets up mouse movement tracking on canvas to change cursor style.
 * Shows pointer cursor when hovering over overlay or HUD buttons, default otherwise.
 * @returns {void}
 */
function setupCanvasMouseTracking() {
    canvasElement.addEventListener('mousemove', onCanvasMouseMove);
}

/**
 * Handles mousemove event on canvas and sets cursor style.
 * @param {MouseEvent} mouseEvent - The mousemove event.
 * @returns {void}
 */
function onCanvasMouseMove(mouseEvent) {
    const { x, y } = getCanvasMousePosition(mouseEvent);
    const isHovering = isHoveringCanvasButton(x, y);
    canvasElement.style.cursor = isHovering ? 'pointer' : 'default';
}

/**
 * Returns mouse coordinates relative to canvas (scaled to canvas dimensions).
 * @param {MouseEvent} mouseEvent - The mouse event.
 * @returns {{x:number, y:number}} The mouse position relative to the canvas.
 */
function getCanvasMousePosition(mouseEvent) {
    const boundingRect = canvasElement.getBoundingClientRect();
    const clickX = mouseEvent.clientX - boundingRect.left;
    const clickY = mouseEvent.clientY - boundingRect.top;
    
    const scaleX = canvasElement.width / boundingRect.width;
    const scaleY = canvasElement.height / boundingRect.height;
    
    return { 
        x: clickX * scaleX, 
        y: clickY * scaleY 
    };
}

/**
 * Checks if mouse is over any HUD or Overlay button.
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @returns {boolean} True if hovering over a button.
 */
function isHoveringCanvasButton(x, y) {
    if (isHoveringHudButton(x, y)) return true;
    if (isHoveringOverlayButton(x, y)) return true;
    return false;
}

/**
 * Checks if mouse is over any HUD button.
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @returns {boolean} True if hovering over a HUD button.
 */
function isHoveringHudButton(x, y) {
    if (!HUD.btnAreas) return false;
    for (const buttonArea of HUD.btnAreas) {
        if (x >= buttonArea.x && x <= buttonArea.x + buttonArea.w && y >= buttonArea.y && y <= buttonArea.y + buttonArea.h) return true;
    }
    return false;
}

/**
 * Checks if mouse is over any Overlay button.
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @returns {boolean} True if hovering over an overlay button.
 */
function isHoveringOverlayButton(x, y) {
    if (!Overlay._buttons) return false;
    for (const overlayButton of Overlay._buttons) {
        if (x >= overlayButton.x && x <= overlayButton.x + overlayButton.w && y >= overlayButton.y && y <= overlayButton.y + overlayButton.h) return true;
    }
    return false;
}

/**
 * Sets up click event handling on canvas for HUD and overlay interactions.
 * Routes clicks to HUD first, then overlay buttons.
 * Transforms coordinates for responsive scaling.
 * @returns {void}
 */
function setupCanvasClickHandling() {
    canvasElement.addEventListener('click', (mouseEvent) => {
        const boundingRect = canvasElement.getBoundingClientRect();
        const clickX = mouseEvent.clientX - boundingRect.left;
        const clickY = mouseEvent.clientY - boundingRect.top;
        const scaleX = canvasElement.width / boundingRect.width;
        const scaleY = canvasElement.height / boundingRect.height;
        const x = clickX * scaleX;
        const y = clickY * scaleY;
        
        if (HUD.handleClick?.(x, y, worldInstance)) return;
        
        if (Overlay.handleClick?.(x, y)) return;
    });
}

/**
 * Starts menu music and background rotation.
 * @returns {void}
 */
function finishInitialization() {
    AudioManager.playMenu?.();
    startBackgroundRotation();
}

/**
 * App entry point: small orchestrator that delegates to short helpers.
 * @async
 * @returns {Promise<void>}
 */
async function init() {
    if (!setupOrientationAndCanvas()) return;
    await setupSubsystems();
    setupBindings();
    setupOverlayClick();
    finishInitialization();
}

/**
 * Updates orientation-dependent UI.
 * Shows a rotate hint for touch devices in portrait mode.
 * Toggles body class to block game/cpanel when portrait on touch.
 * @returns {void}
 */
function handleOrientationGate() {
    const isTouchDevice = window.matchMedia?.('(pointer: coarse)')?.matches;
    const isPortraitOrientation = window.matchMedia?.('(orientation: portrait)')?.matches;
    const rotateHintElement = document.querySelector('.rotate-hint');
    const shouldShowHint = !!(isTouchDevice && isPortraitOrientation);
    if (rotateHintElement) rotateHintElement.style.display = shouldShowHint ? 'flex' : 'none';
    document.body.classList.toggle('portrait-blocked', shouldShowHint);
}

/**
 * Binds a "press" handler to an element (click for mouse, pointerup for touch).
 * Prevents default to avoid double triggers on mobile.
 * @param {Element|null} element - Target element.
 * @param {() => void} handler - Callback to execute on press.
 * @returns {void}
 */
function bindPressEvent(element, handler) {
    if (!element) return;
    const isCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
    const eventType = isCoarsePointer ? 'pointerup' : 'click';
    element.addEventListener(eventType, (event) => { event.preventDefault(); handler(); });
}

/**
 * Starts periodic background rotation.
 * Picks set for current level or overlay.
 * Applies initial background.
 * Rotates every 60s (cleans previous timer).
 * @returns {void}
 */
function startBackgroundRotation() {
    selectBackgroundSetForCurrentLevel();
    if (backgroundRotationTimer) clearInterval(backgroundRotationTimer);
    applyBackgroundImage();
    backgroundRotationTimer = setInterval(() => {
        currentBackgroundIndex = (currentBackgroundIndex + 1) % currentBackgroundSet.length;
        applyBackgroundImage();
    }, 60000);
}

/**
 * Stops background rotation timer.
 * @returns {void}
 */
function stopBackgroundRotation() {
    if (!backgroundRotationTimer) return;
    clearInterval(backgroundRotationTimer);
    backgroundRotationTimer = null;
}

/**
 * Syncs the pause/play icon based on world's paused flag.
 * @returns {void}
 */
window.updatePauseIcon = function() {
    const pauseIconElement = document.getElementById('pauseIcon');
    if (pauseIconElement) {
        pauseIconElement.src = (window.world?.paused)
            ? './assets/buttons/play.png'
            : './assets/buttons/pause.png';
    }
};

/**
 * Syncs the fullscreen icon based on document fullscreen state.
 * @returns {void}
 */
window.updateFullscreenIcon = function() {
    const fullscreenIconElement = document.getElementById('fsIcon') || document.getElementById('fullscreenIcon');
    if (fullscreenIconElement) {
        fullscreenIconElement.src = (window.isFullscreen?.())
            ? './assets/buttons/fullscreen_exit.png'
            : './assets/buttons/fullscreen.png';
    }
};

/**
 * Syncs the sound icon based on AudioManager.muted status.
 * @returns {void}
 */
window.updateSoundIcon = function() {
    const soundIconElement = document.getElementById('soundIcon');
    if (soundIconElement) {
        soundIconElement.src = (window.AudioManager?.muted)
            ? './assets/buttons/sound_off.png'
            : './assets/buttons/sound_on.png';
    }
};