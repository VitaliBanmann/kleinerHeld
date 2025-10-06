class SpriteAnimator {
    /**
     * Creates an instance of SpriteAnimator.
     * @param {{ image: HTMLImageElement, frameWidth: number, frameHeight: number, frameCount: number, frameDuration?: number }} params - Parameters for the animator.
     */
    constructor({ image, frameWidth, frameHeight, frameCount, frameDuration = 100 }) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.frameDuration = frameDuration;

        this.index = 0;
        this.accumulatedMs = 0;
    }

    /**
     * Updates the animation progress based on elapsed time.
     * @param {number} dt - Delta time in milliseconds.
     */
    update(dt) {
        if (!dt) return;
        this.accumulatedMs += dt;
        while (this.accumulatedMs >= this.frameDuration) {
            this.accumulatedMs -= this.frameDuration;
            this.index = (this.index + 1) % this.frameCount;
        }
    }

    /**
     * Gets the source rectangle for the current frame for drawImage.
     * @returns {{ sx: number, sy: number, sw: number, sh: number }}
     */
    getSourceRect() {
        const sw = this.frameWidth;
        const sh = this.frameHeight;
        const sx = (this.index % this.frameCount) * sw;
        const sy = 0;
        return { sx, sy, sw, sh };
    }
}

window.SpriteAnimator = SpriteAnimator;