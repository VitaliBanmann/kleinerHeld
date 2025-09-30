/**
 * Advances world simulation by dt milliseconds.
 * Splits into small helpers for readability and ≤14 lines.
 * @this {World}
 * @param {number} dt Delta time in ms
 * @returns {void}
 */
World.prototype.update = function(dt) {
  if (this.updatePreChecks()) return;
  this.handlePlayerInputs();
  this.updatePlayer(dt);
  this.updatePowerups(dt);
  this.updateCameraAndClouds(dt);
  this.updateEnemies(dt);
  this.updateBoss(dt);
  this.updateBirds(dt);
  this.updateCoins(dt);
  this.checkLevelEnd();
  this.handleCleanupAndRespawns(dt);
};

/**
 * Handles pause/death overlay and returns true if update should stop.
 * @this {World}
 * @returns {boolean}
 */
World.prototype.updatePreChecks = function() {
  if (this.paused) return true;
  if (this.character?.isDead && Overlay?.state !== 'dead') {
    this.paused = true; Overlay.state = 'dead'; window.updatePauseIcon?.(); return true;
  }
  return false;
};

/**
 * Applies input flags to character movement and clamps position.
 * @this {World}
 * @returns {void}
 */
World.prototype.handlePlayerInputs = function() {
  if (keyboard?.LEFT) this.character.moveLeft?.();
  if (keyboard?.RIGHT) this.character.moveRight?.();
  this.clampX(this.character);
};

/**
 * Updates player logic: state, animation and physics.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.updatePlayer = function(dt) {
  this.character.update?.();
  this.character.updateAnimation?.(dt);
  this.character.updatePhysics?.(dt);
};

/**
 * Updates camera and cloud drift.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.updateCameraAndClouds = function(dt) {
  this.updateCamera();
  this.updateCloudDrift(dt);
};

/**
 * Updates all enemies and keeps them inside world bounds.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.updateEnemies = function(dt) {
  this.enemies.forEach(e => {
    EnemyAI.updateEnemy?.(this, e, dt);
    e.update?.(dt); e.updateAnimation?.(dt); this.clampX(e);
  });
};

/**
 * Updates boss AI and physics and disables respawns on aggro.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.updateBoss = function(dt) {
  if (!this.boss) return;
  EnemyAI.preCueBossAudio?.(this);
  EnemyAI.updateBoss?.(this, this.boss, dt);
  this.boss.update?.(dt); this.boss.updateAnimation?.(dt); this.clampX(this.boss);
  if (this.boss._aggro && this.autoRespawnEnemies) { this.autoRespawnEnemies = false; this.pendingRespawns = []; }
};

/**
 * Updates birds and respawns those leaving the world.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.updateBirds = function(dt) {
  for (const bird of this.birds) { bird.update?.(dt); if (bird.isOutOfWorld?.()) bird.respawn?.(); }
};

/**
 * Updates coins and handles pickups by the character.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.updateCoins = function(dt) {
  for (const coin of this.coins) coin.update?.(dt);
  Coin.collect(this);
};

/**
 * Checks whether the character reached level end and triggers transition.
 * Only allows level end if boss is dead or doesn't exist.
 * @this {World}
 * @returns {void}
 */
World.prototype.checkLevelEnd = function() {
  if (this.switching) return;
  if (this.boss && !this.boss.isDead) return;
  
  const a = Collision.rect(this.character);
  const b = Collision.rect(this.levelEndObject);
  if (Collision.intersects(a, b)) Level.handleEnd(this);
};

/**
 * Performs dead-entity cleanup and schedules/executes respawns.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.handleCleanupAndRespawns = function(dt) {
  worldCleanupDeadEntities(this);
  worldHandleRespawns(this, dt);
};

/**
 * Smooth camera tracking with mild look-ahead and clamped bounds.
 ** @this {World}
 * @returns {void}
 */
World.prototype.updateCamera = function() {
    const c = this.character; 
    if (!c || !this.canvas) return;
    
    const prev = this.cameraFocusRatio ?? 0.5;
    const targetFocus = keyboard?.RIGHT ? 1/3 : (keyboard?.LEFT ? 1/2 : prev);
    this.cameraFocusRatio = prev + (targetFocus - prev) * 0.25;
    const sc = Number(c.scale) || 1;
    const cw = (c.HitboxWidth ?? c.width ?? 0) * sc;
    const center = c.x + cw / 2, view = this.canvas.width;
    let worldX = (this.levelWidth <= view) ? 0 : Math.max(0, Math.min(center - view * this.cameraFocusRatio, this.levelWidth - view));
    const desired = -worldX;
    if (isNaN(this.camera_x)) this.camera_x = desired;
    else { const k = 0.15; this.camera_x += (desired - this.camera_x) * k; if (Math.abs(desired - this.camera_x) < 0.5) this.camera_x = desired; }
};

/**
 * Updates cloud drift/parallax. Initializes per-layer drift lazily.
 * @this {World}
 * @param {number} dt
 * @returns {void}
 */
World.prototype.updateCloudDrift = function(dt) {
  if (!Array.isArray(this.backgrounds)) return;
  const tw = this.tileWidth || 1200;
  for (const bg of this.backgrounds) {
    if (!bg || (!bg.isCloud && !(bg.autoDriftBase > 0))) continue;
    if (!bg._driftInited) { bg._driftInited = true; if (bg.driftDirection !== 1 && bg.driftDirection !== -1) bg.driftDirection = 1;
      bg.driftSpeed = bg.autoDriftBase || 0.02; bg._driftAcc = 0; bg.driftOffset = 0; }
    bg._driftAcc += bg.driftDirection * (bg.driftSpeed || 0.02) * dt;
    let o = bg._driftAcc % tw; if (o < 0) o += tw; bg.driftOffset = o;
  }
};

/**
 * Updates power-up logic: timers, purchases and activations.
 * Delegates to Powerups.update using the global keyboard.
 * @this {World}
 * @param {number} dt Delta time in ms
 * @returns {void}
 */
World.prototype.updatePowerups = function(dt) {
  try { Powerups.update?.(this, dt, window.keyboard); } catch {}
};