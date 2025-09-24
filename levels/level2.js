let L2Backgrounds = [
    new Background('./assets/world/forest/1/1.png', { cloud:true, parallaxFactor:0.2, autoDriftBase:0.02 }),
    new Background('./assets/world/forest/1/2.png'),
    new Background('./assets/world/forest/1/3.png'),
    new Background('./assets/world/forest/1/4.png')  
];

let L2_GROUND_Y = 520;
let level2 = {
    backgrounds: L2Backgrounds,
    groundY: L2_GROUND_Y,
    enemiesCount: 10,
    birdsCount: 15,
    levelWidth: 12000,
    tileWidth: 1199,
    bossX: 10700,
    levelEndX: 10900,
    worldMinX: 0,
    worldMaxX: 12000
};
window.level2 = level2;