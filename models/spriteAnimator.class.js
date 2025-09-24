class SpriteAnimator {
 
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
     * Fortschritt der Animation basierend auf vergangener Zeit.
     * @param {number} dt Delta Time in ms
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
     * Liefert Quell-Rechteck des aktuellen Frames für drawImage.
     * @returns {{sx:number,sy:number,sw:number,sh:number}}
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