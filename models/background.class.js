class Background extends MoveableObject {
    width = 1200;
    height = 600;

    constructor(imagePath, opts = {}) {
        super();
        this.img = new Image();
        this.img.src = imagePath;
        this.isCloud = !!opts.cloud;
        this.parallaxFactor = opts.parallaxFactor ?? 1;
        this.autoDriftBase = opts.autoDriftBase ?? 0;
        this.driftSpeed = this.autoDriftBase;
        this.driftOffset = 0;
        this.nextSpeedChange = 0;
        this.driftDirection = 1;
    }
}

window.Background = Background;