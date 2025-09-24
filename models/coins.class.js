class Coin extends MoveableObject {

    static TYPES = {
        copper: { value: 5,  path: './assets/coin/copper.png' },
        silver: { value: 25, path: './assets/coin/silver.png' },
        gold:   { value: 100, path: './assets/coin/gold.png' }
    };

    /** Config: boss coin drop counts. */
    static BOSS_DROP = { base: 3, luckyBonus: 2 };

    /**
     * Spawnt mehrere Coins nahe einer Position.
     * @param {Object} world Welt (enthält coins[], groundY, levelWidth)
     * @param {number} x Basis-X
     * @param {number} y Basis-Y (Treffer-/Todesposition)
     * @param {number} [count=1] Anzahl Münzen
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
     * Konstruktor.
     * @param {string} [typeKey='copper'] Schlüssel aus Coin.TYPES
     * @param {Object} [world] Welt-Referenz (für groundY)
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

        // Bobbing-Parameter
        this.bobPeriodMs = 20000;
        this.bobAmp = 20;
        this.bobBaseY = null;
        this.bobT = 0;
        this.loadImage(def.path);
    }

    /**
     * Aktualisiert Physik (Fallen) oder Bobbing.
     * Splits into helpers to remain short.
     * @param {number} dt Delta time in ms (clamped).
     * @returns {void}
     */
    update(dt) {
        const dtMs = this.normalizeDt(dt);
        const groundY = (this.world?.groundY ?? 520) - (this.height * this.scale);
        if (this.updateFalling(dtMs, groundY)) return;
        this.updateBobbing(dtMs, groundY);
    }

    /**
     * Normalizes delta time to a sane range.
     * @param {number} dt
     * @returns {number}
     */
    normalizeDt(dt) {
        let dtMs = (typeof dt === 'number' && isFinite(dt)) ? dt : 16;
        if (dtMs > 100) dtMs = 100;
        return dtMs;
    }

    /**
     * Performs falling step; snaps to ground and initializes bobbing.
     * @param {number} dtMs
     * @param {number} groundY
     * @returns {boolean} True if falling logic handled this frame.
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
     * Applies bobbing motion around the base Y.
     * @param {number} dtMs
     * @param {number} groundY
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
     * Prüft Spieler-Kollisionen; eingesammelte Coins erhöhen Spieler-Werte.
     * Entfernt gesammelte Coins aus world.coins.
     * @param {Object} world Welt mit character und coins[]
     */
    static collect(world) {
        const c = world?.character; if (!c) return;
        const crect = Collision.rect(c);
        world.coins = Coin.collectAndFilter(world, crect, c);
    }

    /**
     * Iterates coins, applies pickups on collision, returns remaining coins.
     * @param {Object} world
     * @param {{x:number,y:number,w:number,h:number}} crect
     * @param {Object} c Character reference (counters are increased)
     * @returns {Coin[]} Remaining coins
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
     * Applies coin value to character counters (coins and allcoins).
     * @param {any} c Character
     * @param {Coin} coin
     * @returns {void}
     */
    static applyCoinPickup(c, coin) {
        const val = coin.value || 0;
        c.coins = (c.coins || 0) + val;
        c.allcoins = (c.allcoins || 0) + val;
    }

    /** Computes drop count (enemy: 1/2, boss: configurable). */
    static computeDropCount(world, boss) {
        const lucky = !!world?.character?.luckyPowerup;
        if (!boss) return lucky ? 2 : 1;
        const { base, luckyBonus } = Coin.BOSS_DROP;
        return base + (lucky ? luckyBonus : 0);
    }

    /**
     * Spawns coins when an enemy or boss dies.
     * For enemies: 1 (2 with Lucky). For bosses: BOSS_DROP.base (+luckyBonus with Lucky).
     * @param {Object} world
     * @param {any} enemy
     * @param {{boss?:boolean}} [opts]
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