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

        // // poke initial antholes into the earth for the ants
        // for (let x = 0; x < this.grid[this.groundHeight].length; x++) {
        //     if (Math.random() < 0.05) { //5% chance for a hole.
        //         this.set(x, this.groundHeight + 1, ENTITY_TYPES.AIR);
        //     }
        // }
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
    target: [number, number] | null;
    state: 'going_to_target' | 'digging' | 'returning_to_surface' | 'error';
    surfaceY: number;
    moveHistory: [number, number][]; // Stack of moves to retrace

    constructor(x: number, y: number, world: World, target: [number, number] | null = null) {
        this.x = x;
        this.y = y;
        this.world = world;
        this.target = target;
        this.state = 'going_to_target';
        this.surfaceY = y; // Remember where the surface is
        this.moveHistory = [];
        this.world.set(x, y, ENTITY_TYPES.ANT);
    }

    move() {
        if (!this.target) {
            console.log("notarget")
            return;
        }

        console.log(this.state)
        console.log(this.x, this.y, this.target)

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
        let bestMove: [number, number] | null = null;
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
            if (distanceToTarget <= 1) {
                this.state = 'digging';
            }
        }
    }

    // Dig at target location - dig the DIRT closest to target
    digAtTarget() {
        if (!this.target) return;

        const [targetX, targetY] = this.target;
        
        // Check if we've reached the target
        if (this.x === targetX && this.y === targetY) {
            // We're at the target! Return to surface
            this.state = 'returning_to_surface';
            return;
        }
        
        // Find all adjacent DIRT blocks and pick the one closest to target
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let bestDirtDirection: [number, number] | null = null;
        let bestDistance = Infinity;

        for (const [dx, dy] of directions) {
            const checkX = this.x + dx;
            const checkY = this.y + dy;
            const entity = this.world.get(checkX, checkY);
            
            if (entity === ENTITY_TYPES.DIRT || entity === ENTITY_TYPES.AIR) {
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
            // Stay in digging state to continue digging towards target
            // Don't return to surface yet
        } else {
            // No DIRT to dig, return to surface
            this.state = 'returning_to_surface';
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
            const lastMove = this.moveHistory.pop()!;
            // Reverse the move: negate both components
            const reverseMove: [number, number] = [-lastMove[0], -lastMove[1]];
            this.executeMove(reverseMove, false); // Don't track reverse moves
        }
    }

    // Find the closest AIR tile to the target
    findClosestAirToTarget(): [number, number] | null {
        if (!this.target) return null;

        const [targetX, targetY] = this.target;
        let closestAir: [number, number] | null = null;
        let closestDistance = Infinity;

        // Simple BFS to find closest AIR to target
        const visited = new Set<string>();
        const queue: [[number, number], number][] = [[this.target, 0]];
        visited.add(`${targetX},${targetY}`);

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        while (queue.length > 0) {
            const [[x, y], distance] = queue.shift()!;
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

        console.log("closestAir", closestAir)
        return closestAir;
    }

    // Get valid moves (can move into AIR, can dig DIRT if conditions met)
    getValidMoves(): [number, number][] {
        const validMoves: [number, number][] = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dx, dy] of directions) {
            const newX = this.x + dx;
            const newY = this.y + dy;
            const entity = this.world.get(newX, newY);

            if (entity === ENTITY_TYPES.AIR) {
                validMoves.push([dx, dy]);
            } else if (entity === ENTITY_TYPES.DIRT) {
                validMoves.push([dx, dy]);
            }
        }

        return validMoves;
    }

    // Execute a move
    executeMove(move: [number, number], trackMove: boolean = false) {
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
}

// Hive class - manages ants and assigns targets
class Hive {
    world: World;
    ants: Ant[];
    targets: [number, number][];

    constructor(world: World, antCount: number = 10) {
        this.world = world;
        this.ants = [];
        this.targets = [];

        this.spawnAnts(antCount)
    }

    
    spawnAnts(count: number) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight;
            const ant = new Ant(x, y, this.world);
            this.ants.push(ant);
            this.assignTarget(ant);
            console.log(ant.target)
        }
    }

    assignTarget(ant: Ant) {
        // Find a good target (dirt area to dig)
        // For now, assign random targets below ground
        const targetX = Math.floor(Math.random() * this.world.width);
        const targetY = this.world.groundHeight + 5 + Math.floor(Math.random() * 10);
        
        if (this.world.isValid(targetX, targetY)) {
            ant.target = [targetX, targetY];
        }
    }

    update() {
        // Update all ants
        for (const ant of this.ants) {
            ant.move();
        }
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
    hive: Hive;

    constructor(width = 100, height = 100, groundHeight = 10) {
        this.tick = 0;
        this.isRunning = false;
        this.animationFrame = null;

        this.world = new World(width, height, groundHeight);
        this.display = document.getElementById('worldDisplay')!;
        this.asciiRenderer = new ASCIIRenderer(this.display, this.world);
        this.hive = new Hive(this.world, 1);
        
        this.setupEventListeners();
        document.getElementById('gridSize')!.textContent = `${this.world.width}x${this.world.height}`;

        this.updateUI();
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
        this.hive.update();
        //update visual state
        this.updateUI();
        console.log("finish tick ", this.tick);
    }

}  

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    const antFarm = new AntFarm(120, 50);
});
