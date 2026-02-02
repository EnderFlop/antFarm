import { Ant } from './Ant.js';
import { World } from './World.js';

// Hive class - manages ants
export class Hive {
    world: World;
    ants: Ant[];
    wanderProbability: number;
    momentumProbability: number;

    constructor(world: World, antCount: number = 10, wanderProbability: number = 0.05, momentumProbability: number = 0.9) {
        this.world = world;
        this.ants = [];
        this.wanderProbability = wanderProbability;
        this.momentumProbability = momentumProbability;

        this.spawnAnts(antCount);
    }

    spawnAnts(count: number) {
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
