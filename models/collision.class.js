class Collision {

    static debugMode = false;
    static debugRects = [];

    /**
     * Clears the debug rectangle buffer at the beginning of each frame.
     * Should be called once per frame when debug mode is active.
     * @static
     * @returns {void}
     */
    static beginDebugFrame() {
        if (Collision.debugMode) Collision.debugRects = [];
    }

    /**
     * Renders all collected debug rectangles with dashed outlines.
     * Typically called at the end of the rendering pipeline.
     * @static
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @returns {void}
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
     * Creates a collision rectangle (hitbox) for a game object.
     * Supports various customization options including offsets, scaling,
     * directional mirroring, and debug visualization.
     * 
     * Expected object properties (all optional):
     * - x, y: World position
     * - width, height: Base dimensions
     * - scale: Rendering scale multiplier
     * - HitboxWidth, HitboxHeight: Custom hitbox size
     * - HitboxOffsetX, HitboxOffsetXRight: Horizontal offset (direction-dependent)
     * - HitboxOffsetY: Vertical offset
     * - hitboxAnchor: 'center' for centered hitboxes
     * - direction: Truthy for left-facing entities
     * - mirrorHitbox: False prevents offset mirroring
     * - debugColor: Color for debug visualization
     * 
     * @static
     * @param {Object} inputObj - Game object with collision properties
     * @returns {{x:number,y:number,w:number,h:number}} Axis-aligned bounding box
     */
    static rect(inputObj) {
        if (!inputObj) return { x: 0, y: 0, w: 0, h: 0 };
        const obj = Collision.normalizeInput(inputObj);
        const { hitboxWidth, hitboxHeight } = Collision.computeDimensions(obj);
        const offsetX = Collision.computeOffsetX(obj);
        const rect = Collision.buildRect(obj, offsetX, hitboxWidth, hitboxHeight);
        Collision.registerDebugRect(rect, obj.debugColor);
        return rect;
    }

    /**
     * Normalizes input object by providing default values for missing properties.
     * @static
     * @param {Object} inputObj - Raw input object
     * @returns {Object} Normalized object with all required properties
     * @private
     */
    static normalizeInput(inputObj) {
        return {
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
    }

    /**
     * Computes the scaled hitbox dimensions from object properties.
     * Falls back to base width/height if custom hitbox size is not specified.
     * @static
     * @param {Object} obj - Normalized object
     * @returns {{hitboxWidth:number,hitboxHeight:number}} Scaled dimensions
     * @private
     */
    static computeDimensions(obj) {
        const scale = Number(obj.scale) || 1;
        const hitboxWidth = (obj.HitboxWidth != null) ? obj.HitboxWidth : (obj.width ?? 0);
        const hitboxHeight = (obj.HitboxHeight != null) ? obj.HitboxHeight : (obj.height ?? 0);
        return {
            hitboxWidth: hitboxWidth * scale,
            hitboxHeight: hitboxHeight * scale
        };
    }

    /**
     * Computes the horizontal offset based on direction and mirroring settings.
     * Uses HitboxOffsetX for left-facing and HitboxOffsetXRight for right-facing entities.
     * @static
     * @param {Object} obj - Normalized object
     * @returns {number} Scaled horizontal offset in pixels
     * @private
     */
    static computeOffsetX(obj) {
        const scale = Number(obj.scale) || 1;
        const isMovingLeft = !!obj.direction;
        const offsetX = isMovingLeft 
            ? (obj.HitboxOffsetX ?? 0) 
            : (obj.HitboxOffsetXRight ?? obj.HitboxOffsetX ?? 0);
        return offsetX * scale;
    }

    /**
     * Builds the final collision rectangle from position, offsets and dimensions.
     * @static
     * @param {Object} obj - Normalized object
     * @param {number} offsetX - Computed horizontal offset
     * @param {number} hitboxWidth - Scaled width
     * @param {number} hitboxHeight - Scaled height
     * @returns {{x:number,y:number,w:number,h:number}} Collision rectangle
     * @private
     */
    static buildRect(obj, offsetX, hitboxWidth, hitboxHeight) {
        const scale = Number(obj.scale) || 1;
        const offsetY = (obj.HitboxOffsetY ?? 0) * scale;
        return {
            x: (obj.x ?? 0) + offsetX,
            y: (obj.y ?? 0) + offsetY,
            w: hitboxWidth,
            h: hitboxHeight
        };
    }

    /**
     * Registers a collision rectangle in the debug buffer if debug mode is active.
     * @static
     * @param {{x:number,y:number,w:number,h:number}} rect - Collision rectangle
     * @param {string} [debugColor] - Optional debug color override
     * @returns {void}
     * @private
     */
    static registerDebugRect(rect, debugColor) {
        if (Collision.debugMode) {
            Collision.debugRects.push({
                ...rect,
                color: debugColor || '#ff00ff'
            });
        }
    }

    /**
     * Tests whether two axis-aligned bounding boxes overlap.
     * Uses the separating axis theorem for 2D rectangles.
     * @static
     * @param {{x:number,y:number,w:number,h:number}} a - First rectangle
     * @param {{x:number,y:number,w:number,h:number}} b - Second rectangle
     * @returns {boolean} True if rectangles intersect, false otherwise
     */
    static intersects(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    }
}

window.Collision = Collision;