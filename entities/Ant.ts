import { ENTITY_TYPES, Position } from './constants.js';
import { Hive } from './Hive.js';
import { World } from './World.js';
import { findPath } from './pathfinding.js';

type AntState = 'SEARCHING' | 'RETURNING';

export class Ant {
    x: number;
    y: number;
    world: World;
    hive: Hive;
    state: AntState;

    /** Where the ant should return to after digging (center of surface) */
    surfaceTarget: Position;

    /** The underground coordinate this ant is tasked with digging out */
    taskTarget: Position | null;

    /** Pre-computed path the ant is currently following */
    currentPath: Position[] | null;

    constructor(x: number, y: number, world: World, hive: Hive) {
        this.x = x;
        this.y = y;
        this.world = world;
        this.hive = hive;
        this.state = 'SEARCHING';

        // Return target is the center of the surface layer
        this.surfaceTarget = [Math.floor(this.world.width / 2), this.world.groundHeight];

        this.taskTarget = null;
        this.currentPath = null;

        // Request the first task from the Hive
        this.taskTarget = this.hive.requestTask();

        this.world.set(x, y, ENTITY_TYPES.ANT);
    }

    // ── Public entry point (called once per tick) ──────────────────────

    move() {
        if (this.state === 'SEARCHING') {
            this.search();
        } else {
            this.returnToSurface();
        }
    }

    // ── SEARCHING: walk toward taskTarget, dig it, switch to RETURNING ─

    private search() {
        if (!this.taskTarget) {
            this.taskTarget = this.hive.requestTask();
            if (!this.taskTarget) return; // No tasks available — idle
        }

        const [tx, ty] = this.taskTarget;

        // Arrived at the task target
        if (this.x === tx && this.y === ty) {
            this.dig();
            return;
        }

        // If the target is already air (another ant dug it), request a new task
        if (this.world.get(tx, ty) === ENTITY_TYPES.AIR) {
            this.taskTarget = this.hive.requestTask();
            this.currentPath = null;
            return;
        }

        this.followOrBuildPath(tx, ty);
    }

    // ── RETURNING: walk toward surface center, then get a new task ─────

    private returnToSurface() {
        const [sx, sy] = this.surfaceTarget;

        // Arrived at the surface target
        if (this.x === sx && this.y === sy) {
            this.state = 'SEARCHING';
            this.currentPath = null;
            this.taskTarget = this.hive.requestTask();
            return;
        }

        this.followOrBuildPath(sx, sy);
    }

    // ── Path following / building ──────────────────────────────────────

    /**
     * If we have a valid path, take one step along it.
     * Otherwise, compute a new A* path toward (tx, ty).
     */
    private followOrBuildPath(tx: number, ty: number) {
        // If no path exists, or we've exhausted it, compute a fresh one
        if (!this.currentPath || this.currentPath.length === 0) {
            this.currentPath = findPath(this.world, this.x, this.y, tx, ty);

            // Still no path — stay put this tick
            if (!this.currentPath || this.currentPath.length === 0) {
                return;
            }
        }

        // Peek at the next step
        const [nx, ny] = this.currentPath[0];

        // Validate the next step is still walkable (could have changed since path was built)
        const entity = this.world.get(nx, ny);
        if (entity === ENTITY_TYPES.SKY || entity === ENTITY_TYPES.CRUST) {
            // Path is stale — recompute next tick
            this.currentPath = null;
            return;
        }

        // Take the step
        this.currentPath.shift();

        // If stepping into dirt, dig it out first
        if (entity === ENTITY_TYPES.DIRT) {
            this.world.set(nx, ny, ENTITY_TYPES.AIR);
        }

        this.moveTo(nx, ny);
    }

    // ── Helpers ────────────────────────────────────────────────────────

    /** Move the ant on the grid */
    private moveTo(x: number, y: number) {
        this.world.set(this.x, this.y, ENTITY_TYPES.AIR);
        this.x = x;
        this.y = y;
        this.world.set(this.x, this.y, ENTITY_TYPES.ANT);
    }

    /** Called when the ant arrives at its dig target */
    private dig() {
        // The tile under the ant is already AIR (moveTo set it), so nothing
        // extra to remove — just switch state.
        this.state = 'RETURNING';
        this.currentPath = null;
    }

}
