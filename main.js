import { AntFarm } from './entities/AntFarm.js';
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 150,
        height: 60,
        groundHeight: 5,
        numberOfAnts: 10,
        anthillCount: 2,
        maxTasks: 2
    });
});
