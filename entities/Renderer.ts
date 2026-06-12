import { ENTITY_TYPES } from './constants.js';
import { World } from './World.js';

type Color = [number, number, number, number];

const ENTITY_COLORS: Record<number, Color> = {
    [ENTITY_TYPES.SKY]: [122, 170, 196, 255],
    [ENTITY_TYPES.AIR]: [18, 18, 20, 255],
    [ENTITY_TYPES.DIRT]: [96, 66, 38, 255],
    [ENTITY_TYPES.ANT]: [235, 235, 220, 255],
    [ENTITY_TYPES.CRUST]: [54, 48, 42, 255],
    [ENTITY_TYPES.TASK]: [143, 96, 48, 255],
    [ENTITY_TYPES.ERROR]: [255, 0, 255, 255],
};

// Renderer class - paints one world tile as one canvas pixel.
export class CanvasRenderer {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    world: World;
    sourceCanvas: HTMLCanvasElement;
    sourceContext: CanvasRenderingContext2D;
    imageData: ImageData;
    pixels: Uint8ClampedArray;
    displayScale: number;

    constructor(canvas: HTMLCanvasElement, world: World, tileDisplaySize: number) {
        this.canvas = canvas;
        this.world = world;

        this.displayScale = tileDisplaySize;
        this.canvas.width = this.world.width * this.displayScale;
        this.canvas.height = this.world.height * this.displayScale;

        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Unable to initialize 2D canvas renderer');
        }

        this.context = context;
        this.context.imageSmoothingEnabled = false;

        this.sourceCanvas = document.createElement('canvas');
        this.sourceCanvas.width = this.world.width;
        this.sourceCanvas.height = this.world.height;

        const sourceContext = this.sourceCanvas.getContext('2d');
        if (!sourceContext) {
            throw new Error('Unable to initialize source canvas renderer');
        }

        this.sourceContext = sourceContext;
        this.sourceContext.imageSmoothingEnabled = false;
        this.imageData = this.sourceContext.createImageData(this.world.width, this.world.height);
        this.pixels = this.imageData.data;
    }
    
    // Render one source pixel per tile, then scale it to the visible canvas sharply.
    updateDisplay() {
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const entityType = this.world.get(x, y) ?? ENTITY_TYPES.ERROR;
                const color = ENTITY_COLORS[entityType] ?? ENTITY_COLORS[ENTITY_TYPES.ERROR];
                const index = (y * this.world.width + x) * 4;

                this.pixels[index] = color[0];
                this.pixels[index + 1] = color[1];
                this.pixels[index + 2] = color[2];
                this.pixels[index + 3] = color[3];
            }
        }
        
        this.sourceContext.putImageData(this.imageData, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(
            this.sourceCanvas,
            0,
            0,
            this.world.width,
            this.world.height,
            0,
            0,
            this.canvas.width,
            this.canvas.height,
        );
    }
    
    // Small worlds are cheap to redraw; later we can make this dirty-rect aware.
    updateCell(x: number, y: number) {
        this.updateDisplay();
    }
    
}
