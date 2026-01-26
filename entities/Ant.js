import { ENTITY_TYPES } from './constants.js';
export class Ant {
    constructor(x, y, world, hive, target = null) {
        this.x = x;
        this.y = y;
        this.world = world;
        this.target = target;
        this.state = 'going_to_target';
        this.surfaceY = y; // Remember where the surface is
        this.moveHistory = [];
        this.hive = hive;
        this.world.set(x, y, ENTITY_TYPES.ANT);
    }
    move() {
        if (!this.target) {
            console.log("notarget");
            return;
        }
        console.log(this.state);
        console.log(this.x, this.y, this.target);
        switch (this.state) {
            case 'going_to_target':
                this.moveTowardsTarget();
                break;
            case 'digging':
                this.digAtTarget();
                break;
            case 'returning_to_surface':
                this.moveToSurface();
                break;
        }
    }
    // Find closest AIR tile to target and move towards it
    moveTowardsTarget() {
        const closestAir = this.findClosestAirToTarget();
        if (!closestAir) {
            // No path to target, try to dig
            this.state = 'digging';
            return;
        }
        // Move one step towards the closest AIR tile
        const [targetX, targetY] = closestAir;
        // Move in the direction that gets us closer
        const possibleMoves = this.getValidMoves();
        let bestMove = null;
        let bestDistance = Infinity;
        for (const [moveX, moveY] of possibleMoves) {
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            const distance = Math.abs(newX - targetX) + Math.abs(newY - targetY);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMove = [moveX, moveY];
            }
        }
        if (bestMove) {
            this.executeMove(bestMove, true); // Track this move
            // Check if we're at the target area (within 1 tile)
            const distanceToTarget = Math.abs(this.x - targetX) + Math.abs(this.y - targetY);
            if (distanceToTarget == 0) {
                this.state = 'digging';
            }
        }
    }
    // Dig at target location - dig the DIRT closest to target
    digAtTarget() {
        if (!this.target)
            return;
        const [targetX, targetY] = this.target;
        // Check if we've reached the target
        if (this.x === targetX && this.y === targetY) {
            // We're at the target! Return to surface
            this.getNewTarget();
            this.state = 'returning_to_surface';
            return;
        }
        // Find all adjacent DIRT blocks and pick the one closest to target
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let bestDirtDirection = null;
        let bestDistance = Infinity;
        for (const [dx, dy] of directions) {
            const checkX = this.x + dx;
            const checkY = this.y + dy;
            const entity = this.world.get(checkX, checkY);
            if (entity === ENTITY_TYPES.DIRT) {
                // Calculate distance from this DIRT block to target
                const distance = Math.abs(checkX - targetX) + Math.abs(checkY - targetY);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirtDirection = [dx, dy];
                }
            }
        }
        if (bestDirtDirection) {
            // Dig into the DIRT closest to target
            this.executeMove(bestDirtDirection, true); // Track this move
            // Carry dirt up to surface
            this.state = 'returning_to_surface';
        }
        else {
            // No adjacent DIRT to dig, need to navigate through air to reach target
            // Switch back to going_to_target state to find a path through the air pocket
            this.state = 'going_to_target';
        }
    }
    // Move back to the surface by retracing path
    moveToSurface() {
        if (this.y === this.surfaceY) {
            // At surface, clear history and descend again
            this.moveHistory = [];
            this.state = 'going_to_target';
            return;
        }
        // Pop the last move from history and reverse it
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory.pop();
            // Reverse the move: negate both components
            const reverseMove = [-lastMove[0], -lastMove[1]];
            this.executeMove(reverseMove, false); // Don't track reverse moves
        }
    }
    // Find the closest AIR tile to the target
    findClosestAirToTarget() {
        if (!this.target)
            return null;
        const [targetX, targetY] = this.target;
        let closestAir = null;
        let closestDistance = Infinity;
        // Simple BFS to find closest AIR to target
        const visited = new Set();
        const queue = [[this.target, 0]];
        visited.add(`${targetX},${targetY}`);
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        while (queue.length > 0) {
            const [[x, y], distance] = queue.shift();
            const entity = this.world.get(x, y);
            if (entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.ANT) {
                // Found AIR, check if it's reachable from current position
                closestAir = [x, y];
                closestDistance = distance;
                break;
            }
            if (distance < 10) { // Limit search radius
                for (const [dx, dy] of directions) {
                    const newX = x + dx;
                    const newY = y + dy;
                    const key = `${newX},${newY}`;
                    if (!visited.has(key) && this.world.isValid(newX, newY)) {
                        const entity = this.world.get(newX, newY);
                        if (entity !== ENTITY_TYPES.SKY) {
                            visited.add(key);
                            queue.push([[newX, newY], distance + 1]);
                        }
                    }
                }
            }
        }
        console.log("closestAir", closestAir);
        return closestAir;
    }
    // Get valid moves (can move into AIR, can dig DIRT if conditions met)
    getValidMoves() {
        const validMoves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of directions) {
            const newX = this.x + dx;
            const newY = this.y + dy;
            const entity = this.world.get(newX, newY);
            if (entity === ENTITY_TYPES.AIR) {
                validMoves.push([dx, dy]);
            }
            else if (entity === ENTITY_TYPES.DIRT) {
                validMoves.push([dx, dy]);
            }
        }
        return validMoves;
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
    getNewTarget() {
        this.hive.assignTarget(this);
    }
}
