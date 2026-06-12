import { AntFarm, AntFarmOptions } from './entities/AntFarm.js';

const DEFAULT_OPTIONS: AntFarmOptions = {
    width: 150,
    height: 200,
    groundHeight: 5,
    numberOfAnts: 50,
    anthillCount: 3,
    targetTPS: 0, // ticks per second (0 = unlimited)
    tileDisplaySize: 4,
};

let antFarm: AntFarm;

function getNumberInput(id: string) {
    return document.getElementById(id) as HTMLInputElement;
}

function setInputs(options: AntFarmOptions) {
    getNumberInput('widthInput').value = options.width.toString();
    getNumberInput('heightInput').value = options.height.toString();
    getNumberInput('groundHeightInput').value = options.groundHeight.toString();
    getNumberInput('numberOfAntsInput').value = options.numberOfAnts.toString();
    getNumberInput('anthillCountInput').value = options.anthillCount.toString();
    getNumberInput('targetTPSInput').value = (options.targetTPS ?? 0).toString();
    getNumberInput('tileDisplaySizeInput').value = options.tileDisplaySize.toString();
}

function readOptions(): AntFarmOptions {
    const width = readPositiveInteger('widthInput', DEFAULT_OPTIONS.width);
    const height = readPositiveInteger('heightInput', DEFAULT_OPTIONS.height);
    const maxGroundHeight = Math.max(0, height - 3);

    return {
        width,
        height,
        groundHeight: clamp(readPositiveInteger('groundHeightInput', DEFAULT_OPTIONS.groundHeight), 0, maxGroundHeight),
        numberOfAnts: readNonNegativeInteger('numberOfAntsInput', DEFAULT_OPTIONS.numberOfAnts),
        anthillCount: readNonNegativeInteger('anthillCountInput', DEFAULT_OPTIONS.anthillCount),
        targetTPS: readNonNegativeInteger('targetTPSInput', DEFAULT_OPTIONS.targetTPS ?? 0),
        tileDisplaySize: readPositiveInteger('tileDisplaySizeInput', DEFAULT_OPTIONS.tileDisplaySize),
    };
}

function readPositiveInteger(id: string, fallback: number) {
    return Math.max(1, readInteger(id, fallback));
}

function readNonNegativeInteger(id: string, fallback: number) {
    return Math.max(0, readInteger(id, fallback));
}

function readInteger(id: string, fallback: number) {
    const value = Number.parseInt(getNumberInput(id).value, 10);
    return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function createAntFarm(options: AntFarmOptions) {
    antFarm?.destroy();
    document.getElementById('playPause')!.textContent = 'Play';
    antFarm = new AntFarm(options);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ant Farm initialized');
    setInputs(DEFAULT_OPTIONS);
    createAntFarm(DEFAULT_OPTIONS);

    document.getElementById('playPause')!.addEventListener('click', () => {
        antFarm.toggle();
    });

    document.getElementById('step')!.addEventListener('click', () => {
        antFarm.step();
    });

    document.getElementById('reset')!.addEventListener('click', () => {
        createAntFarm(readOptions());
    });

    document.getElementById('settingsForm')!.addEventListener('submit', (event) => {
        event.preventDefault();
        const options = readOptions();
        setInputs(options);
        createAntFarm(options);
    });
});
