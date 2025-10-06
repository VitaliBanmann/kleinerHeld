class Combat {

    /**
     * Applies horizontal knockback to a target object.
     * Direction: away from the attacker.
     * Clamped afterwards optionally via world.clampX.
     * @param {Object} world World instance (optional clampX)
     * @param {Object} target Target entity (must have x, width, scale)
     * @param {Object} attacker Attacker (for direction determination; optional)
     * @param {number} [knockbackAmount=30] Offset in pixels
     */
    static applyKnockback(world, target, attacker, knockbackAmount = 30) {
        if (!target) return;
        const targetScale = Number(target.scale) || 1;
        const attackerScale = Number(attacker?.scale) || 1;
        const targetCenter = (target.x || 0) + ((target.width || 0) * targetScale) / 2;
        const attackerCenter = (attacker?.x || 0) + ((attacker?.width || 0) * attackerScale) / 2;
        const direction = (targetCenter >= attackerCenter) ? 1 : -1;
        target.x += direction * knockbackAmount;
        world?.clampX?.(target);
    }

    /**
     * Player melee attack: creates an attack rectangle, collects hits, applies damage/knockback.
     * @param {Object} world
     * @param {string} [attackType='attack']
     * @returns {void}
     */
    static playerAttack(world, attackType = 'attack') {
        const playerCharacter = this.getPlayer(world); if (!playerCharacter) return;
        AudioManager?.playSfx?.('sword');
        const damage = this.damageForLevel(playerCharacter.weaponLevel || 0);
        const attackRectangle = this.buildAttackRect(Collision.rect(playerCharacter), playerCharacter.attackRange || 30, !!playerCharacter.direction);
        const hits = this.collectHits(world, attackRectangle);
        this.applyHits(world, playerCharacter, hits, damage);
    }

    /** @returns {any|null} character or null if unavailable/dead */
    static getPlayer(world) { const playerCharacter = world?.character; return (!playerCharacter || playerCharacter.isDead) ? null : playerCharacter; }

    /** @param {number} level @returns {number} damage by weapon level */
    static damageForLevel(level) { return [10, 13, 16, 20][Math.max(0, Math.min(3, level))]; }

    /**
     * @param {{x:number,y:number,w:number,h:number}} collisionRect
     * @param {number} attackRange
     * @param {boolean} facingLeft
     */
    static buildAttackRect(collisionRect, attackRange, facingLeft) {
        return { x: facingLeft ? (collisionRect.x - attackRange) : (collisionRect.x + collisionRect.w), y: collisionRect.y, w: attackRange, h: collisionRect.h };
    }

    /** @returns {any[]} enemies and boss that intersect the rect */
    static collectHits(world, attackRectangle) {
        const hits = [];
        for (const enemy of (world.enemies || [])) if (enemy && !enemy.isDead && Collision.intersects(attackRectangle, Collision.rect(enemy))) hits.push(enemy);
        if (world.boss && !world.boss.isDead && Collision.intersects(attackRectangle, Collision.rect(world.boss))) hits.push(world.boss);
        return hits;
    }

    /** Adds damage and knockback for enemies. */
    static applyHits(world, playerCharacter, targets, damage) {
        for (const target of targets) {
            target.takeDamage?.(damage);
            if (target !== world.boss) Combat.applyKnockback(world, target, playerCharacter, 30);
        }
    }
}

window.Combat = Combat;