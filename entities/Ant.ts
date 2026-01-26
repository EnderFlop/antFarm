import { ENTITY_TYPES } from './constants.js';
import { Hive } from './Hive.js';
import { World } from './World.js';

export class Ant {
    x: number;
    y: number;
    world: World;
    target: [number, number] | null;
    state: 'finding_entry' | 'moving_to_entry' | 'digging' | 'returning_to_surface';
    surfaceY: number;
    moveHistory: [number, number][]; // Stack of moves to retrace
    hive: Hive;
    entryPoint: [number, number] | null; // The air block to start digging from
    pathToEntry: [number, number][] | null; // A* path to entry point
    digPosition: [number, number] | null; // Where to return to after surfacing
    reachedTarget: boolean; // Flag to track if we reached the target
    taskId: number | null; // Which task this ant is working on

    constructor(x: number, y: number, world: World, hive: Hive, target: [number, number] | null = null) {
        this.x = x;
        this.y = y;
        this.world = world;
        this.target = target;
        this.state = 'finding_entry';
        this.surfaceY = y; // Remember where the surface is
        this.moveHistory = [];
        this.hive = hive;
        this.entryPoint = null;
        this.pathToEntry = null;
        this.digPosition = null;
        this.reachedTarget = false;
        this.taskId = null;
        this.world.set(x, y, ENTITY_TYPES.ANT);
    }

    move() {
        if (!this.target) {
            return;
        }

        //console.log(this.state, "pos:", this.x, this.y, "target:", this.target, "entry:", this.entryPoint)

        switch (this.state) {
            case 'finding_entry':
                this.findEntryPoint();
                break;
            case 'moving_to_entry':
                this.moveToEntry();
                break;
            case 'digging':
                this.digTowardsTarget();
                break;
            case 'returning_to_surface':
                this.moveToSurface();
                break;
        }
    }

    // Find the air block closest to the target, prioritizing anthills and underground air
    findEntryPoint() {
        if (!this.target) return;

        const [targetX, targetY] = this.target;
        const crustLevel = this.world.groundHeight + 1;
        let bestAirBlock: [number, number] | null = null;
        let closestDistanceToTarget = Infinity;

        // Search the entire world for accessible air blocks
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const entity = this.world.get(x, y);
                
                // Found an air block (not the ant's current position)
                if ((entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.ANT) && 
                    !(x === this.x && y === this.y)) {
                    
                    // Only consider air blocks that provide underground access:
                    // 1. Below the crust layer (underground tunnels)
                    // 2. AT the crust layer (anthills - holes in the crust)
                    if (y >= crustLevel) {
                        // Calculate Manhattan distance from this air block to the TARGET
                        const distanceToTarget = Math.abs(x - targetX) + Math.abs(y - targetY);
                        
                        if (distanceToTarget < closestDistanceToTarget) {
                            closestDistanceToTarget = distanceToTarget;
                            bestAirBlock = [x, y];
                        }
                    }
                }
            }
        }

        if (bestAirBlock) {
            // Found an air block closest to target, now pathfind to it through air
            this.entryPoint = bestAirBlock;
            this.pathToEntry = this.findPathToPosition(bestAirBlock[0], bestAirBlock[1]);
            
            if (this.pathToEntry && this.pathToEntry.length > 0) {
                this.state = 'moving_to_entry';
            } else {
                // No path through air to that block, start digging from current position
                this.entryPoint = [this.x, this.y];
                this.state = 'digging';
            }
        } else {
            // No air blocks found anywhere, just start digging from current position
            this.entryPoint = [this.x, this.y];
            this.state = 'digging';
        }
    }

    // Follow the A* path to the entry point
    moveToEntry() {
        if (!this.pathToEntry || this.pathToEntry.length === 0) {
            // Reached entry point, start digging
            this.state = 'digging';
            this.digPosition = [this.x, this.y]; // Remember where to return to
            return;
        }

        // Take next step in path
        const nextPos = this.pathToEntry.shift()!;
        const dx = nextPos[0] - this.x;
        const dy = nextPos[1] - this.y;
        
        this.executeMove([dx, dy], false); // Don't track moves to entry point
    }

    // Dig one block towards the target, then return to surface
    digTowardsTarget() {
        if (!this.target) return;

        const [targetX, targetY] = this.target;
        
        // Check if we've reached the target
        if (this.x === targetX && this.y === targetY) {
            // Mark that we reached the target and return to surface
            this.reachedTarget = true;
            this.state = 'returning_to_surface';
            return;
        }

        // Calculate direction to target
        const dx = targetX - this.x;
        const dy = targetY - this.y;

        // Determine which direction to dig (prioritize axis with larger distance)
        let digDir: [number, number];
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Dig horizontally
            digDir = [Math.sign(dx), 0];
        } else if (Math.abs(dy) > Math.abs(dx)) {
            // Dig vertically
            digDir = [0, Math.sign(dy)];
        } else if (dx !== 0) {
            // Equal distance, prefer horizontal
            digDir = [Math.sign(dx), 0];
        } else {
            // Only vertical needed
            digDir = [0, Math.sign(dy)];
        }

        const [moveX, moveY] = digDir;
        const nextX = this.x + moveX;
        const nextY = this.y + moveY;
        const entity = this.world.get(nextX, nextY);

        if (entity === ENTITY_TYPES.DIRT) {
            // Dig the dirt block
            this.executeMove([moveX, moveY], true); // Track for return path
            this.digPosition = [this.x, this.y]; // Remember this position
            // Return to surface after digging
            this.state = 'returning_to_surface';
        } else if (entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.ANT) {
            // Hit air, just move through it
            this.executeMove([moveX, moveY], true);
        } else if (entity === ENTITY_TYPES.CRUST) {
            // Can't dig through crust! Try alternate direction
            const altDigDir: [number, number] = moveX !== 0 ? [0, Math.sign(dy)] : [Math.sign(dx), 0];
            const [altX, altY] = altDigDir;
            const altNextX = this.x + altX;
            const altNextY = this.y + altY;
            const altEntity = this.world.get(altNextX, altNextY);
            
            if (altEntity === ENTITY_TYPES.DIRT) {
                this.executeMove([altX, altY], true);
                this.digPosition = [this.x, this.y];
                this.state = 'returning_to_surface';
            } else if (altEntity === ENTITY_TYPES.AIR || altEntity === ENTITY_TYPES.ANT) {
                this.executeMove([altX, altY], true);
            }
            // If alternate is also crust/sky/invalid, ant will stay in place this tick
        } else {
            // Can't dig here (SKY or invalid), try alternate direction
            const altDigDir: [number, number] = moveX !== 0 ? [0, Math.sign(dy)] : [Math.sign(dx), 0];
            const [altX, altY] = altDigDir;
            const altNextX = this.x + altX;
            const altNextY = this.y + altY;
            const altEntity = this.world.get(altNextX, altNextY);
            
            if (altEntity === ENTITY_TYPES.DIRT) {
                this.executeMove([altX, altY], true);
                this.digPosition = [this.x, this.y];
                this.state = 'returning_to_surface';
            } else if (altEntity === ENTITY_TYPES.AIR || altEntity === ENTITY_TYPES.ANT) {
                this.executeMove([altX, altY], true);
            }
        }
    }

    // Move back to the surface by pathfinding to nearest surface air block
    moveToSurface() {
        if (this.y === this.surfaceY) {
            // Check if we just completed a target
            if (this.reachedTarget) {
                // Completed the target! Notify the hive
                this.reachedTarget = false;
                if (this.taskId !== null) {
                    this.hive.onTaskCompleted(this.taskId);
                }
                // State will be reset when hive assigns new task
                return;
            }
            
            // At surface, go back down to dig position
            if (this.digPosition) {
                // Use A* to navigate back to dig position
                this.navigateToDigPosition();
            } else {
                // No dig position, just continue digging
                this.state = 'digging';
            }
            return;
        }

        // Find the closest AIR block on the surface
        let closestSurfaceAir: [number, number] | null = null;
        let closestDistance = Infinity;

        // Search surface level for air blocks
        for (let x = 0; x < this.world.width; x++) {
            const entity = this.world.get(x, this.surfaceY);
            if (entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.ANT) {
                const distance = Math.abs(x - this.x) + Math.abs(this.surfaceY - this.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSurfaceAir = [x, this.surfaceY];
                }
            }
        }

        if (closestSurfaceAir) {
            // Find path to surface air block
            const pathToSurface = this.findPathToPosition(closestSurfaceAir[0], closestSurfaceAir[1]);
            
            if (pathToSurface && pathToSurface.length > 0) {
                // Take one step along the path
                const nextPos = pathToSurface[0];
                const dx = nextPos[0] - this.x;
                const dy = nextPos[1] - this.y;
                this.executeMove([dx, dy], false);
            } else {
                // Can't find path, try moving up
                const upEntity = this.world.get(this.x, this.y - 1);
                if (upEntity === ENTITY_TYPES.AIR || upEntity === ENTITY_TYPES.ANT) {
                    this.executeMove([0, -1], false);
                }
            }
        }
    }

    // Navigate back to the dig position after surfacing
    navigateToDigPosition() {
        if (!this.digPosition) {
            this.state = 'digging';
            return;
        }

        const [targetX, targetY] = this.digPosition;
        
        // Simple pathfinding back down - retrace the history we stored
        // Actually, we need to rebuild the path
        const path = this.findPathToPosition(targetX, targetY);
        
        if (path && path.length > 0) {
            // Follow the path
            for (const pos of path) {
                const dx = pos[0] - this.x;
                const dy = pos[1] - this.y;
                this.executeMove([dx, dy], true);
            }
        }
        
        // Now back at dig position, continue digging
        this.state = 'digging';
    }

    // Find path through AIR to a specific position
    findPathToPosition(targetX: number, targetY: number): [number, number][] | null {
        const startKey = `${this.x},${this.y}`;
        const targetKey = `${targetX},${targetY}`;
        
        if (startKey === targetKey) return [];

        const openSet = new Set<string>([startKey]);
        const cameFrom = new Map<string, string>();
        const gScore = new Map<string, number>();
        const fScore = new Map<string, number>();
        
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(this.x, this.y, targetX, targetY));

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (openSet.size > 0) {
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

            for (const [dx, dy] of directions) {
                const nx = cx + dx;
                const ny = cy + dy;
                
                if (!this.world.isValid(nx, ny)) continue;
                
                const neighborEntity = this.world.get(nx, ny);
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
    reconstructPath(cameFrom: Map<string, string>, current: string): [number, number][] {
        const path: [number, number][] = [];
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

    // Execute a move
    executeMove(move: [number, number], trackMove: boolean = false) {
        const [dx, dy] = move;
        
        // Track the move if requested (for retracing path)
        if (trackMove) {
            this.moveHistory.push([dx, dy]);
        }
        
        this.world.set(this.x, this.y, ENTITY_TYPES.AIR);
        this.x += dx;
        this.y += dy;
        this.world.set(this.x, this.y, ENTITY_TYPES.ANT);
    }

    // Reset ant state when assigned to a new task/target
    resetForNewTarget() {
        this.entryPoint = null;
        this.pathToEntry = null;
        this.digPosition = null;
        this.moveHistory = [];
        this.reachedTarget = false;
        this.state = 'finding_entry';
    }
}
