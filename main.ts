import { AntFarm } from './entities/AntFarm.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm({
        width: 140,
        height: 60,
        groundHeight: 10,
        numberOfAnts: 10
    });
});
