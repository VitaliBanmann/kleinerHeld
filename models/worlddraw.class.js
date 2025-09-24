/**
 * Renders a full frame: clears canvas, applies camera, draws world, then HUD/debug/overlay.
 * Keeps method short by delegating to helpers.
 * @this {World}
 * @returns {void}
 */
World.prototype.draw = function() {
  try {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.translate(this.camera_x, 0);
    drawBackgrounds(this);
    drawBirds(this);
    drawActors(this);
  } catch (e) {} finally { this.ctx.restore(); }
  try { HUD.draw(this.ctx, this.canvas, this); } catch (e) {}
  try { debugDraw(this.ctx, this.canvas, this); } catch (e) {}
  try { Overlay.show(this.ctx, this.canvas); } catch (e) {}
};

/**
 * Draws multiple objects using addToMap for each entry.
 * Ignores non-arrays gracefully.
 * @this {World}
 * @param {any[]} objects Array of drawable/animatable objects
 * @returns {void}
 */
World.prototype.addObjectsToMap = function(objects) {
  if (!Array.isArray(objects)) return;
  for (const o of objects) this.addToMap(o);
};

/**
 * Draws a single object (animated if it provides getCurrentFrame, else static).
 * Falls back to static rendering when animation is not available.
 * @this {World}
 * @param {any} mo Moveable or drawable object
 * @returns {void}
 */
World.prototype.addToMap = function(mo) {
  if (!mo) return;
  if (tryDrawAnimated(this, mo)) return;
  tryDrawStatic(this, mo);
};

/**
 * Draws a sprite using its SpriteAnimator source rectangle.
 * Handles horizontal flip and scaling based on sprite properties.
 * @this {World}
 * @param {any} bird Sprite with {img, animator, x, y, scale, direction, def}
 * @returns {void}
 */
World.prototype.drawSprite = function(bird) {
  try {
    if (!bird?.animator) return;
    const r = bird.animator.getSourceRect?.() || {}; if (r.sw == null || r.sh == null) return;
    const scale = Number(bird.scale) || 1;
    const flip = !!(bird.direction !== bird.def?.direction);
    const ready = bird.img instanceof HTMLImageElement && bird.img.complete && bird.img.naturalWidth > 0;
    if (!ready) return;
    this.ctx.save();
    if (flip) { this.ctx.translate(bird.x + r.sw * scale, bird.y); this.ctx.scale(-scale, scale); }
    else { this.ctx.translate(bird.x, bird.y); this.ctx.scale(scale, scale); }
    this.ctx.drawImage(bird.img, r.sx, r.sy || 0, r.sw, r.sh, 0, 0, r.sw, r.sh);
    this.ctx.restore();
  } catch (e) {}
};

/**
 * Returns whether an image element is ready for drawing.
 * @param {HTMLImageElement} img Image element
 * @returns {boolean} True if complete and has natural dimensions
 */
function isImgReady(img){ return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0; }

/**
 * Draws parallax background tiles with optional cloud drift and wrap-around.
 * @param {World} world World instance providing ctx, bgTiles, backgrounds
 * @returns {void}
 */
function drawBackgrounds(world) {
  const ctx = world.ctx, tw = world.tileWidth, L = world.levelWidth;
  for (let i = 0; i < world.bgTiles.length; i++) {
    const t = world.bgTiles[i], bg = world.backgrounds[t.layer];
    if (!isImgReady(t?.img)) continue;
    const par = (bg && typeof bg.parallaxFactor === 'number') ? bg.parallaxFactor : 1;
    const drift = bg?.driftOffset || 0;
    const x = t.x - world.camera_x * (1 - par) + drift;
    ctx.drawImage(t.img, x, 0, tw, world.canvas.height);
    if (!bg || (!bg.isCloud && par === 1)) continue;
    if (bg.driftDirection === 1 && t.x === 0) ctx.drawImage(t.img, x - tw, 0, tw, world.canvas.height);
    if (bg.driftDirection === -1 && t.x === L - tw) ctx.drawImage(t.img, x + tw, 0, tw, world.canvas.height);
  }
}

/**
 * Draws all bird sprites using World.drawSprite.
 * @param {World} world World instance
 * @returns {void}
 */
function drawBirds(world) {
  for (const bird of world.birds) if (bird) world.drawSprite(bird);
}

/**
 * Draws all main actors in a fixed order (enemies, boss, coins, player, level end).
 * @param {World} world World instance
 * @returns {void}
 */
function drawActors(world) {
  world.addObjectsToMap(world.enemies);
  if (world.boss) world.addToMap(world.boss);
  world.addObjectsToMap(world.coins);
  world.addToMap(world.character);
  world.addToMap(world.levelEndObject);
}

/**
 * Tries to draw an animated object using its current frame.
 * Applies flip and scale and aligns sprite to the object's height.
 * @param {World} world World instance
 * @param {any} mo Object providing animations and getCurrentFrame()
 * @returns {boolean} True if animated draw succeeded
 */
function tryDrawAnimated(world, mo) {
  if (!(mo.animations && typeof mo.getCurrentFrame === 'function')) return false;
  const f = mo.getCurrentFrame(); if (!(f?.img && isImgReady(f.img))) return false;
  const scale = Number(mo.scale) || 1, flip = !!mo.direction;
  const w = ('sw' in f) ? f.sw : (f.width || mo.width || 0);
  const h = ('sh' in f) ? f.sh : (f.height || mo.height || 0);
  const baseH = mo.height || h, y = (mo.y ?? 0) + (baseH - h) * scale;
  const ctx = world.ctx; ctx.save();
  if (flip) { ctx.translate((mo.x ?? 0) + w * scale, y); ctx.scale(-1, 1); }
  else { ctx.translate((mo.x ?? 0), y); }
  if ('sx' in f) ctx.drawImage(f.img, f.sx, f.sy || 0, w, h, 0, 0, w * scale, h * scale);
  else ctx.drawImage(f.img, 0, 0, w, h, 0, 0, w * scale, h * scale);
  ctx.restore(); return true;
}

/**
 * Draws a non-animated object from a single image or URL.
 * Supports horizontal flip and per-object scale.
 * @param {World} world World instance
 * @param {any} mo Object with img or singleImg, x, y, width, height, scale, direction
 * @returns {void}
 */
function tryDrawStatic(world, mo) {
  if (!mo.img) return;
  if (typeof mo.img === 'string' && !mo.singleImg) { mo.singleImg = new Image(); mo.singleImg.src = mo.img; }
  const img = (mo.singleImg instanceof HTMLImageElement) ? mo.singleImg : mo.img;
  if (!isImgReady(img)) return;
  const ctx = world.ctx, scale = Number(mo.scale) || 1, flip = !!mo.direction;
  const w = (mo.width || img.width || 0) * scale, h = (mo.height || img.height || 0) * scale;
  ctx.save();
  if (flip) { ctx.translate((mo.x || 0) + w, (mo.y || 0)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); }
  else { ctx.drawImage(img, (mo.x || 0), (mo.y || 0), w, h); }
  ctx.restore();
}