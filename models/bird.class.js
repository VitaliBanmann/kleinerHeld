const BIRD_CROW_DEF = {
    src: './assets/world/birds/crow.png',
    frameWidth: 32,
    frameHeight: 32,
    frames: 6,
    frameDuration: 90,
    direction: false,
    scale: 1
};

const BIRD_VULTURE_DEF = {
    src: './assets/world/birds/vulture.png',
    frameWidth: 48,
    frameHeight: 48,
    frames: 4,
    frameDuration: 110,
    direction: false,
    scale: 0.8
};

class Bird extends MoveableObject {
    constructor(def, direction, worldWidth, worldHeight) {
        super();
        this.def = def;
        this.scale = def.scale ?? 1;
        this.direction = !!direction;
        this.speed = 0.05 + Math.random() * 0.05;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.img = new Image();
        this.img.src = def.src;

        /**
         * Animator für Frame-Animation.
         * @type {SpriteAnimator}
         */
        this.animator = new SpriteAnimator({
            image: this.img,
            frameWidth: def.frameWidth,
            frameHeight: def.frameHeight,
            frameCount: def.frames,
            frameDuration: def.frameDuration
        });

        this.t = Math.random() * 1000;
        this.phase = Math.random() * Math.PI * 2;
        this.amp = 6 + Math.random() * 10;
        this.freq = (2 * Math.PI) / (1800 + Math.random() * 1800);
        this.baseY = 100;
        this.respawn();
    }

    /**
     * Aktualisiert Position, Animation und Sinusflug.
     * @param {number} dt Delta Time in ms (Fallback 16).
     */
    update(dt) {
        if (!dt) dt = 16;
        const dx = this.speed * dt;
        this.x += this.direction ? -dx : dx;

        this.t += dt;
        this.y = this.baseY + Math.sin(this.phase + this.t * this.freq) * this.amp;

        this.animator.update(dt);
    }

    /**
     * Prüft ob der Vogel außerhalb des sicht-/relevanten Bereichs liegt.
     * @returns {boolean} true wenn außerhalb.
     */
    isOutOfWorld() {
        const margin = 64;
        return this.x < -margin || this.x > this.worldWidth + margin;
    }

    /**
     * Setzt Position & Flugbahn neu (Respawn am linken oder rechten Rand).
     */
    respawn() {
        const hMin = 60;
        const hMax = Math.max(120, this.worldHeight / 2);
        this.baseY = Math.random() * (hMax - hMin) + hMin;
        this.phase = Math.random() * Math.PI * 2;

        if (this.direction) {
            this.x = this.worldWidth + 50;
        } else {
            this.x = -50;
        }
        this.y = this.baseY;
    }
}

window.Bird = Bird;