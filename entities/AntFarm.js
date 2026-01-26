import { World } from './World.js';
import { ASCIIRenderer } from './Renderer.js';
import { Hive } from './Hive.js';
// Main application
export class AntFarm {
    constructor(options) {
        this.tick = 0;
        this.isRunning = false;
        this.animationFrame = null;
        this.world = new World(options.width, options.height, options.groundHeight);
        this.display = document.getElementById('worldDisplay');
        this.asciiRenderer = new ASCIIRenderer(this.display, this.world);
        this.hive = new Hive(this.world, options.numberOfAnts);
        this.setupEventListeners();
        document.getElementById('gridSize').textContent = `${this.world.width}x${this.world.height}`;
        this.updateUI();
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
        // Reset button
        document.getElementById('reset').addEventListener('click', () => {
            window.location.reload();
        });
    }
    toggle() {
        this.isRunning = !this.isRunning;
        document.getElementById('playPause').textContent = this.isRunning ? 'Pause' : 'Play';
        if (this.isRunning) {
            this.start();
        }
        else {
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
        document.getElementById('tick').textContent = this.tick.toString();
    }
    step() {
        //tick
        this.tick++;
        // update world state
        this.hive.update();
        //update visual state
        this.updateUI();
    }
}
