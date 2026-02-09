import { ENTITY_TYPES, CARDINAL_DIRECTIONS, Position } from './constants.js';
import { World } from './World.js';

// Movement costs — air is cheap, dirt is expensive so ants prefer tunnels
const COST_AIR = 1;
const COST_DIRT = 10;

/**
 * A* pathfinding that can traverse both AIR and DIRT.
 * Paths through AIR are strongly preferred (cost 1 vs 10 for DIRT).
 * Cannot pass through SKY or CRUST.
 *
 * @returns Array of positions representing the path (excluding start), or null if unreachable
 */
export function findPath(
    world: World,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
): Position[] | null {
    const startKey = `${startX},${startY}`;
    const targetKey = `${targetX},${targetY}`;

    if (startKey === targetKey) return [];

    // Open set stored as a set of keys; we scan for lowest f each iteration
    const openSet = new Set<string>([startKey]);
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY, targetX, targetY));

    while (openSet.size > 0) {
        // Find node in openSet with the lowest fScore
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
        closedSet.add(current);

        const [cx, cy] = current.split(',').map(Number);

        for (const [dx, dy] of CARDINAL_DIRECTIONS) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (!world.isValid(nx, ny)) continue;

            const neighborKey = `${nx},${ny}`;
            if (closedSet.has(neighborKey)) continue;

            const entity = world.get(nx, ny);

            // Determine movement cost based on tile type
            let moveCost: number;
            if (entity === ENTITY_TYPES.AIR || entity === ENTITY_TYPES.ANT) {
                moveCost = COST_AIR;
            } else if (entity === ENTITY_TYPES.DIRT || entity === ENTITY_TYPES.TASK) {
                moveCost = COST_DIRT;
            } else {
                // SKY, CRUST, or anything else — impassable
                continue;
            }

            const tentativeG = (gScore.get(current) ?? Infinity) + moveCost;

            if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + heuristic(nx, ny, targetX, targetY));
                openSet.add(neighborKey);
            }
        }
    }

    return null; // No path found
}

// Manhattan distance heuristic (admissible since min cost per step is 1)
function heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Reconstruct the path from A*'s cameFrom map (excludes start position)
function reconstructPath(cameFrom: Map<string, string>, current: string): Position[] {
    const path: Position[] = [];
    const [cx, cy] = current.split(',').map(Number);
    path.push([cx, cy]);

    while (cameFrom.has(current)) {
        current = cameFrom.get(current)!;
        const [x, y] = current.split(',').map(Number);
        path.unshift([x, y]);
    }

    // Remove first element (the ant's current position)
    path.shift();
    return path;
}
