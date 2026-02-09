import { AntFarm } from './entities/AntFarm.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 30,
        height: 25,
        groundHeight: 5,
        numberOfAnts: 2,
        anthillCount: 1,
        targetTPS: 2, // ticks per second (0 = unlimited)
    });
});
