import { ENTITY_TYPES, CARDINAL_DIRECTIONS, Position } from './constants.js';
import { World } from './World.js';

// Movement costs — air is cheap, dirt is expensive so ants prefer tunnels
const COST_AIR = 1;
const COST_DIRT = 10;

type HeapNode = {
    index: number;
    priority: number;
};

class MinHeap {
    private nodes: HeapNode[];

    constructor() {
        this.nodes = [];
    }

    get size() {
        return this.nodes.length;
    }

    push(node: HeapNode) {
        this.nodes.push(node);
        this.bubbleUp(this.nodes.length - 1);
    }

    pop(): HeapNode | null {
        if (this.nodes.length === 0) return null;

        const min = this.nodes[0];
        const last = this.nodes.pop()!;

        if (this.nodes.length > 0) {
            this.nodes[0] = last;
            this.bubbleDown(0);
        }

        return min;
    }

    private bubbleUp(index: number) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.nodes[parentIndex].priority <= this.nodes[index].priority) {
                break;
            }

            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    private bubbleDown(index: number) {
        while (true) {
            const leftIndex = index * 2 + 1;
            const rightIndex = index * 2 + 2;
            let smallestIndex = index;

            if (
                leftIndex < this.nodes.length &&
                this.nodes[leftIndex].priority < this.nodes[smallestIndex].priority
            ) {
                smallestIndex = leftIndex;
            }

            if (
                rightIndex < this.nodes.length &&
                this.nodes[rightIndex].priority < this.nodes[smallestIndex].priority
            ) {
                smallestIndex = rightIndex;
            }

            if (smallestIndex === index) {
                break;
            }

            this.swap(index, smallestIndex);
            index = smallestIndex;
        }
    }

    private swap(a: number, b: number) {
        const temp = this.nodes[a];
        this.nodes[a] = this.nodes[b];
        this.nodes[b] = temp;
    }
}

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
    const startIndex = toIndex(startX, startY, world.width);
    const targetIndex = toIndex(targetX, targetY, world.width);

    if (startIndex === targetIndex) return [];

    const openHeap = new MinHeap();
    const closedSet = new Set<number>();
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>();
    const fScore = new Map<number, number>();

    gScore.set(startIndex, 0);
    const startF = heuristic(startX, startY, targetX, targetY);
    fScore.set(startIndex, startF);
    openHeap.push({ index: startIndex, priority: startF });

    while (openHeap.size > 0) {
        const next = openHeap.pop();
        if (!next) break;

        const current = next.index;
        if (closedSet.has(current)) continue;

        const currentBestF = fScore.get(current) ?? Infinity;
        if (next.priority > currentBestF) continue;

        if (current === targetIndex) {
            return reconstructPath(cameFrom, current, startIndex, world.width);
        }

        closedSet.add(current);

        const cx = current % world.width;
        const cy = Math.floor(current / world.width);

        for (const [dx, dy] of CARDINAL_DIRECTIONS) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (!world.isValid(nx, ny)) continue;

            const neighborIndex = toIndex(nx, ny, world.width);
            if (closedSet.has(neighborIndex)) continue;

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

            if (tentativeG < (gScore.get(neighborIndex) ?? Infinity)) {
                cameFrom.set(neighborIndex, current);
                gScore.set(neighborIndex, tentativeG);
                const neighborF = tentativeG + heuristic(nx, ny, targetX, targetY);
                fScore.set(neighborIndex, neighborF);
                openHeap.push({ index: neighborIndex, priority: neighborF });
            }
        }
    }

    return null; // No path found
}

// Manhattan distance heuristic (admissible since min cost per step is 1)
function heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function toIndex(x: number, y: number, width: number): number {
    return y * width + x;
}

// Reconstruct the path from A*'s cameFrom map (excludes start position)
function reconstructPath(
    cameFrom: Map<number, number>,
    current: number,
    startIndex: number,
    width: number
): Position[] {
    const indexes: number[] = [];

    while (current !== startIndex) {
        indexes.push(current);
        const previous = cameFrom.get(current);
        if (previous === undefined) break;
        current = previous;
    }

    indexes.reverse();
    return indexes.map((index) => [index % width, Math.floor(index / width)]);
}
