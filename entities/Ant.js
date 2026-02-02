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
        this.hive = hive;
        this.wanderProbability = wanderProbability;
        this.momentumProbability = momentumProbability;
        this.world.set(x, y, ENTITY_TYPES.ANT);
    }
    move() {
        // Ant movement logic goes here
    }
}
