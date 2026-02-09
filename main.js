import { AntFarm } from './entities/AntFarm.js';
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 110,
        height: 25,
        groundHeight: 5,
        numberOfAnts: 6,
        anthillCount: 1,
        targetTPS: 0, // ticks per second (0 = unlimited)
    });
});
