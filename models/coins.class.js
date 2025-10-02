class Coin extends MoveableObject {

    static TYPES = {
        copper: { value: 5,  path: './assets/coin/copper.png' },
        silver: { value: 25, path: './assets/coin/silver.png' },
        gold:   { value: 100, path: './assets/coin/gold.png' }
    };

    static BOSS_DROP = { base: 3, luckyBonus: 2 };

    /**
     * Spawns multiple coins near a given position with random horizontal spread.
     * Coins are added to world.coins array and start with upward velocity.
     * @static
     * @param {Object} world - World instance containing coins array, groundY, and levelWidth
     * @param {number} x - Base X coordinate for spawning
     * @param {number} y - Base Y coordinate (typically hit/death position)
     * @param {number} [count=1] - Number of coins to spawn
     * @returns {void}
     */
    static spawnNear(world, x, y, count = 1) {
        if (!world) return;
        for (let i = 0; i < count; i++) {
            const r = Math.random();
            let type = r > 0.9 ? 'gold' : (r > 0.6 ? 'silver' : 'copper');
            const coin = new Coin(type, world);
            const offsetX = 50 + Math.random() * 50;
            const maxX = (world.levelWidth || 12000) - (coin.width * coin.scale);
            coin.x = Math.max(0, Math.min(maxX, x + offsetX));
            coin.y = y - 20;
            coin.speedY = -2 - Math.random() * 1;
            world.coins.push(coin);
        }
    }

    /**
     * Creates a new Coin instance.
     * @param {string} [typeKey='copper'] - Key from Coin.TYPES defining coin type
     * @param {Object} [world] - World reference for accessing groundY
     */
    constructor(typeKey = 'copper', world) {
        super();
        const def = Coin.TYPES[typeKey] || Coin.TYPES.copper;
        
        this.typeKey = typeKey;
        this.value = def.value;
        this.world = world || null;
        this.width = 32;
        this.height = 32;
        this.scale = 2;
        this.speedY = 0;
        this.acceleration = 0.4;

        this.bobPeriodMs = 20000;
        this.bobAmp = 20;
        this.bobBaseY = null;
        this.bobT = 0;

        this.loadImage(def.path);
    }

    /**
     * Updates coin physics (falling or bobbing) based on delta time.
     * Handles gravity-based falling until ground contact, then switches to bobbing.
     * @param {number} dt - Delta time in milliseconds (clamped internally)
     * @returns {void}
     */
    update(dt) {
        const dtMs = this.normalizeDt(dt);
        const groundY = (this.world?.groundY ?? 520) - (this.height * this.scale);
        if (this.updateFalling(dtMs, groundY)) return;
        this.updateBobbing(dtMs, groundY);
    }

    /**
     * Normalizes delta time to a safe range to prevent physics instability.
     * @param {number} dt - Raw delta time
     * @returns {number} Clamped delta time between 16 and 100 ms
     */
    normalizeDt(dt) {
        let dtMs = (typeof dt === 'number' && isFinite(dt)) ? dt : 16;
        if (dtMs > 100) dtMs = 100;
        return dtMs;
    }

    /**
     * Performs falling physics step with gravity and ground collision.
     * Snaps coin to ground when landing and initializes bobbing state.
     * @param {number} dtMs - Normalized delta time in milliseconds
     * @param {number} groundY - Ground Y coordinate
     * @returns {boolean} True if falling logic was applied this frame
     */
    updateFalling(dtMs, groundY) {
        if (this.y < groundY || this.speedY !== 0) {
            this.y += this.speedY;
            this.speedY += this.acceleration;
            if (this.y > groundY) {
                this.y = groundY; this.speedY = 0;
                this.bobBaseY = groundY; this.bobT = 0;
            }
            return true;
        }
        return false;
    }

    /**
     * Applies sinusoidal bobbing motion around the base Y position.
     * Uses triangular wave function for smooth up-down animation.
     * @param {number} dtMs - Normalized delta time in milliseconds
     * @param {number} groundY - Ground Y coordinate (fallback for baseY)
     * @returns {void}
     */
    updateBobbing(dtMs, groundY) {
        if (this.bobBaseY == null) this.bobBaseY = groundY;
        this.bobT += dtMs;
        const T = this.bobPeriodMs, half = T / 2, t = this.bobT % T;
        const k = t < half ? (t / half) : (1 - (t - half) / half);
        this.y = this.bobBaseY - this.bobAmp * k;
    }

    /**
     * Checks for player-character collision with all coins and collects them.
     * Collected coins increment character counters and are removed from world.
     * @static
     * @param {Object} world - World instance with character and coins array
     * @returns {void}
     */
    static collect(world) {
        const c = world?.character; if (!c) return;
        const crect = Collision.rect(c);
        world.coins = Coin.collectAndFilter(world, crect, c);
    }

    /**
     * Iterates all coins, detects collisions, applies pickup effects and filters.
     * @static
     * @param {Object} world - World instance
     * @param {{x:number,y:number,w:number,h:number}} crect - Character collision rectangle
     * @param {Object} c - Character instance (receives coin value increments)
     * @returns {Coin[]} Array of coins that were not collected
     */
    static collectAndFilter(world, crect, c) {
        const remaining = [];
        for (const coin of world.coins) {
            const r = Collision.rect(coin);
            if (Collision.intersects(crect, r)) Coin.applyCoinPickup(c, coin);
            else remaining.push(coin);
        }
        return remaining;
    }

    /**
     * Applies coin value to character's coin counters (current and lifetime total).
     * @static
     * @param {any} c - Character instance with coins and allcoins properties
     * @param {Coin} coin - Coin being collected
     * @returns {void}
     */
    static applyCoinPickup(c, coin) {
        const val = coin.value || 0;
        c.coins = (c.coins || 0) + val;
        c.allcoins = (c.allcoins || 0) + val;
    }

    /**
     * Computes coin drop count based on enemy type and lucky powerup status.
     * Regular enemies drop 1 coin (2 with lucky), bosses drop configured amounts.
     * @static
     * @param {Object} world - World instance with character and lucky powerup state
     * @param {boolean} boss - Whether the defeated entity is a boss
     * @returns {number} Number of coins to drop
     */
    static computeDropCount(world, boss) {
        const lucky = !!world?.character?.luckyPowerup;
        if (!boss) return lucky ? 2 : 1;
        const { base, luckyBonus } = Coin.BOSS_DROP;
        return base + (lucky ? luckyBonus : 0);
    }

    /**
     * Spawns coins when an enemy or boss is defeated.
     * Drop count varies by entity type and lucky powerup status.
     * @static
     * @param {Object} world - World instance
     * @param {any} enemy - Defeated enemy/boss instance with position data
     * @param {{boss?:boolean}} [opts={}] - Options object, set boss:true for boss drops
     * @returns {void}
     */
    static spawnForEnemy(world, enemy, opts = {}) {
        if (!world || !enemy) return;
        const boss = !!opts.boss;
        const count = Coin.computeDropCount(world, boss);
        const ex = enemy.x + ((enemy.HitboxWidth ?? enemy.width ?? 16) / 2);
        const ey = enemy.y ?? (world.groundY - 32);
        Coin.spawnNear(world, ex, ey, count);
    }
}

window.Coin = Coin;