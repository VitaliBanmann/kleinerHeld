class Level {

    /**
     * Builds a normalized level specification from a level reference.
     * @param {Object} levelData Raw level object or reference (e.g., window.level2)
     * @returns {{backgrounds:any[],groundY:number,levelWidth:number,tileWidth:number,bossX:number,levelEndX:number,enemiesCount:number,birdsCount:number,enemySafeZoneRight:number,enemyClass:new()=>any,bossClass:new()=>any}}
     */
    static resolve(levelData) {
        const spec = Level.defaultSpec(levelData);
        const { enemyClass, bossClass } = Level.chooseClasses(levelData);
        return { ...spec, enemyClass, bossClass };
    }

    /** Returns default numeric and array values for a level spec. */
    static defaultSpec(levelData) {
        return {
            backgrounds: levelData?.backgrounds ?? [],
            groundY: levelData?.groundY ?? 520,
            levelWidth: levelData?.levelWidth ?? 12000,
            tileWidth: levelData?.tileWidth ?? 1200,
            bossX: levelData?.bossX ?? 10600,
            levelEndX: levelData?.levelEndX ?? 10700,
            enemiesCount: levelData?.enemiesCount ?? 6,
            birdsCount: levelData?.birdsCount ?? 12,
            enemySafeZoneRight: levelData?.enemySafeZoneRight ?? 600
        };
    }

    /** Selects enemy and boss classes by level reference (L1/L2/L3). */
    static chooseClasses(levelData) {
        let enemyClass = window.EnemyLizard || EnemyLizard;
        let bossClass = window.BossTroll || BossTroll;
        if (levelData === window.level2) {
            enemyClass = window.EnemySkeleton || EnemySkeleton;
            bossClass = window.BossDragon || BossDragon;
        } else if (levelData === window.level3) {
            enemyClass = window.EnemyMinotaur || EnemyMinotaur;
            bossClass = window.BossDemon || BossDemon;
        }
        return { enemyClass, bossClass };
    }

    /**
     * Loads a level into the given World instance.
     * Applies spec, resets player, spawns enemies/boss, tiles, birds and runtime vars.
     * @param {World} world
     * @param {Object} levelData
     */
    static load(world, levelData) {
        const spec = Level.resolve(levelData);
        Level.applyLevelSpec(world, spec, levelData);
        Level.resetPlayer(world);
        Level.initEnemies(world, spec);
        Level.initBoss(world, spec);
        Level.placeLevelEndObject(world, spec);
        Level.buildBackgroundTiles(world);
        Level.initBirds(world, spec);
        Level.resetRuntimeVars(world);
    }

    /** Writes core spec values onto world. */
    static applyLevelSpec(world, spec, levelData) {
        world.currentLevel = levelData || {};
        world.backgrounds = spec.backgrounds || [];
        world.groundY = spec.groundY;
        world.levelWidth = spec.levelWidth;
        world.tileWidth = spec.tileWidth;
        world.spawnSafeZoneRight = spec.enemySafeZoneRight ?? world.spawnSafeZoneRight;
        if (spec.birdsCount != null) world.birdsCount = spec.birdsCount;
    }

    /** Resets player position and state on new level. */
    static resetPlayer(world) {
        const c = world.character;
        c.groundY = world.groundY;
        c.x = 100; c.speedY = 0;
        c.y = world.groundY - (c.height * c.scale);
        c.setState?.('idle', { reset: true });
    }

    /** Initializes enemy list and spawns initial enemies. */
    static initEnemies(world, spec) {
        world.enemies = [];
        world.targetEnemiesCount = spec.enemiesCount ?? 0;
        world.enemyClassRef = spec.enemyClass;
        const minEnemyX = Math.min(world.levelWidth - 200, world.character.x + world.spawnSafeZoneRight);
        for (let i = 0; i < spec.enemiesCount; i++) Level.spawnEnemy(world, spec, minEnemyX);
    }

    /** Spawns a single enemy at a random X right of start. */
    static spawnEnemy(world, spec, minEnemyX) {
        const E = new spec.enemyClass(world.groundY);
        E.world = world;
        E.x = world.randomXRightOfStart(minEnemyX, world.levelWidth - 200);
        E.y = world.groundY - (E.height * (Number(E.scale) || 1));
        world.faceTowardsCharacter(E);
        E.speed = E.speed ?? (0.5 + Math.random() * 1.5);
        world.enemies.push(E);
    }

    /** Initializes boss instance and places it. */
    static initBoss(world, spec) {
        world.boss = new spec.bossClass(world.groundY);
        world.boss.world = world;
        world.boss.x = spec.bossX;
        world.boss.y = world.groundY - (world.boss.height * (Number(world.boss.scale) || 1));
        world.faceTowardsCharacter(world.boss);
    }

    /** Places the level end object (treasure). */
    static placeLevelEndObject(world, spec) {
        world.levelEndObject.x = spec.levelEndX;
        world.levelEndObject.y = world.groundY - TREASURE_HEIGHT;
    }

    /** Builds tiled background image entries for draw(). */
    static buildBackgroundTiles(world) {
        world.bgTiles = [];
        for (let layer = 0; layer < world.backgrounds.length; layer++) {
            const bg = world.backgrounds[layer];
            for (let x = -world.tileWidth; x <= world.levelWidth; x += world.tileWidth) {
                world.bgTiles.push({ img: bg.img, x, layer });
            }
        }
    }

    /** Initializes birds with distributed Y positions and alternating dirs. */
    static initBirds(world, spec) {
        world.birds = [];
        const ys = [], hMin = 60, hMax = Math.max(120, world.canvas.height / 2);
        for (let i = 0; i < world.birdsCount; i++) {
            const def = Math.random() < 0.75 ? BIRD_CROW_DEFINITION : BIRD_VULTURE_DEFINITION;
            const direction = Math.random() < 0.5;
            const bird = new Bird(def, direction, world.levelWidth, world.canvas.height);
            const marginX = 80, span = world.levelWidth + 2 * marginX;
            const jitter = (Math.random() - 0.5) * (span / world.birdsCount) * 0.5;
            bird.x = Math.round((i + 0.5) * (span / world.birdsCount) - marginX + jitter);
            bird._baseY = Level.distinctY(ys, hMin, hMax, 32, 40); bird.y = bird._baseY;
            world.birds.push(bird);
        }
    }

    /** Picks a Y far enough from previous values, with fallback. */
    static distinctY(used, hMin, hMax, minDist = 32, attempts = 40) {
        for (let a = 0; a < attempts; a++) {
            const y = Math.random() * (hMax - hMin) + hMin;
            if (used.every(v => Math.abs(v - y) >= minDist)) { used.push(y); return y; }
        }
        const y = Math.random() * (hMax - hMin) + hMin; used.push(y); return y;
    }

    /** Resets runtime variables affected by level switches. */
    static resetRuntimeVars(world) {
        world.coins = [];
        world.camera_x = 0;
        world._cloudInitDone = false;
        world.pendingRespawns = [];
        world.autoRespawnEnemies = true;
        world.enemiesDefeated = 0;
    }

    /**
     * Handles level end (treasure reached).
     * Saves stats and either shows final overlay or map-change.
     * @param {World} world
     */
    static handleEnd(world) {
        if (!world || world.switching) return;
        world.switching = true;
        Level.saveStats(world);
        if (Level.finalizeIfLastLevel(world)) return;
        Level.prepareMapChange(world);
        world.switching = false;
    }

    /** Copies end-of-level stats to Overlay. */
    static saveStats(world) {
        Overlay.stats.totalCoins = world.character?.allcoins ?? world.character?.coins ?? 0;
        Overlay.stats.enemiesDefeated = world.enemiesDefeated ?? 0;
    }

    /** Shows final overlay for last level; returns true if consumed. */
    static finalizeIfLastLevel(world) {
        if (world.currentLevel !== window.level3) return false;
        Overlay.state = 'final'; world.paused = true; world.switching = false; return true;
    }

    /** Sets overlay for map change and selects next level indicator. */
    static prepareMapChange(world) {
        Overlay.state = 'mapChange'; world.paused = true;
        if (world.currentLevel === window.level1) Overlay.nextLevel = '2';
        else if (world.currentLevel === window.level2) Overlay.nextLevel = '3';
        else Overlay.nextLevel = '?';
    }
}
window.Level = Level;

/**
 * Removes dead enemies/boss, counts kills and spawns coins.
 * @param {World} world
 * @returns {void}
 */
function worldCleanupDeadEntities(world) {
    cleanupEnemies(world);
    cleanupBoss(world);
}

/** Filters enemies, counts kills and spawns coins for each dead. */
function cleanupEnemies(world) {
    if (!Array.isArray(world.enemies)) return;
    world.enemies = world.enemies.filter(e => {
        if (!e) return false;
        const dead = e.isDead || e.health <= 0;
        if (dead && !e._countedDead) {
            world.enemiesDefeated = (world.enemiesDefeated || 0) + 1;
            Coin.spawnForEnemy(world, e); e._countedDead = true;   // changed
        }
        return !dead;
    });
}

/** Handles boss cleanup and coin spawn once. */
function cleanupBoss(world) {
    const b = world.boss; if (!b) return;
    if (b.isDead || b.health <= 0) {
        if (!b._countedDead) {
            world.enemiesDefeated = (world.enemiesDefeated || 0) + 1;
            Coin.spawnForEnemy(world, b, { boss: true }); b._countedDead = true; // changed
        }
        if (b.deathAnimationPlayed || !b.deathAnimationPlayed) world.boss = null;
    }
}

/**
 * Respawn logic: processes due respawns and schedules new ones.
 * @param {World} world
 * @param {number} dt
 */
function worldHandleRespawns(world, dt) {
    if (!world.autoRespawnEnemies || !world.enemyClassRef) return;
    const now = performance.now?.() ?? Date.now();
    worldProcessDueRespawns(world, now);
    worldScheduleNeededRespawns(world, now);
}

/** Spawns enemies whose timestamps are due. */
function worldProcessDueRespawns(world, now) {
    const due = [];
    for (let i = 0; i < (world.pendingRespawns?.length || 0); i++)
        if (world.pendingRespawns[i] <= now) due.push(i);
    for (let k = due.length - 1; k >= 0; k--) {
        world.pendingRespawns.splice(due[k], 1);
        worldSpawnEnemyAtLevelEnd(world);
    }
}

/** Schedules respawns until targetEnemiesCount is reached. */
function worldScheduleNeededRespawns(world, now) {
    const incoming = world.enemies.length + world.pendingRespawns.length;
    if (incoming >= world.targetEnemiesCount) return;
    const need = world.targetEnemiesCount - incoming;
    for (let i = 0; i < need; i++) world.pendingRespawns.push(now + 3000 + Math.random() * 4000);
}

/** Creates a simple coin object with physics properties. */
function makeSimpleCoin(world, x, y) {
  const size = 16;
  const coin = { x, y, width:size, height:size, value:1, vx:(Math.random()*2-1)*2, vy:-4-Math.random()*2,
    update(dt) {
      this.vy += 0.002 * dt;
      this.x += this.vx; this.y += this.vy;
      const floor = world.groundY - this.height;
      if (this.y > floor) { this.y=floor; this.vy=0; this.vx*=0.98; }
    }
  };
  return coin;
}

/** Spawns a single enemy near the level end (used for timed respawns). */
function worldSpawnEnemyAtLevelEnd(world) {
  const E = world?.enemyClassRef ? new world.enemyClassRef(world.groundY) : null;
  if (!world || !E) return;
  E.world = world;
  const minX = Math.min(world.levelWidth - 200, world.character.x + world.spawnSafeZoneRight);
  E.x = world.randomXRightOfStart(minX, world.levelWidth - 200);
  E.y = world.groundY - (E.height * (Number(E.scale) || 1));
  world.faceTowardsCharacter(E);
  E.speed = E.speed ?? (0.5 + Math.random() * 1.5);
  world.enemies.push(E);
}