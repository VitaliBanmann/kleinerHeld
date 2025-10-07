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
     * @param {string} imagePath - The path to the image.
     */
    loadImage(imagePath) {
        const image = new Image();
        image.src = imagePath;
        this.img = image;
    }

    /**
     * Loads multiple images into the cache for animations.
     * @param {string[]} imagePathArray - List of image paths.
     */
    loadImages(imagePathArray) {
        imagePathArray.forEach((imagePath) => {
            let image = new Image();
            image.src = imagePath;
            this.imageCache[imagePath] = image;
        });
    }

    /**
     * Applies the properties from the given definition object to the instance.
     * @param {Object} definition - Plain object with properties to apply.
     */
    applyDefinition(definition) {
        Object.assign(this, definition);
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
     * @param {number} [damageAmount=0] - The amount of damage to apply.
     */
    takeDamage(damageAmount = 0) {
        if (this.invulnActive) return;
        if (typeof this.health !== 'number') return;
        if (this.isDead) return;

        this.health = Math.max(0, this.health - damageAmount);
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
     * @param {number} deltaTime - Delta time in milliseconds.
     */
    updateAnimation(deltaTime) {
        if (!this.animations || !this.state) return;
        const animationFrames = this.animations[this.state];
        if (!animationFrames || !animationFrames.length) return;
        const frameDuration = this.resolveFrameDuration(this.state);
        this.animAcc = (this.animAcc || 0) + deltaTime;
        this.stepAnimationFrames(animationFrames, frameDuration);
    }

    /**
     * Resolves the frame duration for the current animation state.
     * @param {string} animationState - The current animation state.
     * @returns {number} - The resolved frame duration.
     */
    resolveFrameDuration(animationState) {
        return (this.getFrameDurationForState?.(animationState)) || this.frameDuration || 200;
    }

    /**
     * Steps through the animation frames based on the accumulated time.
     * @param {Array} animationFrames - The frames of the current animation.
     * @param {number} frameDuration - The duration of each frame.
     */
    stepAnimationFrames(animationFrames, frameDuration) {
        while (this.animAcc >= frameDuration) {
            this.animAcc -= frameDuration;
            if (this.state === 'death') { 
                this.advanceDeathFrame(animationFrames); 
                return; 
            }
            this.frameIndex = (this.frameIndex + 1) % animationFrames.length;
        }
    }

    /**
     * Advances the death animation and marks it as complete at the last frame.
     * @param {Array} deathFrames - The frames of the death animation.
     */
    advanceDeathFrame(deathFrames) {
        if (this.frameIndex < deathFrames.length - 1) {
            this.frameIndex++;
            if (this.frameIndex === deathFrames.length - 1) {
                this.deathAnimationPlayed = true;
                this.deathAnimationComplete = true;
            }
        }
    }
}

window.MoveableObject = MoveableObject;