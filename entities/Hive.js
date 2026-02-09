import { Ant } from './Ant.js';
import { ENTITY_TYPES } from './constants.js';
// Hive class — manages ants and acts as the central task distributor.
// Ants poll the Hive for their next dig coordinate.
export class Hive {
    constructor(world, antCount = 10) {
        this.world = world;
        this.ants = [];
        this.taskQueue = [];
        // Build the initial task map before spawning ants
        this.buildTaskMap();
        this.spawnAnts(antCount);
    }
    // ── Task map construction ─────────────────────────────────────────
    /**
     * Populate the task queue with dig coordinates.
     * For now these are random dirt tiles beneath the crust.
     * This will be replaced with proper map generation later.
     */
    buildTaskMap() {
        const minY = this.world.groundHeight + 2; // below the crust layer
        const maxY = this.world.height - 1;
        const batchSize = 200;
        for (let i = 0; i < batchSize; i++) {
            for (let attempt = 0; attempt < 50; attempt++) {
                const rx = Math.floor(Math.random() * this.world.width);
                const ry = minY + Math.floor(Math.random() * (maxY - minY + 1));
                if (this.world.get(rx, ry) === ENTITY_TYPES.DIRT) {
                    this.taskQueue.push([rx, ry]);
                    break;
                }
            }
        }
    }
    // ── Task distribution ─────────────────────────────────────────────
    /**
     * Called by an ant when it needs a new dig target.
     * Returns the next coordinate from the queue, or null if none are available.
     */
    requestTask() {
        // Refill the queue if it runs dry
        if (this.taskQueue.length === 0) {
            this.buildTaskMap();
        }
        return this.taskQueue.shift() ?? null;
    }
    // ── Ant management ────────────────────────────────────────────────
    spawnAnts(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight;
            const ant = new Ant(x, y, this.world, this);
            this.ants.push(ant);
        }
    }
    update() {
        for (const ant of this.ants) {
            ant.move();
        }
    }
}
