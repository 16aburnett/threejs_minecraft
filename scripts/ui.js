// Minecraft clone made with THREE.js
// By Amy Burnett
// September 20, 2024
// =======================================================================
// Importing

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// =======================================================================
// Global variables


// =======================================================================

export function createUI (world, directionalLight)
{
    const gui = new GUI ();

    gui.add (world, 'size', 8, 64, 1).name ("Chunk Size");

    // Terrain generation settings
    const terrainFolder = gui.addFolder ("Terrain");
    terrainFolder.add (world, 'seed', 0, 10000, 1).name ("Seed");
    terrainFolder.add (world, 'noiseScale', 0, 0.1).name ("Noise Scale");
    terrainFolder.add (world, 'noiseOffsetx', -1, 1).name ("Noise Offset X");
    terrainFolder.add (world, 'noiseOffsetz', -1, 1).name ("Noise Offset Z");
    let seaLevelGUI = terrainFolder.add (world, 'seaLevel', 0, world.size, 1).name ("Sea Level");

    // const shadowFolder = gui.addFolder ("Shadows");
    // shadowFolder.add (directionalLight.shadow.mapSize, "width" , [256, 512, 1024, 2048]);
    // shadowFolder.add (directionalLight.shadow.mapSize, "height", [256, 512, 1024, 2048]);

    gui.onChange (() => {
        world.generate ();
    });
}
