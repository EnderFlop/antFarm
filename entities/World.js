import { ENTITY_TYPES } from './constants.js';
// World class - manages the grid state
export class World {
    constructor(width, height, groundHeight, anthillCount = 5) {
        this.width = width;
        this.height = height;
        this.groundHeight = groundHeight;
        this.anthillCount = anthillCount;
        this.grid = [];
        // Initialize grid with sky, air, crust, and dirt
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                if (y < this.groundHeight) {
                    this.grid[y][x] = ENTITY_TYPES.SKY;
                }
                else if (y == this.groundHeight) {
                    this.grid[y][x] = ENTITY_TYPES.AIR;
                }
                else if (y == this.groundHeight + 1) {
                    // Top layer is CRUST (undiggable)
                    this.grid[y][x] = ENTITY_TYPES.CRUST;
                }
                else {
                    this.grid[y][x] = ENTITY_TYPES.DIRT;
                }
            }
        }
        // Create anthills - holes in the crust
        this.createAnthills();
    }
    createAnthills() {
        const crustY = this.groundHeight + 1;
        const anthillPositions = [];
        // Generate random, well-spaced anthill positions
        const minSpacing = Math.floor(this.width / (this.anthillCount + 1));
        for (let i = 0; i < this.anthillCount; i++) {
            // Distribute anthills somewhat evenly
            const baseX = Math.floor((i + 1) * (this.width / (this.anthillCount + 1)));
            // Add some randomness
            const randomOffset = Math.floor(Math.random() * minSpacing * 0.5) - Math.floor(minSpacing * 0.25);
            const x = Math.max(0, Math.min(this.width - 1, baseX + randomOffset));
            anthillPositions.push(x);
        }
        // Create the anthills (replace crust with air)
        for (const x of anthillPositions) {
            this.set(x, crustY, ENTITY_TYPES.AIR);
        }
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
