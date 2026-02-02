import { Ant } from './Ant.js';
// Hive class - manages ants
export class Hive {
    constructor(world, antCount = 10, wanderProbability = 0.05, momentumProbability = 0.9) {
        this.world = world;
        this.ants = [];
        this.wanderProbability = wanderProbability;
        this.momentumProbability = momentumProbability;
        this.spawnAnts(antCount);
    }
    spawnAnts(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight;
            const ant = new Ant(x, y, this.world, this, this.wanderProbability, this.momentumProbability);
            this.ants.push(ant);
        }
    }
    update() {
        // Update all ants
        for (const ant of this.ants) {
            ant.move();
        }
    }
}
