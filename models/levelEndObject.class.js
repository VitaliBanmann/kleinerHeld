class LevelEndObject extends MoveableObject {

    constructor(x = 10800, y = 400) {
        super();
        this.width = TREASURE_WIDTH;
        this.height = TREASURE_HEIGHT;
        this.x = x;
        this.y = y;
        this.loadImage(TREASURE_IMAGE_PATH);
    }
}

const TREASURE_WIDTH = 80;
const TREASURE_HEIGHT = 80;
const TREASURE_IMAGE_PATH = './assets/coin/treasure.png';

window.LevelEndObject = LevelEndObject;