import { ENTITY_TYPES, CARDINAL_DIRECTIONS, Position } from './constants.js';
import { Hive } from './Hive.js';
import { World } from './World.js';
import { findPathThroughAir } from './pathfinding.js';

type AntState = 'SEARCHING' | 'RETURNING';

export class Ant {
    x: number;
    y: number;
    world: World;
    hive: Hive;
    state: AntState;
    depositLocation: Position;
    pathToDeposit: Position[] | null;

    constructor(x: number, y: number, world: World, hive: Hive) {
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
        } else if (this.state === 'RETURNING') {
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
    getNeighbors(): Array<{ position: Position, entity: number }> {
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
                    position: [nx, ny] as Position,
                    entity: entity
                });
            }
        }
        
        return neighbors;
    }

    // Score a neighbor (to be implemented with criteria)
    scoreNeighbor(neighbor: { position: Position, entity: number }): number {
        let score = Math.random();
        
        const [nx, ny] = neighbor.position;
        
        // Rule 1: Favor tiles below current position
        if (ny > this.y) {
            score += 1;
        }
        
        // Rule 2: If on surface, favor tiles that move toward nearest anthill
        if (this.y === this.world.groundHeight) {
            const nearestAnthill = this.findNearestAnthill();
            
            if (nearestAnthill) {
                const [anthillX, anthillY] = nearestAnthill;
                const currentDistanceToAnthill = Math.abs(this.x - anthillX) + Math.abs(this.y - anthillY);
                const neighborDistanceToAnthill = Math.abs(nx - anthillX) + Math.abs(ny - anthillY);
                
                // If neighbor is closer to anthill, favor it
                if (neighborDistanceToAnthill < currentDistanceToAnthill) {
                    score += 2;
                }
            }
        }

        return score;
    }
    
    // Find the nearest anthill (AIR in crust layer)
    findNearestAnthill(): Position | null {
        const crustY = this.world.groundHeight + 1;
        let nearestAnthill: Position | null = null;
        let nearestDistance = Infinity;
        
        // Search the crust layer for anthills (AIR tiles)
        for (let i = 0; i < this.world.width; i++) {
            const left = this.x - i
            const right = this.x + i;
            const leftEntity = this.world.get(left, crustY);
            const rightEntity = this.world.get(right, crustY);
            if (leftEntity === ENTITY_TYPES.AIR) {
                nearestAnthill = [left, crustY];
            }
            if (rightEntity === ENTITY_TYPES.AIR) {
                nearestAnthill = [right, crustY];
            }
        }
        
        return nearestAnthill;
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
        const nextPos = this.pathToDeposit.shift()!;
        this.moveTo(nextPos[0], nextPos[1]);
    }

    // Deposit dirt and go back to SEARCHING
    deposit() {
        this.state = 'SEARCHING';
        this.pathToDeposit = null;
    }

    // Move to a specific position
    moveTo(x: number, y: number) {
        this.world.set(this.x, this.y, ENTITY_TYPES.AIR);
        this.x = x;
        this.y = y;
        this.world.set(this.x, this.y, ENTITY_TYPES.ANT);
    }
}
