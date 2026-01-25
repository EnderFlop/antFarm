// Main JavaScript file

// Entity types
const ENTITY_TYPES = {
    SKY: 0,
    AIR: 1,
    DIRT: 2,
    ANT: 3,
    ERROR: 99
};

// ASCII characters for each entity type
const ENTITY_CHARS = {
    [ENTITY_TYPES.SKY]: '/',    // Space (ants cannot access SKY)
    [ENTITY_TYPES.AIR]: ' ',    // Space (ants can move freely in AIR)
    [ENTITY_TYPES.DIRT]: '@',   // Hash/pound
    [ENTITY_TYPES.ANT]: '.',     // Period
    [ENTITY_TYPES.ERROR]: 'X'
};

// World class - manages the grid state
class World {
    width: number;
    height: number;
    groundHeight: number;
    grid: number[][];

    constructor(width: number, height: number, groundHeight: number) {
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
                } else if (y == this.groundHeight) {
                    this.grid[y][x] = ENTITY_TYPES.AIR
                } else {
                    this.grid[y][x] = ENTITY_TYPES.DIRT;
                }
            }
        }
    }
    
    // Get entity at position
    get(x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.grid[y][x];
    }
    
    // Set entity at position
    set(x: number, y: number, entityType: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        this.grid[y][x] = entityType;
        return true;
    }
    
    // Check if position is valid
    isValid(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}

class Ant {
    x: number;
    y: number;
    world: World;

    constructor(x: number, y: number, world: World) {
        this.x = x
        this.y = y
        this.world = world
        this.world.set(x, y, ENTITY_TYPES.ANT);
    }

    move() {
        const possibleMoves = this.getValidMoves();
        if (!possibleMoves) {
            return;
        }
        const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const [moveRowOffset, moveColOffset] = move

        this.world.set(this.x, this.y, ENTITY_TYPES.AIR)
        this.x += moveRowOffset
        this.y += moveColOffset
        this.world.set(this.x, this.y, ENTITY_TYPES.ANT)
        console.log(this.x, this.y)

        return;
    }

    getValidMoves() {
        const validMoves: [number, number][] = []
        const possibleLocations = [
            [-1, 0], [0, 1], 
            [1, 0], [0, -1],
          ];
        for (const [rowOffset, colOffset] of possibleLocations) {
            const neighborEntity = this.world.get(this.x + rowOffset, this.y + colOffset);
            if (neighborEntity == ENTITY_TYPES.AIR || neighborEntity == ENTITY_TYPES.DIRT) {
                validMoves.push([rowOffset, colOffset])
            } else {
                validMoves.push([0, 0])
            }
        }
        return validMoves
    }

}

// Renderer class - handles ASCII text rendering
class ASCIIRenderer {
    display: HTMLElement;
    world: World;

    constructor(displayElement: HTMLElement, world: World) {
        this.display = displayElement;
        this.world = world;
    }
    
    // Render the entire world as ASCII
    updateDisplay() {
        let output = '';
        
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const entityType = this.world.get(x, y) ?? 99; //else render 99, ERROR
                const char = ENTITY_CHARS[entityType];
                output += char;
            }
            output += '\n';
        }
        
        this.display.textContent = output;
    }
    
    // Update a single cell (requires full re-render for text)
    updateCell(x: number, y: number) {
        this.updateDisplay();
    }
    
}

// Main application
class AntFarm {
    tick: number;
    isRunning: boolean;
    animationFrame: number | null;
    world: World;
    display: HTMLElement;
    asciiRenderer: ASCIIRenderer;
    ants: Ant[];

    constructor(width = 100, height = 100, groundHeight = 10) {
        this.tick = 0;
        this.isRunning = false;
        this.animationFrame = null;

        this.world = new World(width, height, groundHeight);
        this.display = document.getElementById('worldDisplay')!;
        this.asciiRenderer = new ASCIIRenderer(this.display, this.world);

        this.ants = [];
        
        this.setupEventListeners();
        document.getElementById('gridSize')!.textContent = `${this.world.width}x${this.world.height}`;

        this.updateUI();
        this.spawnAnts(10);
        this.asciiRenderer.updateDisplay();
    }
    
    setupEventListeners() {
        // Play/Pause button
        document.getElementById('playPause')!.addEventListener('click', () => {
            this.toggle();
        });
        
        // Step button
        document.getElementById('step')!.addEventListener('click', () => {
            this.step();
        });

        // Reset button
        document.getElementById('reset')!.addEventListener('click', () => {
            window.location.reload();
        });
    }
        
    
    toggle() {
        this.isRunning = !this.isRunning;
        document.getElementById('playPause')!.textContent = this.isRunning ? 'Pause' : 'Play';
        
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
        document.getElementById('tick')!.textContent = this.tick.toString();
    }

    step() {
        //tick
        this.tick++;
        // update world state
        this.simulateAnts();
        //update visual state
        this.updateUI();
        console.log("finish tick ", this.tick);
    }

    spawnAnts(count: number) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight;
            const ant = new Ant(x, y, this.world)
            this.ants.push(ant)
        }
    }
    
    simulateAnts() {
        for (const ant of this.ants) {
            ant.move();
        }
    }
}  

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm(120, 50);
});
