import { Ant } from './Ant.js';
import { World } from './World.js';

// Hive class - manages ants and assigns targets
export class Hive {
    world: World;
    ants: Ant[];
    targets: [number, number][];

    constructor(world: World, antCount: number = 10) {
        this.world = world;
        this.ants = [];
        this.targets = [];

        this.spawnAnts(antCount)
    }

    
    spawnAnts(count: number) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight;
            const ant = new Ant(x, y, this.world, this);
            this.ants.push(ant);
            this.assignTarget(ant);
            console.log(ant.target)
        }
    }

    assignTarget(ant: Ant) {
        // Find a good target (dirt area to dig)
        // For now, assign random targets below ground
        const targetX = Math.floor(Math.random() * this.world.width);
        const targetY = this.world.groundHeight + 5 + Math.floor(Math.random() * 10);
        
        if (this.world.isValid(targetX, targetY)) {
            ant.target = [targetX, targetY];
        }
    }

    update() {
        // Update all ants
        for (const ant of this.ants) {
            ant.move();
        }
    }
}
