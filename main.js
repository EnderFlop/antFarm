import { AntFarm } from './entities/AntFarm.js';
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 220,
        height: 50,
        groundHeight: 5,
        numberOfAnts: 100,
        anthillCount: 2,
        maxTasks: 5
    });
});
