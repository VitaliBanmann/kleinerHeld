let L3Backgrounds = [
    new Background('./assets/world/summer/PNG/summer7/1.png', { cloud:true, parallaxFactor:0.2, autoDriftBase:0.02 }),
    new Background('./assets/world/summer/PNG/summer7/2.png'),
    new Background('./assets/world/summer/PNG/summer7/3.png'),
    new Background('./assets/world/summer/PNG/summer7/4.png')
];

let L3_GROUND_Y = 540;
let level3 = {
    backgrounds: L3Backgrounds,
    groundY: L3_GROUND_Y,
    enemiesCount: 10,
    birdsCount: 15,
    levelWidth: 12000,
    tileWidth: 1199,
    bossX: 10700,
    levelEndX: 10900,
    worldMinX: 0,
    worldMaxX: 12000
};
window.level3 = level3;