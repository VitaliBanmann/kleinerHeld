class MoveableObject {
    x = 100;
    y = 500;
    img;
    height = 50;
    width = 50;
    speed = 5;
    imageCache = {};

    HitboxOffsetX = 0;
    HitboxOffsetY = 0;
    HitboxWidth = null;
    HitboxHeight = null;

    /**
     * Loads a single image and sets it as the current sprite.
     * @param {string} path - The path to the image.
     */
    loadImage(path) {
        const image = new Image();
        image.src = path;
        this.img = image;
    }

    /**
     * Loads multiple images into the cache for animations.
     * @param {string[]} arr - List of image paths.
     */
    loadImages(arr) {
        arr.forEach((path) => {
            let image = new Image();
            image.src = path;
            this.imageCache[path] = image;
        });
    }

    /**
     * Applies the properties from the given definition object to the instance.
     * @param {Object} def - Plain object with properties to apply.
     */
    applyDefinition(def) {
        Object.assign(this, def);
    }

    /**
     * Moves the object to the right.
     * Sets direction to false (facing right).
     */
    moveRight() {
        const currentXPosition = this.x;
        const movementSpeed = this.speed;
        this.x = currentXPosition + movementSpeed;
        this.direction = false;
    }

    /**
     * Moves the object to the left.
     * Sets direction to true (facing left).
     */
    moveLeft() {
        const currentXPosition = this.x;
        const movementSpeed = this.speed;
        this.x = currentXPosition - movementSpeed;
        this.direction = true;
    }

    /**
     * Applies damage to the object if health is defined and not dead.
     * @param {number} [amount=0] - The amount of damage to apply.
     */
    takeDamage(amount = 0) {
        if (this.invulnActive) return;
        if (typeof this.health !== 'number') return;
        if (this.isDead) return;

        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.die();
            return;
        }
        this.isHurt = true;
        this.setState?.('hurt', { reset: true });
        setTimeout(() => {
            this.isHurt = false;
        }, 300);
    }

    /**
     * Marks the object as dead and triggers death animation if available.
     */
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setState?.('death', { reset: true });
        this._deathStartedAt = performance.now ? performance.now() : Date.now();
    }

    /**
     * Updates the animation based on the elapsed time.
     * @param {number} dt - Delta time in milliseconds.
     */
    updateAnimation(dt) {
        if (!this.animations || !this.state) return;
        const frames = this.animations[this.state];
        if (!frames || !frames.length) return;
        const dur = this.resolveFrameDuration(this.state);
        this.animAcc = (this.animAcc || 0) + dt;
        this.stepAnimationFrames(frames, dur);
    }

    /**
     * Resolves the frame duration for the current animation state.
     * @param {string} state - The current animation state.
     * @returns {number} - The resolved frame duration.
     */
    resolveFrameDuration(state) {
        return (this.getFrameDurationForState?.(state)) || this.frameDuration || 200;
    }

    /**
     * Steps through the animation frames based on the accumulated time.
     * @param {Array} frames - The frames of the current animation.
     * @param {number} dur - The duration of each frame.
     */
    stepAnimationFrames(frames, dur) {
        while (this.animAcc >= dur) {
            this.animAcc -= dur;
            if (this.state === 'death') { this.advanceDeathFrame(frames); return; }
            this.frameIndex = (this.frameIndex + 1) % frames.length;
        }
    }

    /**
     * Advances the death animation and marks it as complete at the last frame.
     * @param {Array} frames - The frames of the death animation.
     */
    advanceDeathFrame(frames) {
        if (this.frameIndex < frames.length - 1) {
            this.frameIndex++;
            if (this.frameIndex === frames.length - 1) {
                this.deathAnimationPlayed = true;
                this.deathAnimationComplete = true;
            }
        }
    }
}

window.MoveableObject = MoveableObject;