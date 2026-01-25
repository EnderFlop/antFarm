import { ENTITY_TYPES } from './constants.js';
// World class - manages the grid state
export class World {
    constructor(width, height, groundHeight) {
        this.width = width;
        this.height = height;
        this.groundHeight = groundHeight;
        this.grid = [];
        // Initialize grid with air and dirt
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                if (y < this.groundHeight) {
                    this.grid[y][x] = ENTITY_TYPES.SKY;
                }
                else if (y == this.groundHeight) {
                    this.grid[y][x] = ENTITY_TYPES.AIR;
                }
                else {
                    this.grid[y][x] = ENTITY_TYPES.DIRT;
                }
            }
        }
        // // poke initial antholes into the earth for the ants
        // for (let x = 0; x < this.grid[this.groundHeight].length; x++) {
        //     if (Math.random() < 0.05) { //5% chance for a hole.
        //         this.set(x, this.groundHeight + 1, ENTITY_TYPES.AIR);
        //     }
        // }
    }
    // Get entity at position
    get(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.grid[y][x];
    }
    // Set entity at position
    set(x, y, entityType) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        this.grid[y][x] = entityType;
        return true;
    }
    // Check if position is valid
    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}
