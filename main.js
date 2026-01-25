// Main JavaScript file

// Entity types
const ENTITY_TYPES = {
    AIR: 0,
    DIRT: 1,
    ANT: 2
};

// ASCII characters for each entity type
const ENTITY_CHARS = {
    [ENTITY_TYPES.AIR]: ' ',    // Space
    [ENTITY_TYPES.DIRT]: '@',   // Hash/pound
    [ENTITY_TYPES.ANT]: '.'     // Asterisk
};

// World class - manages the grid state
class World {
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
                    this.grid[y][x] = ENTITY_TYPES.AIR;
                } else {
                    this.grid[y][x] = ENTITY_TYPES.DIRT;
                }
            }
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

// Renderer class - handles ASCII text rendering
class ASCIIRenderer {
    constructor(displayElement, world) {
        this.display = displayElement;
        this.world = world;
    }
    
    // Render the entire world as ASCII
    updateDisplay() {
        let output = '';
        
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const entityType = this.world.get(x, y);
                const char = ENTITY_CHARS[entityType] || '?';
                output += char;
            }
            output += '\n';
        }
        
        this.display.textContent = output;
    }
    
    // Update a single cell (requires full re-render for text)
    updateCell(x, y) {
        this.updateDisplay();
    }
    
    // Update multiple cells at once (requires full re-render for text)
    updateCells(cells) {
        this.updateDisplay();
    }
}

// Main application
class AntFarm {
    constructor(width = 100, height = 100, groundHeight = 10) {
        this.world = new World(width, height, groundHeight);
        this.display = document.getElementById('worldDisplay');
        this.asciiRenderer = new ASCIIRenderer(this.display, this.world);
        this.isRunning = false;
        this.animationFrame = null;
        this.tick = 0;
        
        this.setupEventListeners();
        document.getElementById('gridSize').textContent = `${this.world.width}x${this.world.height}`;

        this.updateUI();
        this.spawnAnts(10);
        this.asciiRenderer.updateDisplay();
    }
    
    setupEventListeners() {
        // Play/Pause button
        document.getElementById('playPause').addEventListener('click', () => {
            this.toggle();
        });
        
        // Step button
        document.getElementById('step').addEventListener('click', () => {
            this.step();
        });
    }
        
    
    toggle() {
        this.isRunning = !this.isRunning;
        document.getElementById('playPause').textContent = this.isRunning ? 'Pause' : 'Play';
        
        if (this.isRunning) {
            this.start();
        } else {
            this.stop();
        }
    }
    
    start() {
        const loop = () => {
            if (this.isRunning) {
                this.step();
                this.animationFrame = requestAnimationFrame(loop);
            }
        };
        this.animationFrame = requestAnimationFrame(loop);
    }
    
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    updateUI() {
        this.asciiRenderer.updateDisplay();
        document.getElementById('tick').textContent = this.tick;
    }

    spawnAnts(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight - 1;
            this.world.set(x, y, ENTITY_TYPES.ANT);
        }
    }

    step() {
        //tick
        this.tick++;
        // update world state
        this.simulateAnts();
        //update visual state
        this.updateUI();
    }
    
    simulateAnts() {
        console.log("HERE");
        // Placeholder for your ant farm simulation logic
        // This is where you'll update ant positions, behavior, etc.
    }
}  

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    
    // Create a grid (width, height)
    // For large grids, you can go much bigger: new AntFarm(200, 100)
    const antFarm = new AntFarm(120, 50);
    
    // Make it globally accessible for debugging
    window.antFarm = antFarm;
});
