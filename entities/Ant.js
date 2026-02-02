import { ENTITY_TYPES, CARDINAL_DIRECTIONS } from './constants.js';
import { findPathThroughAir } from './pathfinding.js';
export class Ant {
    constructor(x, y, world, hive) {
        this.x = x;
        this.y = y;
        this.world = world;
        this.hive = hive;
        this.state = 'SEARCHING';
        // Deposit location is center of world on surface
        this.depositLocation = [Math.floor(this.world.width / 2), this.world.groundHeight];
        this.pathToDeposit = null;
        this.world.set(x, y, ENTITY_TYPES.ANT);
    }
    move() {
        if (this.state === 'SEARCHING') {
            this.search();
        }
        else if (this.state === 'RETURNING') {
            this.returnToDeposit();
        }
    }
    // Search for best neighbor to move into
    search() {
        // Get all valid neighbors
        const neighbors = this.getNeighbors();
        if (neighbors.length === 0) {
            return; // No valid moves, stay in place
        }
        // Score each neighbor
        const scoredNeighbors = neighbors.map(neighbor => ({
            position: neighbor.position,
            entity: neighbor.entity,
            score: this.scoreNeighbor(neighbor)
        }));
        // Pick the best neighbor
        scoredNeighbors.sort((a, b) => b.score - a.score);
        const best = scoredNeighbors[0];
        // Move to best neighbor
        this.moveTo(best.position[0], best.position[1]);
        // If we moved into dirt, dig it
        if (best.entity === ENTITY_TYPES.DIRT) {
            this.dig();
        }
    }
    // Get all valid neighbors
    getNeighbors() {
        const neighbors = [];
        for (const [dx, dy] of CARDINAL_DIRECTIONS) {
            const nx = this.x + dx;
            const ny = this.y + dy;
            // Check if valid position
            if (!this.world.isValid(nx, ny)) {
                continue;
            }
            const entity = this.world.get(nx, ny);
            // Can't move into SKY or CRUST
            if (entity === ENTITY_TYPES.SKY || entity === ENTITY_TYPES.CRUST) {
                continue;
            }
            // Can move into AIR, DIRT, or other ANTs
            if (entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.DIRT || entity === ENTITY_TYPES.ANT) {
                neighbors.push({
                    position: [nx, ny],
                    entity: entity
                });
            }
        }
        return neighbors;
    }
    // Score a neighbor (to be implemented with criteria)
    scoreNeighbor(neighbor) {
        // Placeholder scoring - all neighbors equal for now
        return Math.random();
    }
    // Dig the current dirt block and change to RETURNING state
    dig() {
        // The ant has already moved into the dirt position
        // Change state to return with the dirt
        this.state = 'RETURNING';
    }
    // Navigate back to deposit location using A*
    returnToDeposit() {
        const [targetX, targetY] = this.depositLocation;
        // Check if we're at the deposit location
        if (this.x === targetX && this.y === targetY) {
            this.deposit();
            return;
        }
        // Build path if we don't have one
        if (!this.pathToDeposit || this.pathToDeposit.length === 0) {
            this.pathToDeposit = findPathThroughAir(this.world, this.x, this.y, targetX, targetY);
            // If no path found, stay in place
            if (!this.pathToDeposit || this.pathToDeposit.length === 0) {
                return;
            }
        }
        // Take one step along the path
        const nextPos = this.pathToDeposit.shift();
        this.moveTo(nextPos[0], nextPos[1]);
    }
    // Deposit dirt and go back to SEARCHING
    deposit() {
        this.state = 'SEARCHING';
        this.pathToDeposit = null;
    }
    // Move to a specific position
    moveTo(x, y) {
        this.world.set(this.x, this.y, ENTITY_TYPES.AIR);
        this.x = x;
        this.y = y;
        this.world.set(this.x, this.y, ENTITY_TYPES.ANT);
    }
}
