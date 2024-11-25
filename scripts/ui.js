// Minecraft clone made with THREE.js
// By Amy Burnett
// September 20, 2024
// =======================================================================
// Importing

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { blockData, resourceBlockIds } from './blockData.js';

// =======================================================================
// Global variables


// =======================================================================

export class UI
{
    constructor (world, directionalLight, player, axesHelper)
    {
        this.gui = new GUI ();
    
        // Player settings
        const playerFolder = this.gui.addFolder ("Player");
        playerFolder.add (player, "walkSpeed", 0, 50).name ("Walk Speed");
        playerFolder.add (player, "runSpeed", 0, 50).name ("Run Speed");
        playerFolder.add (player.position, "x").name ("X");
        playerFolder.add (player.position, "y").name ("Y");
        playerFolder.add (player.position, "z").name ("Z");
    
        // World settings
        const worldFolder = this.gui.addFolder ("World");
        worldFolder.add (world, "chunkRenderRadius", 1, 20, 1).name ("Chunk Render Radius");
        worldFolder.add (world, "chunkGenerationDelay", 0, 3, 0.1).name ("Chunk Generation Delay");
        worldFolder.add (world, "shouldLoadFollowPlayer").name ("Follow Player");
        worldFolder.add (world, "toggleChunkBoundaries").name ("Toggle Chunk Boundaries");
        worldFolder.add (axesHelper, "visible").name ("Show Axes Helper");

        // Terrain generation settings
        const terrainFolder = this.gui.addFolder ("Terrain Generation");
        terrainFolder.add (world, 'seed', 0, 10000, 1).name ("Seed");
        terrainFolder.add (world, 'noiseScale', 0, 0.1).name ("Noise Scale");
        terrainFolder.add (world, 'noiseOffsetx', -1, 1).name ("Noise Offset X");
        terrainFolder.add (world, 'noiseOffsetz', -1, 1).name ("Noise Offset Z");
        let seaLevelGUI = terrainFolder.add (world, 'seaLevel', 0, world.size, 1).name ("Sea Level");
        terrainFolder.onChange (() => {
            world.reset ();
        });
        // Resource generation
        const resourcesFolder = terrainFolder.addFolder ("Resources");
        for (let resource of resourceBlockIds)
        {
            let resourceFolder = resourcesFolder.addFolder (blockData[resource].name);
            resourceFolder.add (blockData[resource].resourceGeneration, "scale", 0, 100).name ("Scale");
            resourceFolder.add (blockData[resource].resourceGeneration, "scarcity", 0, 1).name ("Scarcity");
            resourceFolder.add (blockData[resource].resourceGeneration, "offset", 0, 30).name ("Offset");
            resourceFolder.add (blockData[resource].resourceGeneration, "maxHeight", -1, world.size).name ("Max Height");
        }

        // const shadowFolder = this.gui.addFolder ("Shadows");
        // shadowFolder.add (directionalLight.shadow.mapSize, "width" , [256, 512, 1024, 2048]);
        // shadowFolder.add (directionalLight.shadow.mapSize, "height", [256, 512, 1024, 2048]);
    
    }

    // ===================================================================

    update ()
    {
        // Update the display of each controller
        // Controllers can be nested within folders
        let foldersToUpdate = [this.gui];
        while (foldersToUpdate.length != 0)
        {
            // move to the next folder
            let currentFolder = foldersToUpdate.shift ();

            // add nested folders to the backlog
            for (let childFolder of currentFolder.folders)
                foldersToUpdate.push (childFolder);

            // Update any controllers in this folder
            for (let controller of currentFolder.controllers)
            {
                controller.updateDisplay ();
            }

        }
    }
}

