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
     * Interner Edge-Detect Status für Eingabetasten (Flags zuletzt gedrückt).
     * @type {{W:boolean,D1:boolean,D2:boolean,D3:boolean}}
     * @private
     */
    static pressed = { W:false, D1:false, D2:false, D3:false };

    /**
     * Stellt sicher, dass alle benötigten Charakter-Properties vorhanden sind (Defaultwerte).
     * @param {Object} c Character Instanz
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
     * Haupt-Update: verarbeitet Timer, Edge-Inputs und führt Käufe / Aktivierungen aus.
     * @param {Object} world Welt (enthält character)
     * @param {number} dt Delta ms
     * @param {Object} keyboard Eingabeobjekt mit Flags (W,D1,D2,D3)
     */
    static update(world, dt, keyboard) {
        const c = world.character;
        if (!c) return;
        Powerups.ensureCharacterProps(c);

        if (c.invulnActive) {
            c.invulnTimer = Math.max(0, c.invulnTimer - dt);
            if (c.invulnTimer <= 0) {
                c.invulnActive = false;
                c.invulnCooldown = Powerups.invuln.cooldown;
            }
        } else {
            c.invulnCooldown = Math.max(0, c.invulnCooldown - dt);
        }

        /**
         * Edge-Detection für Tasten (nur auf steigender Flanke true).
         * @param {'W'|'D1'|'D2'|'D3'} code
         * @param {boolean} now Aktueller Tastenzustand
         * @returns {boolean} true wenn gerade neu gedrückt
         */
        const edge = (code, now) => {
            const was = Powerups.pressed[code] || false;
            Powerups.pressed[code] = !!now;
            return now && !was;
        };

        // W: Herz kaufen oder heilen
        if (edge('W', keyboard?.W)) {
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

        // 1: Waffe upgraden
        if (edge('D1', keyboard?.D1)) {
            if (c.weaponLevel < 3 && (c.coins || 0) >= Powerups.prices.weapon) {
                c.coins -= Powerups.prices.weapon;
                c.weaponLevel += 1;
            }
        }

        // 2: Lucky kaufen
        if (edge('D2', keyboard?.D2)) {
            if (!c.luckyPowerup && (c.coins || 0) >= Powerups.prices.lucky) {
                c.coins -= Powerups.prices.lucky;
                c.luckyPowerup = true;
            }
        }

        // 3: Invuln kaufen oder aktivieren
        if (edge('D3', keyboard?.D3)) {
            if (!c.invulnPowerup && (c.coins || 0) >= Powerups.prices.invuln) {
                c.coins -= Powerups.prices.invuln;
                c.invulnPowerup = true;
            } else if (c.invulnPowerup && !c.invulnActive && c.invulnCooldown <= 0) {
                c.invulnActive = true;
                c.invulnTimer = Powerups.invuln.duration;
            }
        }
    }
}
window.Powerups = Powerups;