// Minecraft clone made with THREE.js
// By Amy Burnett
// September 19, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { BlockId } from "./blockId.js";
import { blockData } from './blockData.js'
import { Chunk, WORLD_HEIGHT, CHUNK_SIZE } from './chunk.js'
import { TerrainGenerator } from './terrainGeneration.js'
import { DataStore } from './dataStore.js';
import { Item } from './item.js';
import { ItemEntity } from './itemEntity.js';
import { ItemStack } from './itemStack.js';
import { generateRandomVectorWithinCone } from './utils.js';
import MobEntity from './mobEntity.js';

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

        this.chunkRenderDistance = 3;
        // Number of seconds between each chunk that gets generated
        this.chunkGenerationDelay = 0.0;
        this.lastChunkGenerationTime = 0;

        this.shouldLoadFollowPlayer = true;
        this.currentLoadPosition = new THREE.Vector3 (0, 0, 0);

        // Debug chunk boundaries
        this.shouldShowChunkBoundaries = false;

        // For persisting user changes of the world
        this.dataStore = new DataStore ();

        // Mobs
        this.mobCapacity = 10;
        this.lastMobSpawnTime = 0.0;
        // Seconds between mob spawning
        this.mobSpawnDelay = 1.0;

        this.pregenerateChunks ();
    }

    // ===================================================================

    // Resets all chunks so that their terrain can be regenerated
    // Useful for debugging/testing terrain generation
    reset ()
    {
        for (let chunk of this.loadedChunks.values ())
            chunk.disposeInstances ();
        this.loadedChunks.clear ();
        this.clear ();
    }

    // ===================================================================

    toggleChunkBoundaries ()
    {
        this.shouldShowChunkBoundaries = !this.shouldShowChunkBoundaries;
        for (let [_, chunk] of this.loadedChunks.entries ())
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
            // store chunk's entities so they can be reloaded
            // NOTE: We may want to only store certain entities
            // Minecraft typically only saves mobs that the player interacted with
            // ItemEntities should always be stored though.
            const hasEntitiesToStore = chunk.entities.length > 0;
            const hadPreviouslyStoredEntities = this.dataStore.getEntities (chunkIndexX, chunkIndexZ) !== undefined;
            if (hasEntitiesToStore || hadPreviouslyStoredEntities)
            {
                console.log (`Storing ${chunk.entities.length} entities for chunk '${key}'`);
                this.dataStore.setEntities (chunkIndexX, chunkIndexZ, chunk.entities);
            }
            // Remove entities from the world
            for (const entity of chunk.entities)
            {
                entity.removeFromParent ();
            }
            chunk.disposeInstances ();
            console.log (`Chunk '${key}' was removed`);
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
                // chunk was not previously loaded,
                // need to create a new chunk
                chunk = new Chunk (x, z, this.shouldShowChunkBoundaries, this);
                this.loadedChunks.set (key, chunk);
                this.add (chunk);
                for (const entity of chunk.entities)
                    this.add (entity);
                console.log (`Chunk '${key}' was loaded`);
            }
        }
    }

    // ===================================================================

    // Attempts to generate terrain for chunks if the terrain generation
    // delay is over.
    generateTerrainForEmptyChunks (shouldGenerateAll = false)
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
                if (!shouldGenerateAll)
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

        this.spawnMobs ();
        
        for (const chunk of this.loadedChunks.values ())
            chunk.update ();

        // Update entities
        for (const entity of this.getEntities ())
        {
            entity.update ();
            this.updateEntitysContainingChunk (entity);
        }
    }

    // ===================================================================

    pregenerateChunks ()
    {
        console.log ("Pre-generating World...");
        // Unload chunks that are outside the render distance
        this.unloadChunksOutsideRenderDistance ();

        // Load chunks that are within the render distance
        this.loadChunksInRenderDistance ();

        // Generate terrain for empty loaded chunks
        this.generateTerrainForEmptyChunks (true);

        // Update the meshes of any chunk that changed
        this.generateMeshesForChunksThatNeedIt ();
        console.log ("Finished pre-generating world");
    }

    // ===================================================================

    spawnMobs ()
    {
        // Ensure it is time to spawn mobs
        const now = performance.now () / 1000.0;
        if (now - this.lastMobSpawnTime < this.mobSpawnDelay)
            return;
        // updating here as we still want a delay even when it fails to spawn a mob
        this.lastMobSpawnTime = performance.now () / 1000.0;
        // Ensure that we did not hit the mob cap
        const entities = this.getEntities ();
        let num_mobs = 0;
        for (const entity of entities)
            if (entity instanceof MobEntity)
                num_mobs++;
        if (num_mobs > this.mobCapacity)
        {
            console.log ("too many mobs, not spawning more");
            return;
        }

        // Grab a random chunk to spawn the mob in
        const keys = Array.from (this.loadedChunks.keys ());
        const randomKey = keys[Math.floor (Math.random () * keys.length)];
        const randomChunk = this.loadedChunks.get (randomKey);
        // Spawn a mob in the chunk
        randomChunk.spawnMob ();
    }

    // ===================================================================

    /**
     * Returns a list of the currently loaded entities
     */
    getEntities ()
    {
        const entities = [];
        for (const chunk of this.loadedChunks.values ())
        {
            for (const entity of chunk.entities)
            {
                entities.push (entity);
            }
        }
        return entities;
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
        if (containingChunk === undefined)
            // no block to remove
            return;
        const [chunkBlockX, chunkBlockY, chunkBlockZ]
            = blockToChunkBlockIndex (x, y, z);
        const blockId = containingChunk.getBlockId (
            chunkBlockX,
            chunkBlockY,
            chunkBlockZ
        );
        containingChunk.removeBlock (
            chunkBlockX,
            chunkBlockY,
            chunkBlockZ
        );
        // Reveal surrounding blocks
        this.revealBlock (x-1, y  , z  );
        this.revealBlock (x+1, y  , z  );
        this.revealBlock (x  , y-1, z  );
        this.revealBlock (x  , y+1, z  );
        this.revealBlock (x  , y  , z-1);
        this.revealBlock (x  , y  , z+1);
        // Save this change
        this.dataStore.set (
            chunkIndexX,
            chunkIndexZ,
            chunkBlockX,
            chunkBlockY,
            chunkBlockZ,
            BlockId.Air
        );
        // Drop loot from block
        const itemId = blockData[blockId].itemToDrop;
        const itemEntity = new ItemEntity (
            new ItemStack (new Item (itemId), 1),
            {parentChunk: containingChunk}
        );
        const blockCenterX = x + 0.5;
        const blockCenterY = y + 0.5;
        const blockCenterZ = z + 0.5;
        itemEntity.position.set (
            blockCenterX,
            blockCenterY,
            blockCenterZ
        );
        // give entity a random velocity
        const randomDirection = generateRandomVectorWithinCone (
            Math.PI * 0.5
        );
        const speed = 10; // meters/second
        randomDirection.multiplyScalar (speed);
        itemEntity.velocity.copy (randomDirection);
        containingChunk.addEntity (itemEntity);
        this.add (itemEntity);
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
        if (containingChunk === undefined)
            // no block to remove
            return;
        const [chunkBlockX, chunkBlockY, chunkBlockZ]
            = blockToChunkBlockIndex (x, y, z);
        containingChunk.addBlock (
            chunkBlockX,
            chunkBlockY,
            chunkBlockZ,
            blockId
        );
        // Update surrounding blocks
        this.revealBlock (x-1, y  , z  );
        this.revealBlock (x+1, y  , z  );
        this.revealBlock (x  , y-1, z  );
        this.revealBlock (x  , y+1, z  );
        this.revealBlock (x  , y  , z-1);
        this.revealBlock (x  , y  , z+1);
        // Save this change
        this.dataStore.set (
            chunkIndexX,
            chunkIndexZ,
            chunkBlockX,
            chunkBlockY,
            chunkBlockZ,
            blockId
        );
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
        if (containingChunk === undefined)
            // no block to remove
            return;
        containingChunk.addBlockFaceInstances (
            ...blockToChunkBlockIndex (x, y, z)
        );
    }

    // ===================================================================

    addEntity (entity)
    {
        this.updateEntitysContainingChunk (entity);
        this.add (entity);
    }

    // ===================================================================

    updateEntitysContainingChunk (entity)
    {
        // Get containing chunk
        let chunkIndexX = Math.floor (entity.position.x / CHUNK_SIZE);
        let chunkIndexZ = Math.floor (entity.position.z / CHUNK_SIZE);
        let containingChunk = this.loadedChunks.get (`${chunkIndexX},${chunkIndexZ}`);
        // Ensure chunk exists and is loaded
        if (containingChunk === undefined)
        {
            console.log ("Entity's containing chunk is not loaded", chunkIndexX, chunkIndexZ);
            console.log ("Stashing entity and removing from world");
            this.dataStore.addEntity (chunkIndexX, chunkIndexZ, entity);
            // Ensure entity does not belong to another chunk
            // This would be the case if an entity moved from a loaded chunk to unloaded
            if (entity.parentChunk != null)
                entity.parentChunk.removeEntity (entity);
            // Remove entity from the world so we cant see it anymore
            entity.removeFromParent ();
            return;
        }
        // Ensure entity's chunk changed
        if (entity.parentChunk != null && entity.parentChunk == containingChunk)
            return;
        // Ensure entity does not belong to another chunk
        if (entity.parentChunk != null)
            entity.parentChunk.removeEntity (entity);
        // Add entity to the new chunk
        containingChunk.addEntity (entity);
        entity.parentChunk = containingChunk;
    }

    // ===================================================================

    /**
     * Returns the biome at the given position
     * @param {Number} worldX
     * @param {Number} worldY
     * @param {Number} worldZ
     * @returns
     */
    getBiome (worldX, worldY, worldZ)
    {
        return this.terrainGenerator.getBiome (worldX, worldZ);
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
        if (containingChunk === undefined)
            return null;
        return containingChunk.getBlock (
            ...convertWorldToChunkBlockIndex (x, y, z)
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
        if (containingChunk === undefined)
            return BlockId.Air;
        let [cx, cy, cz] = convertWorldToChunkBlockIndex (x, y, z);
        return containingChunk.getBlockId (cx, cy, cz);
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
        if (containingChunk === undefined)
            return;
        containingChunk.setBlockId (
            ...convertWorldToChunkBlockIndex (x, y, z),
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
        if (containingChunk === undefined)
            return null;
        return containingChunk.getBlockInstanceId (
            ...convertWorldToChunkBlockIndex (x, y, z)
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
        if (containingChunk === undefined)
            return;
        return containingChunk.setBlockInstanceId (
            ...convertWorldToChunkBlockIndex (x, y, z),
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
            ...convertWorldToChunkBlockIndex (x, y, z)
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

/**
 * Converts the given world coordinates to the cooresponding block index
 * Example: position(17.5, 32.453, 20.3444) is block(17, 32, 20)
 * @param {*} worldX
 * @param {*} worldY
 * @param {*} worldZ
 * @returns
 */
export function convertWorldPosToBlockIndex (worldX, worldY, worldZ)
{
    let blockWidth = 1;
    let blockIndexX = Math.floor (worldX / blockWidth);
    let blockIndexY = Math.floor (worldY / blockWidth);
    let blockIndexZ = Math.floor (worldZ / blockWidth);
    return [blockIndexX, blockIndexY, blockIndexZ];
}

//========================================================================

// converts the given world coordinates to the containing chunk's
// chunk index
// Example: position(17, 32, 20) is in chunk(1, 0, 1)
// Chunks span the full height of the world so the Y value
// does not mean anything
export function convertWorldPosToChunkIndex (worldX, worldY, worldZ)
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
export function blockToChunkBlockIndex (x, y, z)
{
    let chunkBlockX = x < 0 ? (x + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : x % CHUNK_SIZE;
    let chunkBlockY = y < 0 ? (y + 1) % WORLD_HEIGHT + (WORLD_HEIGHT - 1) : y % WORLD_HEIGHT;
    let chunkBlockZ = z < 0 ? (z + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : z % CHUNK_SIZE;
    return [chunkBlockX, chunkBlockY, chunkBlockZ];
}

//========================================================================

/**
 * Converts the given world position to the containing chunk block index
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
export function convertWorldToChunkBlockIndex (x, y, z)
{
    return [...blockToChunkBlockIndex (...convertWorldPosToBlockIndex (x, y, z))];
}
