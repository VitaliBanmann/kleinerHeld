const BIRD_CROW_DEFINITION = {
    src: './assets/world/birds/crow.png',
    frameWidth: 32,
    frameHeight: 32,
    frames: 6,
    frameDuration: 90,
    direction: false,
    scale: 1
};

const BIRD_VULTURE_DEFINITION = {
    src: './assets/world/birds/vulture.png',
    frameWidth: 48,
    frameHeight: 48,
    frames: 4,
    frameDuration: 110,
    direction: false,
    scale: 0.8
};

class Bird extends MoveableObject {
    birdDefinition;
    scale;
    direction;
    speed;
    worldWidth;
    worldHeight;
    imageElement;
    animator;
    time;
    sinePhase;
    sineAmplitude;
    sineFrequency;
    baseYPosition;

    constructor(birdDefinition, direction, worldWidth, worldHeight) {
        super();
        this.birdDefinition = birdDefinition;
        this.scale = birdDefinition.scale ?? 1;
        this.direction = !!direction;
        this.speed = 0.05 + Math.random() * 0.05;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.imageElement = new Image();
        this.imageElement.src = birdDefinition.src;

        /**
         * Animator for frame-based animation.
         * @type {SpriteAnimator}
         */
        this.animator = new SpriteAnimator({
            image: this.imageElement,
            frameWidth: birdDefinition.frameWidth,
            frameHeight: birdDefinition.frameHeight,
            frameCount: birdDefinition.frames,
            frameDuration: birdDefinition.frameDuration
        });

        this.time = Math.random() * 1000;
        this.sinePhase = Math.random() * Math.PI * 2;
        this.sineAmplitude = 6 + Math.random() * 10;
        this.sineFrequency = (2 * Math.PI) / (1800 + Math.random() * 1800);
        this.baseYPosition = 100;
        this.respawn();
    }

    /**
     * Updates the bird's position, animation, and sinusoidal flight path.
     * @param {number} deltaTime - Delta time in milliseconds (default 16).
     * @returns {void}
     */
    update(deltaTime) {
        if (!deltaTime) deltaTime = 16;
        const deltaX = this.speed * deltaTime;
        this.x += this.direction ? -deltaX : deltaX;

        this.time += deltaTime;
        this.y = this.baseYPosition + Math.sin(this.sinePhase + this.time * this.sineFrequency) * this.sineAmplitude;

        this.animator.update(deltaTime);
    }

    /**
     * Checks if the bird is outside the visible or relevant area of the world.
     * @returns {boolean} True if the bird is out of bounds.
     */
    isOutOfWorld() {
        const margin = 64;
        return this.x < -margin || this.x > this.worldWidth + margin;
    }

    /**
     * Resets the bird's position and flight path (respawn at left or right edge).
     * @returns {void}
     */
    respawn() {
        const minHeight = 60;
        const maxHeight = Math.max(120, this.worldHeight / 2);
        this.baseYPosition = Math.random() * (maxHeight - minHeight) + minHeight;
        this.sinePhase = Math.random() * Math.PI * 2;

        if (this.direction) {
            this.x = this.worldWidth + 50;
        } else {
            this.x = -50;
        }
        this.y = this.baseYPosition;
    }
}

window.Bird = Bird;