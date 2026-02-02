import { ENTITY_TYPES } from './constants.js';
import { Hive } from './Hive.js';
import { World } from './World.js';

// Type alias for coordinates
type Position = [number, number];

// Cardinal directions
const CARDINAL_DIRECTIONS: Position[] = [
    [1, 0],   // Right
    [-1, 0],  // Left
    [0, 1],   // Down
    [0, -1]   // Up
];

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
            this.pathToDeposit = this.findPathToPosition(targetX, targetY);
            
            // If no path found, stay in place
            if (!this.pathToDeposit || this.pathToDeposit.length === 0) {
                return;
            }
        }
        
        // Take one step along the path
        const nextPos = this.pathToDeposit.shift()!;
        this.moveTo(nextPos[0], nextPos[1]);
    }
    
    // A* pathfinding through AIR to a specific position
    findPathToPosition(targetX: number, targetY: number): Position[] | null {
        const startKey = `${this.x},${this.y}`;
        const targetKey = `${targetX},${targetY}`;
        
        if (startKey === targetKey) return [];

        const openSet = new Set<string>([startKey]);
        const cameFrom = new Map<string, string>();
        const gScore = new Map<string, number>();
        const fScore = new Map<string, number>();
        
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(this.x, this.y, targetX, targetY));

        while (openSet.size > 0) {
            // Find node with lowest fScore
            let current = '';
            let lowestF = Infinity;
            for (const node of openSet) {
                const f = fScore.get(node) ?? Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    current = node;
                }
            }

            if (current === targetKey) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.delete(current);
            const [cx, cy] = current.split(',').map(Number);

            for (const [dx, dy] of CARDINAL_DIRECTIONS) {
                const nx = cx + dx;
                const ny = cy + dy;
                
                if (!this.world.isValid(nx, ny)) continue;
                
                const neighborEntity = this.world.get(nx, ny);
                // Can only move through AIR or other ANTs
                if (neighborEntity !== ENTITY_TYPES.AIR && neighborEntity !== ENTITY_TYPES.ANT) continue;

                const neighborKey = `${nx},${ny}`;
                const tentativeGScore = (gScore.get(current) ?? Infinity) + 1;

                if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(nx, ny, targetX, targetY));
                    openSet.add(neighborKey);
                }
            }
        }

        return null; // No path found
    }
    
    // Manhattan distance heuristic
    heuristic(x1: number, y1: number, x2: number, y2: number): number {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    // Reconstruct path from A* came-from map
    reconstructPath(cameFrom: Map<string, string>, current: string): Position[] {
        const path: Position[] = [];
        const [cx, cy] = current.split(',').map(Number);
        path.push([cx, cy]);

        while (cameFrom.has(current)) {
            current = cameFrom.get(current)!;
            const [x, y] = current.split(',').map(Number);
            path.unshift([x, y]);
        }

        // Remove first element (current position)
        path.shift();
        return path;
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
