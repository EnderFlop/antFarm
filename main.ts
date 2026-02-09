import { AntFarm } from './entities/AntFarm.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 100,
        height: 80,
        groundHeight: 5,
        numberOfAnts: 5,
        anthillCount: 1,
    });
});
