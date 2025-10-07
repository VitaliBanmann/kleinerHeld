class EnemyAI {
  static DEFAULT_BOSS_SOUND_RANGE = 800;
  
  /**
   * Updates a normal enemy (movement and attack).
   * @param {World} world
   * @param {any} enemy Enemy instance
   * @param {number} deltaTime Delta time in ms
   */
  static updateEnemy(world, enemy, deltaTime) {
    if (!world?.character || enemy.isDead) return;
    const context = this.buildContext(world.character, enemy, enemy.attackRange || 30);
    this.updateEnemyMove(enemy, context, deltaTime);
    this.tickAttackCooldown(enemy, deltaTime);
    this.tryEnemyAttack(world, enemy, context);
  }

  /**
   * Builds positional context used by AI decisions.
   * @param {any} character Character
   * @param {any} object Enemy/Boss
   * @param {number} range Attack range in px
   * @returns {{enemyRect:object,characterRect:object,enemyCenterX:number,characterCenterX:number,distance:number,inRange:boolean,facingLeft:boolean,range:number}}
   */
  static buildContext(character, object, range) {
    const enemyRect = Collision.rect(object);
    const characterRect = Collision.rect(character);
    const enemyCenterX = enemyRect.x + enemyRect.w / 2;
    const characterCenterX = characterRect.x + characterRect.w / 2;
    const distance = Math.abs(characterCenterX - enemyCenterX);
    const inRange = distance <= range;
    const facingLeft = characterCenterX < enemyCenterX;
    return { 
      enemyRect, 
      characterRect, 
      enemyCenterX, 
      characterCenterX, 
      distance, 
      inRange, 
      facingLeft, 
      range 
    };
  }

  /** Moves enemy towards character if not in range or hurt. */
  static updateEnemyMove(enemy, context, deltaTime) {
    enemy.direction = context.facingLeft;
    if (context.inRange || enemy.isHurt) return;
    const direction = context.characterCenterX > context.enemyCenterX ? 1 : -1;
    const pixelsPerFrame = enemy.speed || 1;
    enemy.x += (direction * pixelsPerFrame * deltaTime) / 16;
  }

  /** Decrements attack cooldown in milliseconds. */
  static tickAttackCooldown(object, deltaTime) {
    object.attackCooldown = Math.max(0, (object.attackCooldown || 0) - deltaTime);
  }

  /** Attempts an enemy attack when conditions are met. */
  static tryEnemyAttack(world, enemy, context) {
    if (!context.inRange || enemy.isHurt) return;
    if ((enemy.attackCooldown || 0) > 0 || enemy.isAttacking) return;
    this.startAttack(enemy);
    const attackRect = this.buildAttackRect(context.enemyRect, context.range, context.facingLeft);
    if (Collision.intersects(attackRect, context.characterRect))
      world.character.takeDamage?.(enemy.attackDamage ?? 8);
    this.afterAttack(enemy, 1000, 350);
  }

  /** Starts an attack animation/flags and plays SFX. */
  static startAttack(object) {
    object.isAttacking = true;
    object.setState?.('attack', { reset: true });
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
   * @param {Object} object
   * @param {number} cooldownMs
   * @param {number} timeoutMs
   */
  static afterAttack(object, cooldownMs, timeoutMs) {
    object.attackCooldown = cooldownMs;
    setTimeout(() => {
      object.isAttacking = false;
    }, timeoutMs);
  }

  /**
   * Boss update with aggro gating, movement, and attack.
   * @param {World} world
   * @param {any} boss Boss instance
   * @param {number} deltaTime Delta time in ms
   */
  static updateBoss(world, boss, deltaTime) {
    if (!world?.character || boss.isDead) return;
    const context = this.buildContext(world.character, boss, boss.attackRange || 100);
    if (!this.ensureBossAggro(world, boss, context)) return;
    this.updateBossMove(boss, context, deltaTime);
    this.tickAttackCooldown(boss, deltaTime);
    this.tryBossAttack(world, boss, context);
  }

  /**
   * One-shot pre-cue for boss SFX when player comes within bossSoundRange.
   * Uses per-boss range if defined, else DEFAULT_BOSS_SOUND_RANGE.
   * @param {World} world
   * @returns {void}
   */
  static preCueBossAudio(world) {
    const boss = world?.boss;
    const character = world?.character;
    if (!boss || !character || boss._audioCued) return;
    const range = Number(boss.bossSoundRange) || EnemyAI.DEFAULT_BOSS_SOUND_RANGE;
    const distanceX = Math.abs((character.x ?? 0) - (boss.x ?? 0));
    if (distanceX > range) return;
    let soundKey = null;
    if (boss instanceof BossTroll) soundKey = 'bosstroll';
    else if (boss instanceof BossDragon) soundKey = 'bossdragon';
    else if (boss instanceof BossDemon) soundKey = 'bossdemon';
    if (!soundKey) return;
    AudioManager?.playSfx?.(soundKey);
    boss._audioCued = true;
  }

  /** Ensures boss aggro (once) based on sight; avoids double SFX if pre-cued. */
  static ensureBossAggro(world, boss, context) {
    const sightRange = Math.max(
      600,
      world.canvas?.width ? world.canvas.width * 0.6 : 600
    );
    if (!boss._aggro && context.distance <= sightRange) {
      boss._aggro = true;
      if (!boss._audioCued) this.playBossSfx?.(boss);
    }
    return !!boss._aggro;
  }

  /** Moves boss if not in range/hurt. */
  static updateBossMove(boss, context, deltaTime) {
    boss.direction = context.facingLeft;
    if (context.inRange || boss.isHurt) return;
    const direction = context.characterCenterX > context.enemyCenterX ? 1 : -1;
    const pixelsPerFrame = boss.speed || 0.7;
    boss.x += (direction * pixelsPerFrame * deltaTime) / 16;
  }

  /** Tries to attack with boss-specific damage and cooldowns. */
  static tryBossAttack(world, boss, context) {
    if (!context.inRange || boss.isHurt) return;
    if ((boss.attackCooldown || 0) > 0 || boss.isAttacking) return;
    this.startAttack(boss);
    const attackRect = this.buildAttackRect(context.enemyRect, context.range, context.facingLeft);
    if (Collision.intersects(attackRect, context.characterRect))
      world.character.takeDamage?.(boss.attackDamage ?? 15);
    this.afterAttack(boss, 1500, 500);
  }

  /**
   * Processes pending respawns and schedules additional ones if needed.
   * @param {World} world
   * @param {number} deltaTime
   */
  static handleRespawns(world, deltaTime) {
    if (!world.autoRespawnEnemies || !world.enemyClassRef) return;
    const currentTime = performance.now?.() ?? Date.now();
    this.processDueRespawns(world, currentTime);
    this.scheduleNeededRespawns(world, currentTime);
  }

  /** Spawns enemies whose respawn timestamps are due. */
  static processDueRespawns(world, currentTime) {
    const dueIndices = [];
    for (let index = 0; index < world.pendingRespawns.length; index++)
      if (world.pendingRespawns[index] <= currentTime) dueIndices.push(index);
    for (let arrayIndex = dueIndices.length - 1; arrayIndex >= 0; arrayIndex--) {
      world.pendingRespawns.splice(dueIndices[arrayIndex], 1);
      this.spawnEnemyAtLevelEnd(world);
    }
  }

  /** Schedules respawns until targetEnemiesCount is reached. */
  static scheduleNeededRespawns(world, currentTime) {
    const totalIncoming = world.enemies.length + world.pendingRespawns.length;
    if (totalIncoming >= world.targetEnemiesCount) return;
    const neededCount = world.targetEnemiesCount - totalIncoming;
    for (let index = 0; index < neededCount; index++)
      world.pendingRespawns.push(currentTime + 3000 + Math.random() * 4000);
  }

  /** Removes dead enemies/boss, counts kills, and spawns coins. */
  static cleanupDeadEntities(world) {
    this.cleanupEnemies(world);
    this.cleanupBoss(world);
  }

  /** Filters out dead enemies, counts kills, and spawns coins. */
  static cleanupEnemies(world) {
    if (!Array.isArray(world.enemies)) return;
    world.enemies = world.enemies.filter(enemy => {
      if (!enemy) return false;
      const isDead = enemy.isDead || enemy.health <= 0;
      if (isDead && !enemy._countedDead) {
        world.enemiesDefeated = (world.enemiesDefeated || 0) + 1;
        this.spawnCoinsForEnemy(world, enemy);
        enemy._countedDead = true;
      }
      return !isDead;
    });
  }

  /** Handles boss death bookkeeping and removal. */
  static cleanupBoss(world) {
    const boss = world.boss;
    if (!boss) return;
    if (boss.isDead || boss.health <= 0) {
      if (!boss._countedDead) {
        world.enemiesDefeated = (world.enemiesDefeated || 0) + 1;
        this.spawnCoinsForEnemy(world, boss, { boss: true });
        boss._countedDead = true;
      }
      if (boss.deathAnimationPlayed || !boss.deathAnimationPlayed) world.boss = null;
    }
  }

  /** Plays boss-specific SFX based on instance type. */
  static playBossSfx(boss) {
    try {
      if (!boss || !window.AudioManager) return;
      let soundKey = null;
      if (boss instanceof BossTroll) soundKey = 'bosstroll';
      else if (boss instanceof BossDragon) soundKey = 'bossdragon';
      else if (boss instanceof BossDemon) soundKey = 'bossdemon';
      if (soundKey) AudioManager.playSfx(soundKey);
    } catch {}
  }

  /** Spawns a new enemy near the level end (right side). */
  static spawnEnemyAtLevelEnd(world) {
    if (!world.enemyClassRef) return;
    const enemy = new world.enemyClassRef(world.groundY);
    enemy.world = world;
    const spawnX = Math.max(0, world.levelWidth - 200);
    enemy.x = spawnX;
    enemy.y = world.groundY - (enemy.height * (Number(enemy.scale) || 1));
    world.faceTowardsCharacter(enemy);
    enemy.speed = enemy.speed ?? (0.5 + Math.random() * 1.5);
    world.enemies.push(enemy);
  }

  /** Spawns coins for a (boss) enemy, considering lucky powerup. */
  static spawnCoinsForEnemy(world, mobileObject, { boss = false } = {}) {
    if (typeof Coin !== 'function' || !mobileObject || mobileObject._coinsSpawned) return;
    mobileObject._coinsSpawned = true;
    const hasLuckyPowerup = !!world.character?.luckyPowerup;
    const coinCount = boss ? (hasLuckyPowerup ? 5 : 3) : (hasLuckyPowerup ? 2 : 1);
    const objectScale = Number(mobileObject.scale) || 1;
    const objectWidth = (mobileObject.HitboxWidth ?? mobileObject.width ?? 0) * objectScale;
    const objectHeight = (mobileObject.HitboxHeight ?? mobileObject.height ?? 0) * objectScale;
    const spawnX = mobileObject.x + objectWidth / 2;
    const spawnY = mobileObject.y + objectHeight / 2;
    Coin.spawnNear(world, spawnX, spawnY, coinCount);
  }
}

window.EnemyAI = EnemyAI;