class SpriteAnimator {
    /**
     * Creates an instance of SpriteAnimator.
     * @param {{ image: HTMLImageElement, frameWidth: number, frameHeight: number, frameCount: number, frameDuration?: number }} parameters - Parameters for the animator.
     */
    constructor({ image, frameWidth, frameHeight, frameCount, frameDuration = 100 }) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.frameDuration = frameDuration;

        this.currentFrameIndex = 0;
        this.accumulatedMs = 0;
    }

    /**
     * Updates the animation progress based on elapsed time.
     * @param {number} deltaTime - Delta time in milliseconds.
     */
    update(deltaTime) {
        if (!deltaTime) return;
        this.accumulatedMs += deltaTime;
        while (this.accumulatedMs >= this.frameDuration) {
            this.accumulatedMs -= this.frameDuration;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frameCount;
        }
    }

    /**
     * Gets the source rectangle for the current frame for drawImage.
     * @returns {{ sx: number, sy: number, sw: number, sh: number }}
     */
    getSourceRect() {
        const sourceWidth = this.frameWidth;
        const sourceHeight = this.frameHeight;
        const sourceX = (this.currentFrameIndex % this.frameCount) * sourceWidth;
        const sourceY = 0;
        return { sx: sourceX, sy: sourceY, sw: sourceWidth, sh: sourceHeight };
    }
}

window.SpriteAnimator = SpriteAnimator;