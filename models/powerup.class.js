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
     * @param {Object} character Character instance
     */
    static ensureCharacterProps(character) {
        if (typeof character.coins !== 'number') character.coins = 0;
        if (typeof character.hearts !== 'number') character.hearts = 0;
        if (typeof character.weaponLevel !== 'number') character.weaponLevel = 0;
        if (typeof character.luckyPowerup !== 'boolean') character.luckyPowerup = false;
        if (typeof character.invulnPowerup !== 'boolean') character.invulnPowerup = false;
        if (typeof character.invulnActive !== 'boolean') character.invulnActive = false;
        if (typeof character.invulnCooldown !== 'number') character.invulnCooldown = 0;
        if (typeof character.invulnTimer !== 'number') character.invulnTimer = 0;
    }

    /**
     * Main update: processes timers, edge inputs, and performs purchases/activations.
     * @param {Object} world World (contains character)
     * @param {number} deltaTime Delta ms
     * @param {Object} keyboard Input object with flags (W,D1,D2,D3)
     */
    static update(world, deltaTime, keyboard) {
        const character = world.character;
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
     * @param {any} character Character
     * @param {number} deltaTime Delta ms
     */
    static updateInvulnTimers(character, deltaTime) {
        if (character.invulnActive) {
            character.invulnTimer = Math.max(0, character.invulnTimer - deltaTime);
            if (character.invulnTimer <= 0) {
                character.invulnActive = false;
                character.invulnCooldown = Powerups.invuln.cooldown;
            }
        } else {
            character.invulnCooldown = Math.max(0, character.invulnCooldown - deltaTime);
        }
    }

    /**
     * Returns true once when a key transitions to pressed.
     * @param {'W'|'D1'|'D2'|'D3'} keyCode
     * @param {boolean} currentState Current key state
     * @returns {boolean}
     */
    static isJustPressed(keyCode, currentState) {
        const previousState = Powerups.pressed[keyCode] || false;
        Powerups.pressed[keyCode] = !!currentState;
        return !!currentState && !previousState;
    }

    /**
     * Buys a heart or heals when W is pressed.
     * @param {any} character Character
     * @param {any} keyboard Keyboard state
     */
    static handleHeart(character, keyboard) {
        if (!this.isJustPressed('W', keyboard?.W)) return;
        const missingHealth = Math.max(0, (character.maxHealth || 0) - (character.health || 0));
        if ((character.hearts || 0) > 0 && missingHealth >= 30) {
            const healAmount = 30;
            character.health = Math.min(character.maxHealth, character.health + healAmount);
            character.hearts -= 1;
        } else if ((character.coins || 0) >= Powerups.prices.heart) {
            character.coins -= Powerups.prices.heart;
            character.hearts += 1;
        }
    }

    /**
     * Upgrades weapon on key 1.
     * @param {any} character Character
     * @param {any} keyboard Keyboard state
     */
    static handleWeaponUpgrade(character, keyboard) {
        if (!this.isJustPressed('D1', keyboard?.D1)) return;
        if (character.weaponLevel < 3 && (character.coins || 0) >= Powerups.prices.weapon) {
            character.coins -= Powerups.prices.weapon;
            character.weaponLevel += 1;
        }
    }

    /**
     * Purchases lucky power-up on key 2.
     * @param {any} character Character
     * @param {any} keyboard Keyboard state
     */
    static handleLuckyPurchase(character, keyboard) {
        if (!this.isJustPressed('D2', keyboard?.D2)) return;
        if (!character.luckyPowerup && (character.coins || 0) >= Powerups.prices.lucky) {
            character.coins -= Powerups.prices.lucky;
            character.luckyPowerup = true;
        }
    }

    /**
     * Buys or activates invulnerability on key 3.
     * @param {any} character Character
     * @param {any} keyboard Keyboard state
     */
    static handleInvuln(character, keyboard) {
        if (!this.isJustPressed('D3', keyboard?.D3)) return;
        if (!character.invulnPowerup && (character.coins || 0) >= Powerups.prices.invuln) {
            character.coins -= Powerups.prices.invuln;
            character.invulnPowerup = true;
        } else if (character.invulnPowerup && !character.invulnActive && character.invulnCooldown <= 0) {
            character.invulnActive = true;
            character.invulnTimer = Powerups.invuln.duration;
        }
    }
}
window.Powerups = Powerups;