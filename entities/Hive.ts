import { Ant } from './Ant.js';
import { ENTITY_TYPES, Position } from './constants.js';
import { World } from './World.js';

// Hive class — manages ants and acts as the central task distributor.
// Ants poll the Hive for their next dig coordinate.
export class Hive {
    world: World;
    ants: Ant[];

    /** Queue of dig-target coordinates waiting to be claimed by an ant */
    taskQueue: Position[];

    constructor(world: World, antCount: number = 10) {
        this.world = world;
        this.ants = [];
        this.taskQueue = [];

        // Build the initial task map before spawning ants
        this.buildTaskMap();

        this.spawnAnts(antCount);
    }

    // ── Task map construction ─────────────────────────────────────────

    static readonly NUM_ROOMS = 3;
    static readonly ROOM_MIN_W = 2;
    static readonly ROOM_MAX_W = 4;
    static readonly ROOM_MIN_H = 2;
    static readonly ROOM_MAX_H = 4;

    /**
     * Generate rooms by picking random center points and carving
     * rectangles of random size. Every dirt tile inside each rectangle
     * is marked as a TASK and added to the queue.
     */
    buildTaskMap() {
        const minY = this.world.groundHeight + 2; // below the crust layer
        const maxY = this.world.height - 1;

        for (let room = 0; room < Hive.NUM_ROOMS; room++) {
            // Random room dimensions
            const w = Hive.ROOM_MIN_W + Math.floor(Math.random() * (Hive.ROOM_MAX_W - Hive.ROOM_MIN_W + 1));
            const h = Hive.ROOM_MIN_H + Math.floor(Math.random() * (Hive.ROOM_MAX_H - Hive.ROOM_MIN_H + 1));

            // Random center point in the diggable area
            const cx = Math.floor(Math.random() * this.world.width);
            const cy = minY + Math.floor(Math.random() * (maxY - minY + 1));

            // Rectangle bounds, clamped to the world
            const left   = Math.max(0, cx - Math.floor(w / 2));
            const right  = Math.min(this.world.width - 1, cx + Math.floor(w / 2));
            const top    = Math.max(minY, cy - Math.floor(h / 2));
            const bottom = Math.min(maxY, cy + Math.floor(h / 2));

            // Mark every dirt tile in the rectangle as a task
            for (let y = top; y <= bottom; y++) {
                for (let x = left; x <= right; x++) {
                    if (this.world.get(x, y) === ENTITY_TYPES.DIRT) {
                        this.world.set(x, y, ENTITY_TYPES.TASK);
                        this.taskQueue.push([x, y]);
                    }
                }
            }
        }
    }

    // ── Task distribution ─────────────────────────────────────────────

    /**
     * Called by an ant when it needs a new dig target.
     * Returns the next coordinate from the queue, or null if none are available.
     */
    requestTask(): Position | null {
        // Refill the queue if it runs dry
        if (this.taskQueue.length === 0) {
            this.buildTaskMap();
        }

        return this.taskQueue.shift() ?? null;
    }

    // ── Ant management ────────────────────────────────────────────────

    spawnAnts(count: number) {
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
