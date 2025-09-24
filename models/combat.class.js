class Combat {

    /**
     * Wendet horizontalen Rückstoß auf ein Zielobjekt an.
     * Richtung: vom Angreifer weg.
     * Clamped anschließend optional über world.clampX.
     * @param {Object} world Welt-Instanz (optional clampX)
     * @param {Object} target Ziel-Entity (muss x,width,scale besitzen)
     * @param {Object} from Angreifer (für Richtungsbestimmung; optional)
     * @param {number} [amount=30] Verschiebung in Pixeln
     */
    static applyKnockback(world, target, from, amount = 30) {
        if (!target) return;
        const tScale = Number(target.scale) || 1;
        const fScale = Number(from?.scale) || 1;
        const tCenter = (target.x || 0) + ((target.width || 0) * tScale) / 2;
        const fCenter = (from?.x || 0) + ((from?.width || 0) * fScale) / 2;
        const dir = (tCenter >= fCenter) ? 1 : -1;
        target.x += dir * amount;
        world?.clampX?.(target);
    }

    /**
     * Spieler Nahkampfangriff: erstellt ein Angriffs-Rechteck, sammelt Treffer, wendet Schaden/Rückstoß an.
     * @param {Object} world
     * @param {string} [kind='attack']
     * @returns {void}
     */
    static playerAttack(world, kind = 'attack') {
        const c = this.getPlayer(world); if (!c) return;
        AudioManager?.playSfx?.('sword');
        const dmg = this.damageForLevel(c.weaponLevel || 0);
        const atkRect = this.buildAttackRect(Collision.rect(c), c.attackRange || 30, !!c.direction);
        const hits = this.collectHits(world, atkRect);
        this.applyHits(world, c, hits, dmg);
    }

    /** @returns {any|null} character or null if unavailable/dead */
    static getPlayer(world) { const c = world?.character; return (!c || c.isDead) ? null : c; }

    /** @param {number} lvl @returns {number} damage by weapon level */
    static damageForLevel(lvl) { return [10, 13, 16, 20][Math.max(0, Math.min(3, lvl))]; }

    /**
     * @param {{x:number,y:number,w:number,h:number}} cr
     * @param {number} range
     * @param {boolean} facingLeft
     */
    static buildAttackRect(cr, range, facingLeft) {
        return { x: facingLeft ? (cr.x - range) : (cr.x + cr.w), y: cr.y, w: range, h: cr.h };
    }

    /** @returns {any[]} enemies and boss that intersect the rect */
    static collectHits(world, rect) {
        const hits = [];
        for (const e of (world.enemies || [])) if (e && !e.isDead && Collision.intersects(rect, Collision.rect(e))) hits.push(e);
        if (world.boss && !world.boss.isDead && Collision.intersects(rect, Collision.rect(world.boss))) hits.push(world.boss);
        return hits;
    }

    /** Fügt Schaden und Rückstoß hinzu (kein Rückstoß für den Boss). */
    static applyHits(world, c, targets, dmg) {
        for (const t of targets) {
            t.takeDamage?.(dmg);
            if (t !== world.boss) Combat.applyKnockback(world, t, c, 30);
        }
    }
}

window.Combat = Combat;