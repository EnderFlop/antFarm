import { ENTITY_CHARS } from './constants.js';
import { World } from './World.js';

// Renderer class - handles ASCII text rendering
export class ASCIIRenderer {
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
