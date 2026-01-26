import { Ant } from './Ant.js';
// Hive class - manages ants and assigns tasks
export class Hive {
    constructor(world, antCount = 10, maxTasks = 3, wanderProbability = 0.05, momentumProbability = 0.9) {
        this.world = world;
        this.ants = [];
        this.tasks = [];
        this.nextTaskId = 0;
        this.maxConcurrentTasks = maxTasks;
        this.wanderProbability = wanderProbability;
        this.momentumProbability = momentumProbability;
        this.spawnAnts(antCount);
        this.initializeTasks();
    }
    spawnAnts(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = this.world.groundHeight;
            const ant = new Ant(x, y, this.world, this, this.wanderProbability, this.momentumProbability);
            this.ants.push(ant);
        }
    }
    initializeTasks() {
        // Create initial tasks
        for (let i = 0; i < this.maxConcurrentTasks; i++) {
            this.createNewTask();
        }
        // Distribute ants evenly across tasks
        for (let i = 0; i < this.ants.length; i++) {
            const taskIndex = i % this.tasks.length;
            this.assignAntToTask(this.ants[i], this.tasks[taskIndex].id);
        }
    }
    createNewTask() {
        const targetX = Math.floor(Math.random() * this.world.width);
        const targetY = this.world.groundHeight + Math.floor(Math.random() * (this.world.height - this.world.groundHeight));
        const task = {
            id: this.nextTaskId++,
            target: [targetX, targetY],
            assignedAnts: new Set()
        };
        this.tasks.push(task);
        return task;
    }
    assignAntToTask(ant, taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.assignedAnts.add(ant);
            ant.taskId = taskId;
            ant.target = task.target;
            ant.resetForNewTarget(); // Reset ant state for new task
        }
    }
    // Called when an ant reaches its target
    onTaskCompleted(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1)
            return;
        const completedTask = this.tasks[taskIndex];
        const antsToReassign = Array.from(completedTask.assignedAnts);
        // Remove the completed task
        this.tasks.splice(taskIndex, 1);
        // Create a new task
        const newTask = this.createNewTask();
        // Reassign all ants from the completed task to the new task
        for (const ant of antsToReassign) {
            this.assignAntToTask(ant, newTask.id);
        }
    }
    update() {
        // Update all ants
        for (const ant of this.ants) {
            ant.move();
        }
    }
}
