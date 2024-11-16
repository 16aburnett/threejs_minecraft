// Minecraft clone made with THREE.js
// By Amy Burnett
// September 20, 2024
// =======================================================================
// Importing

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// =======================================================================
// Global variables


// =======================================================================

export function createUI (world, directionalLight, player)
{
    const gui = new GUI ();

    // Player settings
    const playerFolder = gui.addFolder ("Player");
    playerFolder.add (player, "walkSpeed", 0, 50).name ("Walk Speed");
    playerFolder.add (player, "runSpeed", 0, 50).name ("Run Speed");
    playerFolder.add (player.position, "x").name ("X");
    playerFolder.add (player.position, "y").name ("Y");
    playerFolder.add (player.position, "z").name ("Z");

    // Terrain generation settings
    const terrainFolder = gui.addFolder ("Terrain");
    terrainFolder.add (world, 'seed', 0, 10000, 1).name ("Seed");
    terrainFolder.add (world, 'noiseScale', 0, 0.1).name ("Noise Scale");
    terrainFolder.add (world, 'noiseOffsetx', -1, 1).name ("Noise Offset X");
    terrainFolder.add (world, 'noiseOffsetz', -1, 1).name ("Noise Offset Z");
    let seaLevelGUI = terrainFolder.add (world, 'seaLevel', 0, world.size, 1).name ("Sea Level");
    terrainFolder.onChange (() => {
        world.generate ();
    });

    // const shadowFolder = gui.addFolder ("Shadows");
    // shadowFolder.add (directionalLight.shadow.mapSize, "width" , [256, 512, 1024, 2048]);
    // shadowFolder.add (directionalLight.shadow.mapSize, "height", [256, 512, 1024, 2048]);

}
