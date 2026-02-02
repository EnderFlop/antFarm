import { ENTITY_TYPES, CARDINAL_DIRECTIONS } from './constants.js';
/**
 * A* pathfinding through AIR to find the shortest path to a target position
 * @param world The world to pathfind through
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate
 * @param targetX Target X coordinate
 * @param targetY Target Y coordinate
 * @returns Array of positions representing the path, or null if no path found
 */
export function findPathThroughAir(world, startX, startY, targetX, targetY) {
    const startKey = `${startX},${startY}`;
    const targetKey = `${targetX},${targetY}`;
    if (startKey === targetKey)
        return [];
    const openSet = new Set([startKey]);
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY, targetX, targetY));
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
            return reconstructPath(cameFrom, current);
        }
        openSet.delete(current);
        const [cx, cy] = current.split(',').map(Number);
        for (const [dx, dy] of CARDINAL_DIRECTIONS) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (!world.isValid(nx, ny))
                continue;
            const neighborEntity = world.get(nx, ny);
            // Can only move through AIR or other ANTs
            if (neighborEntity !== ENTITY_TYPES.AIR && neighborEntity !== ENTITY_TYPES.ANT)
                continue;
            const neighborKey = `${nx},${ny}`;
            const tentativeGScore = (gScore.get(current) ?? Infinity) + 1;
            if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + heuristic(nx, ny, targetX, targetY));
                openSet.add(neighborKey);
            }
        }
    }
    return null; // No path found
}
// Manhattan distance heuristic
function heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
// Reconstruct path from A* came-from map
function reconstructPath(cameFrom, current) {
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
