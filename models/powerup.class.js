class Powerups {
    static prices = {
        heart: 50,
        weapon: 200,
        lucky: 150,
        invuln: 200
    };

    static invuln = {
        cooldown: 60000,
        duration: 3000
    };

    /**
     * Internal edge-detect status for input keys (flags last pressed).
     * @type {{W:boolean,D1:boolean,D2:boolean,D3:boolean}}
     * @private
     */
    static pressed = { W:false, D1:false, D2:false, D3:false };

    /**
     * Ensures all required character properties are present (default values).
     * @param {Object} c Character instance
     */
    static ensureCharacterProps(c) {
        if (typeof c.coins !== 'number') c.coins = 0;
        if (typeof c.hearts !== 'number') c.hearts = 0;
        if (typeof c.weaponLevel !== 'number') c.weaponLevel = 0;
        if (typeof c.luckyPowerup !== 'boolean') c.luckyPowerup = false;
        if (typeof c.invulnPowerup !== 'boolean') c.invulnPowerup = false;
        if (typeof c.invulnActive !== 'boolean') c.invulnActive = false;
        if (typeof c.invulnCooldown !== 'number') c.invulnCooldown = 0;
        if (typeof c.invulnTimer !== 'number') c.invulnTimer = 0;
    }

    /**
     * Main update: processes timers, edge inputs, and performs purchases/activations.
     * @param {Object} world World (contains character)
     * @param {number} deltaTime Delta ms
     * @param {Object} keyboard Input object with flags (W,D1,D2,D3)
     */
    static update(world, deltaTime, keyboard) {
        const character = world.character; // Descriptive variable
        if (!character) return;
        Powerups.ensureCharacterProps(character);

        this.updateInvulnTimers(character, deltaTime);
        this.handleHeart(character, keyboard);
        this.handleWeaponUpgrade(character, keyboard);
        this.handleLuckyPurchase(character, keyboard);
        this.handleInvuln(character, keyboard);
    }

    /**
     * Updates invulnerability timers and cooldowns.
     * @param {any} c Character
     * @param {number} dt Delta ms
     */
    static updateInvulnTimers(c, dt) {
        if (c.invulnActive) {
            c.invulnTimer = Math.max(0, c.invulnTimer - dt);
            if (c.invulnTimer <= 0) {
                c.invulnActive = false;
                c.invulnCooldown = Powerups.invuln.cooldown;
            }
        } else {
            c.invulnCooldown = Math.max(0, c.invulnCooldown - dt);
        }
    }

    /**
     * Returns true once when a key transitions to pressed.
     * @param {'W'|'D1'|'D2'|'D3'} code
     * @param {boolean} now Current key state
     * @returns {boolean}
     */
    static isJustPressed(code, now) {
        const was = Powerups.pressed[code] || false;
        Powerups.pressed[code] = !!now;
        return !!now && !was;
    }

    /**
     * Buys a heart or heals when W is pressed.
     * @param {any} c Character
     * @param {any} keyboard Keyboard state
     */
    static handleHeart(c, keyboard) {
        if (!this.isJustPressed('W', keyboard?.W)) return;
        const missing = Math.max(0, (c.maxHealth || 0) - (c.health || 0));
        if ((c.hearts || 0) > 0 && missing >= 30) {
            const heal = 30;
            c.health = Math.min(c.maxHealth, c.health + heal);
            c.hearts -= 1;
        } else if ((c.coins || 0) >= Powerups.prices.heart) {
            c.coins -= Powerups.prices.heart;
            c.hearts += 1;
        }
    }

    /**
     * Upgrades weapon on key 1.
     * @param {any} c Character
     * @param {any} keyboard Keyboard state
     */
    static handleWeaponUpgrade(c, keyboard) {
        if (!this.isJustPressed('D1', keyboard?.D1)) return;
        if (c.weaponLevel < 3 && (c.coins || 0) >= Powerups.prices.weapon) {
            c.coins -= Powerups.prices.weapon;
            c.weaponLevel += 1;
        }
    }

    /**
     * Purchases lucky power-up on key 2.
     * @param {any} c Character
     * @param {any} keyboard Keyboard state
     */
    static handleLuckyPurchase(c, keyboard) {
        if (!this.isJustPressed('D2', keyboard?.D2)) return;
        if (!c.luckyPowerup && (c.coins || 0) >= Powerups.prices.lucky) {
            c.coins -= Powerups.prices.lucky;
            c.luckyPowerup = true;
        }
    }

    /**
     * Buys or activates invulnerability on key 3.
     * @param {any} c Character
     * @param {any} keyboard Keyboard state
     */
    static handleInvuln(c, keyboard) {
        if (!this.isJustPressed('D3', keyboard?.D3)) return;
        if (!c.invulnPowerup && (c.coins || 0) >= Powerups.prices.invuln) {
            c.coins -= Powerups.prices.invuln;
            c.invulnPowerup = true;
        } else if (c.invulnPowerup && !c.invulnActive && c.invulnCooldown <= 0) {
            c.invulnActive = true;
            c.invulnTimer = Powerups.invuln.duration;
        }
    }
}
window.Powerups = Powerups;