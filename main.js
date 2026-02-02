import { AntFarm } from './entities/AntFarm.js';
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 160,
        height: 40,
        groundHeight: 5,
        numberOfAnts: 5,
        anthillCount: 3,
        wanderProbability: 0.001,
        momentumProbability: 0.6
    });
});
