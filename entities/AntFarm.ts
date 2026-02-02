import { World } from './World.js';
import { ASCIIRenderer } from './Renderer.js';
import { Hive } from './Hive.js';

// Main application
export class AntFarm {
    tick: number;
    isRunning: boolean;
    animationFrame: number | null;
    world: World;
    display: HTMLElement;
    asciiRenderer: ASCIIRenderer;
    hive: Hive;
    
    // TPS tracking
    ticksInLastSecond: number;
    lastTPSUpdate: number;
    currentTPS: number;

    constructor(options: { 
        width: number, 
        height: number, 
        groundHeight: number, 
        numberOfAnts: number, 
        anthillCount: number, 
    }) {
        this.tick = 0;
        this.isRunning = false;
        this.animationFrame = null;
        
        // Initialize TPS tracking
        this.ticksInLastSecond = 0;
        this.lastTPSUpdate = performance.now();
        this.currentTPS = 0;

        this.world = new World(options.width, options.height, options.groundHeight, options.anthillCount);
        this.display = document.getElementById('worldDisplay')!;
        this.asciiRenderer = new ASCIIRenderer(this.display, this.world);
        this.hive = new Hive(this.world, options.numberOfAnts);
        
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
        document.getElementById('tps')!.textContent = this.currentTPS.toFixed(1);
    }

    updateTPS() {
        const now = performance.now();
        const elapsed = now - this.lastTPSUpdate;
        
        // Update TPS every second
        if (elapsed >= 1000) {
            this.currentTPS = (this.ticksInLastSecond / elapsed) * 1000;
            this.ticksInLastSecond = 0;
            this.lastTPSUpdate = now;
        }
    }

    step() {
        //tick
        this.tick++;
        this.ticksInLastSecond++;
        
        // update world state
        this.hive.update();
        
        // update TPS counter
        this.updateTPS();
        
        //update visual state
        this.updateUI();
    }

}
