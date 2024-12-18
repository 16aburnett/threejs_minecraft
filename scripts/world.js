// Minecraft clone made with THREE.js
// By Amy Burnett
// September 19, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { BlockId } from './blockData.js'
import { Chunk, WORLD_HEIGHT, CHUNK_SIZE } from './chunk.js'
import { TerrainGenerator } from './terrainGeneration.js'

// =======================================================================
// Global variables


// =======================================================================

export default class World extends THREE.Group
{
    constructor ()
    {
        super ();
        // Terrain generation
        this.terrainGenerator = new TerrainGenerator (this);

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
        this.chunkGenerationDelay = 0.0;
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

    // Unloads chunks that are outside of the chunk render distance.
    unloadChunksOutsideRenderDistance ()
    {
        let currentCentralChunkIndices = convertWorldPosToChunkIndex (
            this.currentLoadPosition.x,
            this.currentLoadPosition.y,
            this.currentLoadPosition.z
        );
        // loading 1 chunk further than render distance
        // so that chunk meshes blend
        let loadDistance = this.chunkRenderDistance + 1;
        let chunkLowerBoundX = currentCentralChunkIndices[0] - loadDistance;
        let chunkUpperBoundX = currentCentralChunkIndices[0] + loadDistance;
        let chunkLowerBoundZ = currentCentralChunkIndices[2] - loadDistance;
        let chunkUpperBoundZ = currentCentralChunkIndices[2] + loadDistance;
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
        // loading 1 chunk further than render distance
        // so that chunk meshes blend
        let loadDistance = this.chunkRenderDistance + 1;
        let chunkLowerBoundX = currentCentralChunkIndices[0] - loadDistance;
        let chunkUpperBoundX = currentCentralChunkIndices[0] + loadDistance;
        let chunkLowerBoundZ = currentCentralChunkIndices[2] - loadDistance;
        let chunkUpperBoundZ = currentCentralChunkIndices[2] + loadDistance;
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
                chunk = new Chunk (x, z, this.shouldShowChunkBoundaries, this);
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
                this.terrainGenerator.generateTerrainForChunk (
                    chunk.chunkPosX,
                    chunk.chunkPosZ
                );
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

                // ensure chunk exists
                // this really should not happen, but check
                if (!this.loadedChunks.has (key))
                    continue;
                
                let chunk = this.loadedChunks.get (key);

                // Ensure chunk needs a new mesh
                if (!chunk.needsMeshGeneration)
                    continue;
                // Ensure that neighboring meshes have their terrain
                // generated
                // This is needed so that we can eliminate unneeded faces
                // at chunk boundaries
                const northKey = `${chunk.chunkIndexX},${chunk.chunkIndexZ+1}`;
                const isNorthGenerated = this.loadedChunks.has (northKey)
                    && !this.loadedChunks.get (northKey).needsTerrainGeneration;
                const eastKey  = `${chunk.chunkIndexX+1},${chunk.chunkIndexZ}`;
                const isEastGenerated = this.loadedChunks.has (eastKey)
                    && !this.loadedChunks.get (eastKey).needsTerrainGeneration;
                const southKey = `${chunk.chunkIndexX},${chunk.chunkIndexZ-1}`;
                const isSouthGenerated = this.loadedChunks.has (southKey)
                    && !this.loadedChunks.get (southKey).needsTerrainGeneration;
                const westKey  = `${chunk.chunkIndexX-1},${chunk.chunkIndexZ}`;
                const isWestGenerated = this.loadedChunks.has (westKey)
                    && !this.loadedChunks.get (westKey).needsTerrainGeneration;
                if (
                    !isNorthGenerated
                    || !isEastGenerated
                    || !isSouthGenerated
                    || !isWestGenerated
                ) continue;

                chunk.generateMeshes ();
            }
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

    /**
     * Returns the block id of the block at the given position.
     * Returns BlockId.Air if position does not exist.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    getBlockId (x, y, z)
    {
        // if (this.isInBounds (x, y, z))
        //     return this.data[x][y][z].id;
        // Get containing chunk
        let chunkIndexX = Math.floor (x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (z / CHUNK_SIZE);
        let key = `${chunkIndexX},${chunkIndexZ}`;
        let containingChunk = this.loadedChunks.get (key);
        // Ensure chunk exists
        if (!containingChunk)
            containingChunk = this.unloadedChunks.get (key);
        if (!containingChunk)
            return BlockId.Air;
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
