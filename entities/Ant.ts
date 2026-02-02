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

export class Ant {
    x: number;
    y: number;
    world: World;
    hive: Hive;
    wanderProbability: number;
    momentumProbability: number;

    constructor(x: number, y: number, world: World, hive: Hive, wanderProbability: number = 0.05, momentumProbability: number = 0.9, target: Position | null = null) {
        this.x = x;
        this.y = y;
        this.world = world;
        this.hive = hive;
        this.wanderProbability = wanderProbability;
        this.momentumProbability = momentumProbability;
        this.world.set(x, y, ENTITY_TYPES.ANT);
    }

    move() {
        // Ant movement logic goes here
    }
}
