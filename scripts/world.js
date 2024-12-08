// Minecraft clone made with THREE.js
// By Amy Burnett
// September 19, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { RNG } from './rng.js';
import { BlockId, blockData, resourceBlockIds } from './blockData.js'
import { Chunk, WORLD_HEIGHT, CHUNK_SIZE } from './chunk.js'

// =======================================================================
// Global variables


// =======================================================================

export default class World extends THREE.Group
{
    constructor ()
    {
        super ();
        // stores block information
        // Ex: {id, instanceId}
        // indexed by block position
        // this.data = [];
        // Terrain generation
        this.seed = 0;
        this.noiseScale = 0.03;
        this.noiseOffsetx = 0.5;
        this.noiseOffsetz = 0.5;
        this.seaLevel = Math.round (WORLD_HEIGHT / 2);

        // quick access map of the currently loaded chunks.
        // this enables quick lookup using the chunk (x,z) indices
        this.loadedChunks = new Map ();

        // keep track of modified chunk stacks that are outside the render distance
        // if a chunk is needed again, we can fetch the data here,
        // otherwise, we'll need to generate the terrain
        // Note: idealy, we should save this to a file to save RAM,
        // but unfortunately, we cannot save to files via javascript without
        // the user needing to approve a prompt for downloading the file.
        this.unloadedChunks = new Map ();

        this.chunkRenderDistance = 3;
        // Number of seconds between each chunk that gets generated
        this.chunkGenerationDelay = 0;
        this.lastChunkGenerationTime = 0;

        this.shouldLoadFollowPlayer = true;
        this.currentLoadPosition = new THREE.Vector3 (0, 0, 0);

        // Debug chunk boundaries
        this.shouldShowChunkBoundaries = false;
    }

    // ===================================================================

    // Resets all chunks so that their terrain can be regenerated
    // Useful for debugging/testing terrain generation
    reset ()
    {
        this.loadedChunks.clear ();
        this.unloadedChunks.clear ();
        this.clear ();
    }

    // ===================================================================

    toggleChunkBoundaries ()
    {
        this.shouldShowChunkBoundaries = !this.shouldShowChunkBoundaries;
        for (let [_, chunk] of this.loadedChunks.entries ())
            chunk.toggleChunkBoundaries ();
        for (let [_, chunk] of this.unloadedChunks.entries ())
            chunk.toggleChunkBoundaries ();
    }

    // ===================================================================

    generateTerrainForChunk (worldX, worldZ)
    {
        this.generateBaseTerrainForChunk (worldX, worldZ);
        this.generateResourcesForChunk (worldX, worldZ);
        this.generateRandomTreesForChunk (worldX, worldZ);
    }

    // ===================================================================

    // Generates the main blocks for the chunk
    // - Dirt, grass, stone
    generateBaseTerrainForChunk (worldX, worldZ)
    {
        let rng = new RNG (this.seed);
        let simplexNoise = new SimplexNoise (rng);
        for (let x = worldX; x < worldX + CHUNK_SIZE; ++x)
        {
            for (let z = worldZ; z < worldZ + CHUNK_SIZE; ++z)
            {
                // Use 2D noise to determine where to place the surface
                // scale changes frequency of change
                let noiseRangeLow = -1;
                let noiseRangeHight = 1;
                let noiseRange = noiseRangeHight - noiseRangeLow;
                let noiseValue = simplexNoise.noise (
                    this.noiseOffsetx + this.noiseScale * x, 
                    this.noiseOffsetz + this.noiseScale * z
                );
                // convert noise value to surface height
                let maxDepthBelowSeaLevel = 10;
                let maxLandAboveSeaLevel = 10;
                let surfaceHeightRangeLow = this.seaLevel - maxDepthBelowSeaLevel;
                let surfaceHeightRangeHight = this.seaLevel + maxLandAboveSeaLevel;
                let surfaceHeightRange = surfaceHeightRangeHight - surfaceHeightRangeLow;
                let surfaceHeight = Math.floor ((((noiseValue - noiseRangeLow) * surfaceHeightRange) / noiseRange) + surfaceHeightRangeLow);
                
                // Place surface block
                if (surfaceHeight >= this.seaLevel)
                {
                    // above sea level so surface is grass
                    this.setBlockId (x, surfaceHeight, z, BlockId.Grass);
                }
                else
                {
                    // block is below sealevel so make it sand
                    this.setBlockId (x, surfaceHeight, z, BlockId.Sand);
                }

                // Then going down from surface
                // place 3 blocks of dirt
                let numDirt = 3;
                for (let d = 1; d <= numDirt; ++d)
                {
                    // Ensure we are still in bounds
                    if (!this.isInBounds (x, surfaceHeight-d, z))
                        break;
                    if (surfaceHeight-d < 0)
                        break;
                    // Place dirt block
                    this.setBlockId (x, surfaceHeight-d, z, BlockId.Dirt);
                }
                // Then going down further until the bottom of the map
                // Place stone blocks
                let y = surfaceHeight-numDirt-1;
                let bottomHeight = 0;
                while (y >= bottomHeight)
                {
                    // Place stone
                    this.setBlockId (x, y, z, BlockId.Stone);
                    // Move to block below
                    --y;
                }

                // Place water on top
                // if surface was below sea level
                y = surfaceHeight+1;
                while (y <= this.seaLevel)
                {
                    this.setBlockId (x, y, z, BlockId.Water);
                    ++y;
                }
            }
        }
    }
    
    // ===================================================================

    // Generates the resources (coal, iron, diamond, etc) for a given
    // chunk of the world.
    generateResourcesForChunk (worldX, worldZ)
    {
        let rng = new RNG (this.seed);
        let simplexNoise = new SimplexNoise (rng);
        for (let resourceBlockId of resourceBlockIds)
        {
            const scale = blockData[resourceBlockId].resourceGeneration.scale;
            const offset = blockData[resourceBlockId].resourceGeneration.offset;
            const scarcity = blockData[resourceBlockId].resourceGeneration.scarcity;
            let maxHeight = blockData[resourceBlockId].resourceGeneration.maxHeight;
            if (maxHeight < 0)
                maxHeight = WORLD_HEIGHT;
            for (let x = worldX; x < worldX + CHUNK_SIZE; ++x)
            {
                for (let y = 0; y < maxHeight; ++y)
                {
                    for (let z = worldZ; z < worldZ + CHUNK_SIZE; ++z)
                    {
                        let randomValue = simplexNoise.noise3d (
                            x / scale + offset,
                            y / scale + offset,
                            z / scale + offset
                        );
                        // Ensure scarcity is not exceeded
                        if (randomValue <= scarcity)
                            continue;
                        // Ensure ore's are spawned in the ground
                        if (this.getBlockId (x, y, z) != BlockId.Stone)
                            continue;
                        this.setBlockId (x, y, z, resourceBlockId);
                    }
                }
            }
        }
    }

    // ===================================================================

    // generates random trees for the given chunk indicated by the chunk's
    // world position.
    // TODO: maybe don't use world position? seems weird
    generateRandomTreesForChunk (worldX, worldZ)
    {
        let rng = new RNG (this.seed);
        // generate a random number of trees for this chunk
        let numTress = Math.floor (rng.random () * 10);
        for (let t = 0; t < numTress; ++t)
        {
            // find a random x, z position to place the tree
            let chunkBlockIndexX = Math.floor (rng.random () * CHUNK_SIZE);
            let chunkBlockIndexZ = Math.floor (rng.random () * CHUNK_SIZE);
            let blockX = worldX + chunkBlockIndexX;
            let blockZ = worldZ + chunkBlockIndexZ;

            // find surface level
            let blockY = 0;
            for ( ; blockY < WORLD_HEIGHT; ++blockY)
            {
                let blockId = this.getBlockId (blockX, blockY, blockZ);
                // Only treat a grass block as being the surface level
                if (blockId == BlockId.Grass)
                {
                    break;
                }
            }

            // ensure that we found a grass block
            if (blockY >= WORLD_HEIGHT)
                // ignore this tree
                break;

            // ensure tree can be placed there
            // **skip for now

            // TODO: need to streamline adding in block features,
            // this is a mess.

            // place tree trunk
            this.setBlockId (blockX, blockY+1, blockZ, BlockId.Log);
            this.setBlockId (blockX, blockY+2, blockZ, BlockId.Log);
            this.setBlockId (blockX, blockY+3, blockZ, BlockId.Log);
            this.setBlockId (blockX, blockY+4, blockZ, BlockId.Log);
            this.setBlockId (blockX, blockY+5, blockZ, BlockId.Log);
            // place top layer of leaves
            this.setBlockId (blockX  , blockY+6, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX  , blockY+6, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+6, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX  , blockY+6, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+6, blockZ  , BlockId.Leaves);
            // place next layer of leaves
            this.setBlockId (blockX  , blockY+5, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+5, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+5, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX  , blockY+5, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+5, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+5, blockZ  , BlockId.Leaves);
            // place next layer of leaves
            this.setBlockId (blockX-2, blockY+4, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX-2, blockY+4, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX-2, blockY+4, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX-2, blockY+4, blockZ+2, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+4, blockZ-2, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+4, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+4, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+4, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+4, blockZ+2, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+4, blockZ-2, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+4, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+4, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+4, blockZ+2, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+4, blockZ-2, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+4, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+4, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+4, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+4, blockZ+2, BlockId.Leaves);
            this.setBlockId (blockX+2, blockY+4, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX+2, blockY+4, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX+2, blockY+4, blockZ+1, BlockId.Leaves);
            // place next layer of leaves
            this.setBlockId (blockX-2, blockY+3, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX-2, blockY+3, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX-2, blockY+3, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+3, blockZ-2, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+3, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+3, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+3, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX-1, blockY+3, blockZ+2, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+3, blockZ-2, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+3, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+3, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX  , blockY+3, blockZ+2, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+3, blockZ-2, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+3, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+3, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+3, blockZ+1, BlockId.Leaves);
            this.setBlockId (blockX+1, blockY+3, blockZ+2, BlockId.Leaves);
            this.setBlockId (blockX+2, blockY+3, blockZ-2, BlockId.Leaves);
            this.setBlockId (blockX+2, blockY+3, blockZ-1, BlockId.Leaves);
            this.setBlockId (blockX+2, blockY+3, blockZ  , BlockId.Leaves);
            this.setBlockId (blockX+2, blockY+3, blockZ+1, BlockId.Leaves);

        }
    }

    // ===================================================================

    // Unloads chunks that are outside of the chunk render distance.
    unloadChunksOutsideRenderDistance ()
    {
        let currentCentralChunkIndices = convertWorldPosToChunkIndex (
            this.currentLoadPosition.x,
            this.currentLoadPosition.y,
            this.currentLoadPosition.z
        );
        let chunkLowerBoundX = currentCentralChunkIndices[0] - this.chunkRenderDistance;
        let chunkUpperBoundX = currentCentralChunkIndices[0] + this.chunkRenderDistance;
        let chunkLowerBoundZ = currentCentralChunkIndices[2] - this.chunkRenderDistance;
        let chunkUpperBoundZ = currentCentralChunkIndices[2] + this.chunkRenderDistance;
        // Unload chunks that are outside the render distance
        for (let [key, chunk] of this.loadedChunks.entries ())
        {
            // Ensure chunk is not within the render distance
            let chunkIndexX = chunk.chunkIndexX;
            let chunkIndexZ = chunk.chunkIndexZ;
            let isWithinBoundsX = chunkLowerBoundX <= chunkIndexX &&
                chunkIndexX <= chunkUpperBoundX;
            let isWithinBoundsZ = chunkLowerBoundZ <= chunkIndexZ &&
                chunkIndexZ <= chunkUpperBoundZ;
            if (isWithinBoundsX && isWithinBoundsZ)
                continue;
            // This chunk is not within the bounds,
            // remove it
            this.loadedChunks.delete (key);
            this.remove (chunk);
            chunk.disposeInstances ();
            console.log (`Chunk '${key}' was removed`);
            // Save chunk to unloaded list so we can restore it later
            // Note: if we continuously add chunks to this map,
            // then we will run out of memory.
            this.unloadedChunks.set (key, chunk);
        }
    }

    // ===================================================================

    // Loads chunks that are within the chunk render distance.
    loadChunksInRenderDistance ()
    {
        let currentCentralChunkIndices = convertWorldPosToChunkIndex (
            this.currentLoadPosition.x,
            this.currentLoadPosition.y,
            this.currentLoadPosition.z
        );
        let chunkLowerBoundX = currentCentralChunkIndices[0] - this.chunkRenderDistance;
        let chunkUpperBoundX = currentCentralChunkIndices[0] + this.chunkRenderDistance;
        let chunkLowerBoundZ = currentCentralChunkIndices[2] - this.chunkRenderDistance;
        let chunkUpperBoundZ = currentCentralChunkIndices[2] + this.chunkRenderDistance;
        for (let x = chunkLowerBoundX; x <= chunkUpperBoundX; ++x)
        {
            for (let z = chunkLowerBoundZ; z <= chunkUpperBoundZ; ++z)
            {
                let key = `${x},${z}`;
                let chunk = null;
                // Ensure chunk wasnt already loaded
                if (this.loadedChunks.has (key))
                    continue;
                // Restore chunk if it was previously loaded
                if (this.unloadedChunks.has (key))
                {
                    chunk = this.unloadedChunks.get (key);
                    this.unloadedChunks.delete (key);
                    this.loadedChunks.set (key, chunk);
                    this.add (chunk);
                    // unloaded chunks dont have a mesh
                    chunk.needsMeshGeneration = true;
                    console.log (`Chunk '${key}' was reloaded`);
                    continue;
                }
                // chunk was not previously loaded,
                // need to create a new chunk
                chunk = new Chunk (x, z, this.shouldShowChunkBoundaries);
                this.loadedChunks.set (key, chunk);
                this.add (chunk);
                console.log (`Chunk '${key}' was loaded`);
            }
        }
    }

    // ===================================================================

    // Attempts to generate terrain for chunks if the terrain generation
    // delay is over.
    generateTerrainForEmptyChunks ()
    {
        let now = performance.now () / 1000.0;
        if (now - this.lastChunkGenerationTime >= this.chunkGenerationDelay)
        {
            for (let [key, chunk] of this.loadedChunks.entries ())
            {
                // Ensure chunk needs terrain generation
                if (!chunk.needsTerrainGeneration)
                    continue;
                this.generateTerrainForChunk (chunk.chunkPosX, chunk.chunkPosZ);
                chunk.needsTerrainGeneration = false;
                chunk.needsMeshGeneration = true;
                this.lastChunkGenerationTime = performance.now () / 1000.0;
                // We only want to generate terrain for 1 chunk at a time
                break;
            }
        }
    }

    // ===================================================================

    // Generates new meshes for chunks that need it.
    // Chunks keep track of whether their meshes need updating
    generateMeshesForChunksThatNeedIt ()
    {
        for (let [key, chunk] of this.loadedChunks.entries ())
        {
            // Ensure chunk needs a new mesh
            if (!chunk.needsMeshGeneration)
                continue;
            chunk.generateMeshes ();
        }
    }

    // ===================================================================

    // Handles the frame-to-frame updates for the world
    update (player)
    {
        if (this.shouldLoadFollowPlayer)
            this.currentLoadPosition.set (
                player.position.x,
                player.position.y,
                player.position.z
            );
        // Unload chunks that are outside the render distance
        this.unloadChunksOutsideRenderDistance ();

        // Load chunks that are within the render distance
        this.loadChunksInRenderDistance ();

        // Generate terrain for empty loaded chunks
        this.generateTerrainForEmptyChunks ();

        // Update the meshes of any chunk that changed
        this.generateMeshesForChunksThatNeedIt ();
    }

    // ===================================================================

    /**
     * Removes the block at the given coordinates from the world.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    removeBlock (x, y, z)
    {
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            // no block to remove
            return;
        containingChunk.removeBlock (
            ...blockToChunkBlockIndex (x, y, z)
        );
        // Reveal surrounding blocks
        this.revealBlock (x-1, y  , z  );
        this.revealBlock (x+1, y  , z  );
        this.revealBlock (x  , y-1, z  );
        this.revealBlock (x  , y+1, z  );
        this.revealBlock (x  , y  , z-1);
        this.revealBlock (x  , y  , z+1);
    }

    // ===================================================================

    /**
     * Adds a block with the given id at the given coordinates.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    addBlock (x, y, z, blockId)
    {
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            // no block to remove
            return;
        containingChunk.addBlock (
            ...blockToChunkBlockIndex (x, y, z),
            blockId
        );
        // Update surrounding blocks
        this.revealBlock (x-1, y  , z  );
        this.revealBlock (x+1, y  , z  );
        this.revealBlock (x  , y-1, z  );
        this.revealBlock (x  , y+1, z  );
        this.revealBlock (x  , y  , z-1);
        this.revealBlock (x  , y  , z+1);
    }

    // ===================================================================

    /**
     * Adds the faces of the block at the given position to the mesh so
     * that it can be shown in the scene.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    revealBlock (x, y, z)
    {
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            // no block to remove
            return;
        containingChunk.addBlockFaceInstances (
            ...blockToChunkBlockIndex (x, y, z)
        );
    }

    // ===================================================================
    // Helper functions
    // ===================================================================

    // Returns the block data of the block at the given position
    getBlock (x, y, z)
    {
        // if (this.isInBounds (x, y, z))
        //     return this.data[x][y][z];
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            return null;
        return containingChunk.getBlock (
            ...blockToChunkBlockIndex (x, y, z)
        );
    }

    // ===================================================================

    // Returns the block id of the block at the given position
    getBlockId (x, y, z)
    {
        // if (this.isInBounds (x, y, z))
        //     return this.data[x][y][z].id;
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            return null;
        let [cx, _, cz] = blockToChunkBlockIndex (x, y, z);
        return containingChunk.getBlockId (cx, y, cz);
    }

    // ===================================================================

    // Sets the id of the block at the given position to the given
    // block id
    setBlockId (x, y, z, id)
    {
        // if (this.isInBounds (x, y, z))
        //     this.data[x][y][z].id = id;
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            return;
        containingChunk.setBlockId (
            ...blockToChunkBlockIndex (x, y, z),
            id
        );
    }

    // ===================================================================

    // Returns the instance id of the given block
    getBlockInstanceId (x, y, z)
    {
        // if (this.isInBounds (x, y, z))
        //     return this.data[x][y][z].instanceId;
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            return null;
        return containingChunk.getBlockInstanceId (
            ...blockToChunkBlockIndex (x, y, z)
        );
    }

    // ===================================================================

    // Sets the given block to the given instance id
    setBlockInstanceId (x, y, z, instanceId)
    {
        // if (this.isInBounds (x, y, z))
        //     this.data[x][y][z].instanceId = instanceId;
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        if (!containingChunk)
            return;
        return containingChunk.setBlockInstanceId (
            ...blockToChunkBlockIndex (x, y, z),
            instanceId
        );
    }

    // ===================================================================

    // Returns true if the given position is within the bounds of
    // the world, false otherwise.
    isInBounds (x, y, z)
    {
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        return containingChunk.isInBounds (
            ...blockToChunkBlockIndex (x, y, z)
        );
    }

    // ===================================================================

    // Returns true if the block at the given position is surrounded by
    // solid blocks, false otherwise
    isBlockObscured (x, y, z)
    {
        // TODO: Update to use isBlockSolid
        let blockIdUp    = this.getBlock (x  , y+1, z  )?.id ?? BlockId.Air;
        let blockIdDown  = this.getBlock (x  , y-1, z  )?.id ?? BlockId.Air;
        let blockIdLeft  = this.getBlock (x-1, y  , z  )?.id ?? BlockId.Air;
        let blockIdRight = this.getBlock (x+1, y  , z  )?.id ?? BlockId.Air;
        let blockIdFront = this.getBlock (x  , y  , z+1)?.id ?? BlockId.Air;
        let blockIdBack  = this.getBlock (x  , y  , z-1)?.id ?? BlockId.Air;
        return blockIdUp    !== BlockId.Air &&
               blockIdDown  !== BlockId.Air &&
               blockIdLeft  !== BlockId.Air &&
               blockIdRight !== BlockId.Air &&
               blockIdFront !== BlockId.Air &&
               blockIdBack  !== BlockId.Air;
    }

    // ===================================================================

    // Returns true if the block at the given position is solid,
    // otherwise false
    // If position is out-of-bounds, block is assumed to be air which is
    // not a Solid block
    isBlockSolid (x, y, z)
    {
        let blockId    = this.getBlock (x, y, z)?.id ?? BlockId.Air;
        return blockId !== BlockId.Air;
    }
}

//========================================================================

// converts the given world coordinates to the containing chunk's
// chunk index
// Example: position(17, 32, 20) is in chunk(1, 0, 1)
// Chunks span the full height of the world so the Y value
// does not mean anything
function convertWorldPosToChunkIndex (worldX, worldY, worldZ)
{
    let blockWidth = 1;
    let chunkIndexX = Math.floor (worldX / (CHUNK_SIZE * blockWidth));
    let chunkIndexY = Math.floor (worldY / (CHUNK_SIZE * blockWidth));
    let chunkIndexZ = Math.floor (worldZ / (CHUNK_SIZE * blockWidth));
    return [chunkIndexX, chunkIndexY, chunkIndexZ];
}

//========================================================================

// Converts the given block position to block index relative to the
// containing chunk.
function blockToChunkBlockIndex (x, y, z)
{
    let chunkBlockX = x < 0 ? (x + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : x % CHUNK_SIZE;
    let chunkBlockY = y < 0 ? (y + 1) % WORLD_HEIGHT + (WORLD_HEIGHT - 1) : y % WORLD_HEIGHT;
    let chunkBlockZ = z < 0 ? (z + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : z % CHUNK_SIZE;
    return [chunkBlockX, chunkBlockY, chunkBlockZ];
}
