class World {
  character = new Character();
  enemies = [];
  boss = null;

  birds = [];
  birdsCount = 15;
  backgrounds = [];
  bgTiles = [];
  levelEndObject = new LevelEndObject();
  coins = [];

  canvas;
  ctx;
  camera_x = 0;
  levelWidth = 12000;
  tileWidth = 1199;

  currentLevel = null;
  switching = false;
  enemiesDefeated = 0;
  spawnSafeZoneRight = 600;
  autoRespawnEnemies = true;
  targetEnemiesCount = 0;
  enemyClassRef = null;

  pendingRespawns = [];

  constructor(ctx, canvas, levelData = {}) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.currentLevel = levelData || null;
    this.character = new Character((levelData && levelData.groundY) ?? 520);
    this.character.world = this;
    this.paused = true;
    this.cameraFocusRatio = 0.5;

    if (levelData && levelData.backgrounds) this.loadLevel(levelData);
    requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * Main game loop callback driven by requestAnimationFrame.
   * Calculates delta time, then updates and draws the world.
   * @param {number} timestamp High-resolution timestamp from rAF
   * @returns {void}
   */
  loop(timestamp) {
    const dt = this.lastTimestamp ? (timestamp - this.lastTimestamp) : 16;
    this.lastTimestamp = timestamp;
    this.update?.(dt);
    this.draw?.();
    requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * Toggles pause state and synchronizes overlay state and UI icon.
   * @returns {void}
   */
  togglePause() {
    this.paused = !this.paused;
    if (!window.Overlay) return;
    if (this.paused) {
      if (Overlay.state === 'none') Overlay.state = 'pause';
    } else {
      if (Overlay.state === 'pause') Overlay.state = 'none';
    }
    window.updatePauseIcon?.();
  }

  /**
   * Loads a new level via Level.load and replaces current level state.
   * @param {any} levelData Level definition or reference (e.g., window.level1)
   * @returns {void}
   */
  loadLevel(levelData) {
    try { Level.load(this, levelData); } catch (e) {}
  }

  /**
   * Delegates a player attack to the combat system.
   * @param {string} kind Attack kind identifier ('light','heavy','special', etc.)
   * @returns {void}
   */
  onPlayerAttack(kind) { Combat.playerAttack(this, kind); }

  /**
   * Applies knockback using the combat system.
   * @param {any} target Victim object
   * @param {any} from Source object
   * @param {number} amt Knockback strength
   * @returns {void}
   */
  applyKnockback(target, from, amt) { Combat.applyKnockback(this, target, from, amt); }

  /**
   * Returns a random X coordinate within [minX, maxX].
   * @param {number} minX Minimum X
   * @param {number} maxX Maximum X
   * @returns {number}
   */
  randomXRightOfStart(minX, maxX) {
    if (maxX <= minX) return minX;
    return Math.round(minX + Math.random() * (maxX - minX));
  }

  /**
   * Sets an object's facing direction towards the character (true = left).
   * @param {any} obj Object with x and optional direction property
   * @returns {void}
   */
  faceTowardsCharacter(obj) {
    if (!obj || !this.character) return;
    obj.direction = obj.x > this.character.x;
  }

  /**
   * Returns the axis-aligned bounding box (AABB) of an object.
   * @param {any} obj Any drawable/moveable object
   * @returns {{x:number,y:number,w:number,h:number}}
   */
  rect(obj) { return Collision.rect(obj); }

  /**
   * Checks AABB intersection.
   * @param {{x:number,y:number,w:number,h:number}} a
   * @param {{x:number,y:number,w:number,h:number}} b
   * @returns {boolean}
   */
  intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /**
   * Clamps an object's x position to the horizontal world bounds.
   * Uses HitboxWidth or width with object scale to compute right edge.
   * @param {any} mo Object with x, width/HitboxWidth and optional scale
   * @returns {void}
   */
  clampX(mo) {
    if (!mo) return;
    const sc = Number(mo.scale) || 1;
    const w = ((mo.HitboxWidth ?? mo.width) || 0) * sc;
    const maxX = Math.max(0, (this.levelWidth || 0) - w);
    if (!Number.isFinite(mo.x)) mo.x = 0;
    mo.x = Math.min(Math.max(mo.x, 0), maxX);
  }
}

window.World = World;