L1Backgrounds = [
    new Background('./assets/world/summer/PNG/summer5/1.png', { cloud:true, parallaxFactor:0.2, autoDriftBase:0.02 }),
    new Background('./assets/world/summer/PNG/summer5/3.png'),
    new Background('./assets/world/summer/PNG/summer5/4.png')
];

let L1_GROUND_Y = 520;
let level1 = {
    backgrounds: L1Backgrounds,
    groundY: L1_GROUND_Y,
    enemiesCount: 10,
    birdsCount: 15,
    levelWidth: 12000,
    tileWidth: 1199,
    bossX: 10700,
    levelEndX: 10900,
    worldMinX: 0,
    worldMaxX: 12000
};
window.level1 = level1;