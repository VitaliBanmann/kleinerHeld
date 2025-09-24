class EnemyAI {
  static DEFAULT_BOSS_SOUND_RANGE = 800;
  /**
   * Updates a normal enemy (movement and attack).
   * @param {World} world
   * @param {any} e Enemy instance
   * @param {number} dt Delta time in ms
   */
  static updateEnemy(world, e, dt) {
    if (!world?.character || e.isDead) return;
    const ctx = this.buildContext(world.character, e, e.attackRange || 30);
    this.updateEnemyMove(e, ctx, dt);
    this.tickAttackCooldown(e, dt);
    this.tryEnemyAttack(world, e, ctx);
  }

  /**
   * Builds positional context used by AI decisions.
   * @param {any} c Character
   * @param {any} obj Enemy/Boss
   * @param {number} range Attack range in px
   * @returns {{er:object,cr:object,ecx:number,ccx:number,dist:number,inRange:boolean,facingLeft:boolean,range:number}}
   */
  static buildContext(c, obj, range) {
    const er = Collision.rect(obj),
      cr = Collision.rect(c);
    const ecx = er.x + er.w / 2,
      ccx = cr.x + cr.w / 2;
    const dist = Math.abs(ccx - ecx),
      inRange = dist <= range;
    const facingLeft = ccx < ecx;
    return { er, cr, ecx, ccx, dist, inRange, facingLeft, range };
  }

  /** Moves enemy towards character if not in range or hurt. */
  static updateEnemyMove(e, ctx, dt) {
    e.direction = ctx.facingLeft;
    if (ctx.inRange || e.isHurt) return;
    const dir = ctx.ccx > ctx.ecx ? 1 : -1;
    const pxPerFrame = e.speed || 1;
    e.x += (dir * pxPerFrame * dt) / 16;
  }

  /** Decrements attack cooldown in milliseconds. */
  static tickAttackCooldown(obj, dt) {
    obj.attackCooldown = Math.max(0, (obj.attackCooldown || 0) - dt);
  }

  /** Attempts an enemy attack when conditions are met. */
  static tryEnemyAttack(world, e, ctx) {
    if (!ctx.inRange || e.isHurt) return;
    if ((e.attackCooldown || 0) > 0 || e.isAttacking) return;
    this.startAttack(e);
    const atk = this.buildAttackRect(ctx.er, ctx.range, ctx.facingLeft);
    if (Collision.intersects(atk, ctx.cr))
      world.character.takeDamage?.(e.attackDamage ?? 8);
    this.afterAttack(e, 1000, 350);
  }

  /** Starts an attack animation/flags and plays SFX. */
  static startAttack(obj) {
    obj.isAttacking = true;
    obj.setState?.('attack', { reset: true });
    AudioManager?.playSfx?.('spear');
  }

  /** Builds an attack rectangle from a base rect, range and facing. */
  static buildAttackRect(rect, range, facingLeft) {
    return {
      x: facingLeft ? rect.x - range : rect.x + rect.w,
      y: rect.y,
      w: range,
      h: rect.h,
    };
  }

  /**
   * Sets cooldown and resets attack flag after a timeout.
   * @param {Object} obj
   * @param {number} cooldownMs
   * @param {number} offMs
   */
  static afterAttack(obj, cooldownMs, offMs) {
    obj.attackCooldown = cooldownMs;
    setTimeout(() => {
      obj.isAttacking = false;
    }, offMs);
  }

  /**
   * Boss update with aggro gating, movement, and attack.
   * @param {World} world
   * @param {any} b Boss instance
   * @param {number} dt Delta time in ms
   */
  static updateBoss(world, b, dt) {
    if (!world?.character || b.isDead) return;
    const ctx = this.buildContext(world.character, b, b.attackRange || 100);
    if (!this.ensureBossAggro(world, b, ctx)) return;
    this.updateBossMove(b, ctx, dt);
    this.tickAttackCooldown(b, dt);
    this.tryBossAttack(world, b, ctx);
  }

  /**
   * One-shot pre-cue for boss SFX when player comes within bossSoundRange.
   * Uses per-boss range if defined, else DEFAULT_BOSS_SOUND_RANGE.
   * @param {World} world
   * @returns {void}
   */
  static preCueBossAudio(world) {
    const b = world?.boss,
      c = world?.character;
    if (!b || !c || b._audioCued) return;
    const range = Number(b.bossSoundRange) || EnemyAI.DEFAULT_BOSS_SOUND_RANGE;
    const dx = Math.abs((c.x ?? 0) - (b.x ?? 0));
    if (dx > range) return;
    let key = null;
    if (b instanceof BossTroll) key = 'bosstroll';
    else if (b instanceof BossDragon) key = 'bossdragon';
    else if (b instanceof BossDemon) key = 'bossdemon';
    if (!key) return;
    AudioManager?.playSfx?.(key);
    b._audioCued = true;
  }

  /** Ensures boss aggro (once) based on sight; avoids double SFX if pre-cued. */
  static ensureBossAggro(world, b, ctx) {
    const sight = Math.max(
      600,
      world.canvas?.width ? world.canvas.width * 0.6 : 600
    );
    if (!b._aggro && ctx.dist <= sight) {
      b._aggro = true;
      if (!b._audioCued) this.playBossSfx?.(b);
    }
    return !!b._aggro;
  }

  /** Moves boss if not in range/hurt. */
  static updateBossMove(b, ctx, dt) {
    b.direction = ctx.facingLeft;
    if (ctx.inRange || b.isHurt) return;
    const dir = ctx.ccx > ctx.ecx ? 1 : -1;
    const pxPerFrame = b.speed || 0.7;
    b.x += (dir * pxPerFrame * dt) / 16;
  }

  /** Tries to attack with boss-specific damage and cooldowns. */
  static tryBossAttack(world, b, ctx) {
    if (!ctx.inRange || b.isHurt) return;
    if ((b.attackCooldown || 0) > 0 || b.isAttacking) return;
    this.startAttack(b);
    const atk = this.buildAttackRect(ctx.er, ctx.range, ctx.facingLeft);
    if (Collision.intersects(atk, ctx.cr))
      world.character.takeDamage?.(b.attackDamage ?? 15);
    this.afterAttack(b, 1500, 500);
  }

  /**
   * Processes pending respawns and schedules additional ones if needed.
   * @param {World} world
   * @param {number} dt
   */
  static handleRespawns(world, dt) {
    if (!world.autoRespawnEnemies || !world.enemyClassRef) return;
    const now = performance.now?.() ?? Date.now();
    this.processDueRespawns(world, now);
    this.scheduleNeededRespawns(world, now);
  }

  /** Spawns enemies whose respawn timestamps are due. */
  static processDueRespawns(world, now) {
    const due = [];
    for (let i = 0; i < world.pendingRespawns.length; i++)
      if (world.pendingRespawns[i] <= now) due.push(i);
    for (let k = due.length - 1; k >= 0; k--) {
      world.pendingRespawns.splice(due[k], 1);
      this.spawnEnemyAtLevelEnd(world);
    }
  }

  /** Schedules respawns until targetEnemiesCount is reached. */
  static scheduleNeededRespawns(world, now) {
    const totalIncoming = world.enemies.length + world.pendingRespawns.length;
    if (totalIncoming >= world.targetEnemiesCount) return;
    const need = world.targetEnemiesCount - totalIncoming;
    for (let i = 0; i < need; i++)
      world.pendingRespawns.push(now + 3000 + Math.random() * 4000);
  }

  /** Removes dead enemies/boss, counts kills, and spawns coins. */
  static cleanupDeadEntities(world) {
    this.cleanupEnemies(world);
    this.cleanupBoss(world);
  }

  /** Filters out dead enemies, counts kills, and spawns coins. */
  static cleanupEnemies(world) {
    if (!Array.isArray(world.enemies)) return;
    world.enemies = world.enemies.filter(e => {
      if (!e) return false;
      const dead = e.isDead || e.health <= 0;
      if (dead && !e._countedDead) {
        world.enemiesDefeated = (world.enemiesDefeated || 0) + 1;
        this.spawnCoinsForEnemy(world, e);
        e._countedDead = true;
      }
      return !dead;
    });
  }

  /** Handles boss death bookkeeping and removal. */
  static cleanupBoss(world) {
    const b = world.boss;
    if (!b) return;
    if (b.isDead || b.health <= 0) {
      if (!b._countedDead) {
        world.enemiesDefeated = (world.enemiesDefeated || 0) + 1;
        this.spawnCoinsForEnemy(world, b, { boss: true });
        b._countedDead = true;
      }
      if (b.deathAnimationPlayed || !b.deathAnimationPlayed) world.boss = null;
    }
  }

  /** Plays boss-specific SFX based on instance type. */
  static playBossSfx(boss) {
    try {
      if (!boss || !window.AudioManager) return;
      let key = null;
      if (boss instanceof BossTroll) key = 'bosstroll';
      else if (boss instanceof BossDragon) key = 'bossdragon';
      else if (boss instanceof BossDemon) key = 'bossdemon';
      if (key) AudioManager.playSfx(key);
    } catch {}
  }

  /** Spawns a new enemy near the level end (right side). */
  static spawnEnemyAtLevelEnd(world) {
    if (!world.enemyClassRef) return;
    const e = new world.enemyClassRef(world.groundY);
    e.world = world;
    const x = Math.max(0, world.levelWidth - 200);
    e.x = x;
    e.y = world.groundY - (e.height * (Number(e.scale) || 1));
    world.faceTowardsCharacter(e);
    e.speed = e.speed ?? (0.5 + Math.random() * 1.5);
    world.enemies.push(e);
  }

  /** Spawns coins for a (boss) enemy, considering lucky powerup. */
  static spawnCoinsForEnemy(world, mo, { boss = false } = {}) {
    if (typeof Coin !== 'function' || !mo || mo._coinsSpawned) return;
    mo._coinsSpawned = true;
    const lucky = !!world.character?.luckyPowerup;
    const count = boss ? (lucky ? 5 : 3) : (lucky ? 2 : 1);
    const sc = Number(mo.scale) || 1;
    const w = (mo.HitboxWidth ?? mo.width ?? 0) * sc;
    const h = (mo.HitboxHeight ?? mo.height ?? 0) * sc;
    const sx = mo.x + w / 2;
    const sy = mo.y + h / 2;
    Coin.spawnNear(world, sx, sy, count);
  }
}

window.EnemyAI = EnemyAI;