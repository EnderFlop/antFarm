import { World } from './World.js';
import { CanvasRenderer } from './Renderer.js';
import { Hive } from './Hive.js';

export type AntFarmOptions = {
    width: number;
    height: number;
    groundHeight: number;
    numberOfAnts: number;
    anthillCount: number;
    targetTPS?: number;
    tileDisplaySize: number;
};

// Main application
export class AntFarm {
    tick: number;
    isRunning: boolean;
    animationFrame: number | null;
    world: World;
    display: HTMLCanvasElement;
    renderer: CanvasRenderer;
    hive: Hive;
    
    // TPS tracking
    ticksInLastSecond: number;
    lastTPSUpdate: number;
    currentTPS: number;

    // Tick rate limiter
    targetTPS: number;
    msPerTick: number;
    lastTickTime: number;

    constructor(options: AntFarmOptions) {
        this.tick = 0;
        this.isRunning = false;
        this.animationFrame = null;
        
        // Tick rate limiter (0 = unlimited)
        this.targetTPS = options.targetTPS ?? 0;
        this.msPerTick = this.targetTPS > 0 ? 1000 / this.targetTPS : 0;
        this.lastTickTime = 0;

        // Initialize TPS tracking
        this.ticksInLastSecond = 0;
        this.lastTPSUpdate = performance.now();
        this.currentTPS = 0;

        this.world = new World(options.width, options.height, options.groundHeight, options.anthillCount);
        this.display = document.getElementById('worldDisplay') as HTMLCanvasElement;
        this.renderer = new CanvasRenderer(this.display, this.world, options.tileDisplaySize);
        this.hive = new Hive(this.world, options.numberOfAnts);
        
        document.getElementById('gridSize')!.textContent = `${this.world.width}x${this.world.height}`;

        this.updateUI();
        this.renderer.updateDisplay();
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
        const loop = (timestamp: number) => {
            if (!this.isRunning) return;

            // If rate-limited, check if enough time has elapsed
            if (this.msPerTick > 0) {
                const elapsed = timestamp - this.lastTickTime;
                if (elapsed >= this.msPerTick) {
                    this.lastTickTime = timestamp;
                    this.step();
                }
            } else {
                // Unlimited — one tick per frame
                this.step();
            }

            this.animationFrame = requestAnimationFrame(loop);
        };
        this.lastTickTime = performance.now();
        this.animationFrame = requestAnimationFrame(loop);
    }
    
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    destroy() {
        this.isRunning = false;
        this.stop();
    }
    
    updateUI() {
        this.renderer.updateDisplay();
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
