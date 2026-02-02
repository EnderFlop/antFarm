import { Ant } from './Ant.js';
import { World } from './World.js';

// Hive class - manages ants
export class Hive {
    world: World;
    ants: Ant[];

    constructor(world: World, antCount: number = 10) {
        this.world = world;
        this.ants = [];

        this.spawnAnts(antCount);
    }

    spawnAnts(count: number) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight;
            const ant = new Ant(x, y, this.world, this);
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
