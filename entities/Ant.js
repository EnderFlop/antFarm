import { ENTITY_TYPES } from './constants.js';
// Cardinal directions
const CARDINAL_DIRECTIONS = [
    [1, 0], // Right
    [-1, 0], // Left
    [0, 1], // Down
    [0, -1] // Up
];
export class Ant {
    constructor(x, y, world, hive, wanderProbability = 0.05, momentumProbability = 0.9, target = null) {
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
        this.lastDigDirection = null; // No initial momentum
        this.wanderProbability = wanderProbability;
        this.momentumProbability = momentumProbability;
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
        if (!this.target)
            return;
        const [targetX, targetY] = this.target;
        const crustLevel = this.world.groundHeight + 1;
        let bestAirBlock = null;
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
            }
            else {
                // No path through air to that block, start digging from current position
                this.entryPoint = [this.x, this.y];
                this.state = 'digging';
            }
        }
        else {
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
        const nextPos = this.pathToEntry.shift();
        const dx = nextPos[0] - this.x;
        const dy = nextPos[1] - this.y;
        this.executeMove([dx, dy], false); // Don't track moves to entry point
    }
    // Utility: Calculate direction toward a delta (prioritizes larger axis)
    calculateDirectionTowardsDelta(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            // Move horizontally
            return [Math.sign(dx), 0];
        }
        else if (Math.abs(dy) > Math.abs(dx)) {
            // Move vertically
            return [0, Math.sign(dy)];
        }
        else if (dx !== 0) {
            // Equal distance, prefer horizontal
            return [Math.sign(dx), 0];
        }
        else {
            // Only vertical needed
            return [0, Math.sign(dy)];
        }
    }
    // Utility: Try alternate (perpendicular) direction when primary is blocked
    tryAlternateDirection(primaryDir, dx, dy) {
        const [moveX, moveY] = primaryDir;
        // Calculate perpendicular direction
        const altDir = moveX !== 0 ? [0, Math.sign(dy)] : [Math.sign(dx), 0];
        const [altX, altY] = altDir;
        // Check what's in the alternate direction
        const altNextX = this.x + altX;
        const altNextY = this.y + altY;
        const altEntity = this.world.get(altNextX, altNextY);
        if (altEntity === ENTITY_TYPES.DIRT) {
            // Can dig in alternate direction
            this.executeMove([altX, altY], true);
            this.lastDigDirection = [altX, altY];
            this.digPosition = [this.x, this.y];
            this.state = 'returning_to_surface';
            return true;
        }
        else if (altEntity === ENTITY_TYPES.AIR || altEntity === ENTITY_TYPES.ANT) {
            // Can move through air in alternate direction
            this.executeMove([altX, altY], true);
            this.lastDigDirection = [altX, altY];
            return true;
        }
        // Alternate direction also blocked
        return false;
    }
    // Dig one block towards the target with organic movement
    digTowardsTarget() {
        if (!this.target)
            return;
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
        // Determine which direction to dig with momentum and randomness
        let digDir;
        // Chance to deviate from optimal path (random wandering)
        const shouldWander = Math.random() < this.wanderProbability;
        // Chance to continue in last direction if we have momentum (directional inertia)
        const shouldContinue = this.lastDigDirection !== null && Math.random() < this.momentumProbability;
        if (shouldWander) {
            // Random wandering: pick a random cardinal direction
            digDir = CARDINAL_DIRECTIONS[Math.floor(Math.random() * CARDINAL_DIRECTIONS.length)];
        }
        else if (shouldContinue && this.lastDigDirection) {
            // Check if momentum would widen a tunnel
            const [momX, momY] = this.lastDigDirection;
            const nextX = this.x + momX;
            const nextY = this.y + momY;
            // Get perpendicular directions to check for widening
            const perpendicular = momX !== 0
                ? [[0, 1], [0, -1]] // If moving horizontally, check up/down
                : [[1, 0], [-1, 0]]; // If moving vertically, check left/right
            // Check if there's air on either perpendicular side
            let wouldWiden = false;
            for (const [px, py] of perpendicular) {
                const checkX = nextX + px;
                const checkY = nextY + py;
                const entity = this.world.get(checkX, checkY);
                if (entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.ANT) {
                    wouldWiden = true;
                    break;
                }
            }
            // If momentum would widen tunnel, break momentum and path toward target instead
            if (wouldWiden) {
                // Break momentum, recalculate toward target
                digDir = this.calculateDirectionTowardsDelta(dx, dy);
            }
            else {
                // Momentum won't widen, continue in same direction
                digDir = this.lastDigDirection;
            }
        }
        else {
            // Normal pathfinding toward target
            digDir = this.calculateDirectionTowardsDelta(dx, dy);
        }
        const [moveX, moveY] = digDir;
        const nextX = this.x + moveX;
        const nextY = this.y + moveY;
        const entity = this.world.get(nextX, nextY);
        if (entity === ENTITY_TYPES.DIRT) {
            // Dig the dirt block
            this.executeMove([moveX, moveY], true);
            this.lastDigDirection = [moveX, moveY];
            this.digPosition = [this.x, this.y];
            this.state = 'returning_to_surface';
        }
        else if (entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.ANT) {
            // Hit air, just move through it
            this.executeMove([moveX, moveY], true);
            //this.lastDigDirection = [moveX, moveY]; // Update momentum even when moving through air
        }
        else {
            // Can't dig here (CRUST, SKY, or invalid), try alternate direction
            this.tryAlternateDirection([moveX, moveY], dx, dy);
            // If alternate also blocked, ant stays in place this tick
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
            }
            else {
                // No dig position, just continue digging
                this.state = 'digging';
            }
            return;
        }
        // Find the closest AIR block on the surface
        let closestSurfaceAir = null;
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
            }
            else {
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
    findPathToPosition(targetX, targetY) {
        const startKey = `${this.x},${this.y}`;
        const targetKey = `${targetX},${targetY}`;
        if (startKey === targetKey)
            return [];
        const openSet = new Set([startKey]);
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
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
                if (!this.world.isValid(nx, ny))
                    continue;
                const neighborEntity = this.world.get(nx, ny);
                if (neighborEntity !== ENTITY_TYPES.AIR && neighborEntity !== ENTITY_TYPES.ANT)
                    continue;
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
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    // Reconstruct path from A* came-from map
    reconstructPath(cameFrom, current) {
        const path = [];
        const [cx, cy] = current.split(',').map(Number);
        path.push([cx, cy]);
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            const [x, y] = current.split(',').map(Number);
            path.unshift([x, y]);
        }
        // Remove first element (current position)
        path.shift();
        return path;
    }
    // Execute a move
    executeMove(move, trackMove = false) {
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
        this.lastDigDirection = null; // Reset momentum for new target
        this.state = 'finding_entry';
    }
}
