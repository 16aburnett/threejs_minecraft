// Minecraft clone made with THREE.js
// By Amy Burnett
// September 19, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { RNG } from './rng.js';
import { BlockId, blockData } from './blockData.js'
import { Chunk, WORLD_HEIGHT, CHUNK_SIZE } from './chunk.js'

// =======================================================================
// Global variables

const blockTextureAtlas = new THREE.TextureLoader ()
    .load ("assets/block_texture_atlas.png");
blockTextureAtlas.wrapS = THREE.RepeatWrapping;
blockTextureAtlas.wrapT = THREE.RepeatWrapping;
// Using nearest filter for crisp, non-blurry textures
blockTextureAtlas.magFilter = THREE.NearestFilter;
// We need to set this, otherwise the textures look washed out
blockTextureAtlas.colorSpace = THREE.SRGBColorSpace;
// blockTextureAtlas.repeat.set (0.5, 0.5);
let faceGeometry  = new THREE.PlaneGeometry (1, 1, 1);
// Adjust Plane UVs to represent the size of a texture
// We will pass texture offsets to the shader to pick which texture to use
// V component seems weird, might be subtractive?
// so V starts at 1.0 to 0.95 for the top row of textures
faceGeometry.attributes.uv.array[0] = 0.00;
faceGeometry.attributes.uv.array[1] = 1.00;
faceGeometry.attributes.uv.array[2] = 0.10;
faceGeometry.attributes.uv.array[3] = 1.00;
faceGeometry.attributes.uv.array[4] = 0.00;
faceGeometry.attributes.uv.array[5] = 0.95;
faceGeometry.attributes.uv.array[6] = 0.10;
faceGeometry.attributes.uv.array[7] = 0.95;
// let faceGeometry  = new THREE.BufferGeometry ();
// let blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff});
// blockMaterial.side = THREE.DoubleSide; // for Debug, disable backface culling
let blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff, map: blockTextureAtlas});
blockMaterial.onBeforeCompile = function (shader)
{
    shader.vertexShader=shader.vertexShader.replace (
      "void main() {",
  
      "attribute vec2 myOffset;\n"+
      "void main() {"
    );
  
    shader.vertexShader=shader.vertexShader.replace (
      "#include <uv_vertex>",
  
      "#include <uv_vertex>\n"+
      "vMapUv = vMapUv+myOffset;"
    );
  
    // document.body.innerText=shader.fragmentShader;
    // document.body.innerText=shader.vertexShader;
}

// =======================================================================

export default class World extends THREE.Group
{
    constructor ()
    {
        super ();
        this.size = WORLD_HEIGHT;
        // stores block information
        // Ex: {id, instanceId}
        // indexed by block position
        // this.data = [];
        // Terrain generation
        this.seed = 0;
        this.noiseScale = 0.03;
        this.noiseOffsetx = 0.5;
        this.noiseOffsetz = 0.5;
        this.seaLevel = Math.round (this.size / 2);

        // quick access map of the currently loaded chunks.
        // this enables quick lookup using the chunk (x,z) indices
        this.loadedChunks = new Map ();
        this.loadedChunks.set (`0,0`  , new Chunk ( 0, 0));
        this.loadedChunks.set (`-1,0` , new Chunk (-1, 0));
        this.loadedChunks.set (`0,-1` , new Chunk ( 0,-1));
        this.loadedChunks.set (`-1,-1`, new Chunk (-1,-1));

        this.loadedChunks.set (`0,1` , new Chunk ( 0, 1));
        this.loadedChunks.set (`1,0` , new Chunk ( 1, 0));
        this.loadedChunks.set (`1,1` , new Chunk ( 1, 1));
        this.loadedChunks.set (`-1,1`, new Chunk (-1, 1));
        this.loadedChunks.set (`1,-1`, new Chunk ( 1,-1));

        // keep track of modified chunk stacks that are outside the render distance
        // if a chunk is needed again, we can fetch the data here,
        // otherwise, we'll need to generate the terrain
        // Note: idealy, we should save this to a file to save RAM,
        // but unfortunately, we cannot save to files via javascript without
        // the user needing to approve a prompt for downloading the file.
        this.unloadedChunks = new Map ();
    }

    // ===================================================================

    generate ()
    {
        // clear previous chunks from the world's Mesh
        this.clear ();
        // Add each chunk mesh to the world
        for (let [key, chunk] of this.loadedChunks)
        {
            chunk.initialize ();
            this.generateTerrainForChunk (chunk.chunkPosX, chunk.chunkPosZ);
            chunk.generateMeshes ();
            this.add (chunk);
            console.log (chunk);
        }
        console.log (this);
    }

    // ===================================================================

    generateTerrainForChunk (worldX, worldZ)
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
                // let surfaceHeightRangeLow = this.seaLevel - 5;
                // let surfaceHeightRangeHight = this.seaLevel + 5;
                let surfaceHeightRangeLow = 0;
                let surfaceHeightRangeHight = this.size;
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
        return containingChunk.getBlockId (
            ...blockToChunkBlockIndex (x, y, z)
        );
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
        // return 0 <= x && x < this.size &&
        //        0 <= y && y < this.size &&
        //        0 <= z && z < this.size;
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


function blockToChunkBlockIndex (x, y, z)
{
    let chunkBlockX = x < 0 ? (x + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : x % CHUNK_SIZE;
    let chunkBlockY = y < 0 ? (y + 1) % WORLD_HEIGHT + (WORLD_HEIGHT - 1) : y % WORLD_HEIGHT;
    let chunkBlockZ = z < 0 ? (z + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : z % CHUNK_SIZE;
    return [chunkBlockX, chunkBlockY, chunkBlockZ];
}
