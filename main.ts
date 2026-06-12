import { AntFarm } from './entities/AntFarm.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 30,
        height: 20,
        groundHeight: 5,
        numberOfAnts: 5,
        anthillCount: 3,
        targetTPS: 0, // ticks per second (0 = unlimited)
    });
});
