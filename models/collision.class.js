class Collision {

    static debugMode = false;
    static debugRects = [];

    /**
     * (Optional) Am Frame-Beginn aufrufen, wenn integrierter Debug-Puffer genutzt werden soll.
     */
    static beginDebugFrame() {
        if (Collision.debugMode) Collision.debugRects = [];
    }

    /**
     * Zeichnet gesammelte Debug-Rechtecke.
     * @param {CanvasRenderingContext2D} ctx
     */
    static drawDebug(ctx) {
        if (!Collision.debugMode || !ctx) return;
        ctx.save();
        ctx.setLineDash([4, 2]);
        Collision.debugRects.forEach(r => {
            ctx.strokeStyle = r.color || '#ff00ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(r.x, r.y, r.w, r.h);
        });
        ctx.restore();
    }

    /**
     * Erstellt eine Hitbox für ein Objekt.
     * Erwartete (optionale) Felder:
     *  x,y,width,height,scale,
     *  HitboxWidth,HitboxHeight,
     *  HitboxOffsetX,HitboxOffsetXRight,HitboxOffsetY,
     *  hitboxAnchor ('center' für zentriert),
     *  direction (truthy => Blick nach links?),
     *  mirrorHitbox (false verhindert Spiegelung),
     *  debugColor (nur falls integrierter Debug genutzt wird)
     * @param {Object} inputObj
     * @returns {{x:number,y:number,w:number,h:number}}
     */
    static rect(inputObj) {
        if (!inputObj) return { x: 0, y: 0, w: 0, h: 0 };

        const obj = {
            x: 0, y: 0,
            width: 0, height: 0,
            scale: 1,
            HitboxWidth: null,
            HitboxHeight: null,
            HitboxOffsetX: 0,
            HitboxOffsetXRight: null,
            HitboxOffsetY: 0,
            ...inputObj
        };

        const scale = Number(obj.scale) || 1;
        const hitboxWidth  = (obj.HitboxWidth  != null) ? obj.HitboxWidth  : (obj.width  ?? 0);
        const hitboxHeight = (obj.HitboxHeight != null) ? obj.HitboxHeight : (obj.height ?? 0);
        
        const isMovingLeft = !!obj.direction;
        const offsetX = isMovingLeft 
            ? (obj.HitboxOffsetX ?? 0) 
            : (obj.HitboxOffsetXRight ?? obj.HitboxOffsetX ?? 0);
            
        const offsetY = obj.HitboxOffsetY ?? 0;

        const x = (obj.x ?? 0) + offsetX * scale;
        const y = (obj.y ?? 0) + offsetY * scale;

        const rect = {
            x,
            y,
            w: hitboxWidth * scale,
            h: hitboxHeight * scale
        };

        if (Collision.debugMode) {
            Collision.debugRects.push({
                ...rect,
                color: obj.debugColor || '#ff00ff'
            });
        }

        return rect;
    }

    /**
     * Prüft Überlappung zweier AABB-Rechtecke.
     * @param {{x:number,y:number,w:number,h:number}} a
     * @param {{x:number,y:number,w:number,h:number}} b
     * @returns {boolean}
     */
    static intersects(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    }
}

window.Collision = Collision;