// THREE.js Minecraft - Terrain Generation
// This handles generating the terrain for the world
// By Amy Burnett
// =======================================================================
// Importing

import { RNG } from './rng.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { WORLD_HEIGHT, CHUNK_SIZE } from './chunk.js'
import { BlockId, blockData, resourceBlockIds } from './blockData.js'

// =======================================================================
// Global variables


// =======================================================================

export class TerrainGenerator
{
    constructor (world)
    {
        this.world = world;

        this.seed = 0;
        this.noiseScale = 0.03;
        this.noiseOffsetx = 0.5;
        this.noiseOffsetz = 0.5;
        this.seaLevel = Math.round (WORLD_HEIGHT / 2);
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
                    this.world.setBlockId (x, surfaceHeight, z, BlockId.Grass);
                }
                else
                {
                    // block is below sealevel so make it sand
                    this.world.setBlockId (x, surfaceHeight, z, BlockId.Sand);
                }

                // Then going down from surface
                // place 3 blocks of dirt
                let numDirt = 3;
                for (let d = 1; d <= numDirt; ++d)
                {
                    // Ensure we are still in bounds
                    if (!this.world.isInBounds (x, surfaceHeight-d, z))
                        break;
                    if (surfaceHeight-d < 0)
                        break;
                    // Place dirt block
                    this.world.setBlockId (x, surfaceHeight-d, z, BlockId.Dirt);
                }
                // Then going down further until the bottom of the map
                // Place stone blocks
                let y = surfaceHeight-numDirt-1;
                let bottomHeight = 0;
                while (y >= bottomHeight)
                {
                    // Place stone
                    this.world.setBlockId (x, y, z, BlockId.Stone);
                    // Move to block below
                    --y;
                }

                // Place water on top
                // if surface was below sea level
                y = surfaceHeight+1;
                while (y <= this.seaLevel)
                {
                    this.world.setBlockId (x, y, z, BlockId.Water);
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
                        if (this.world.getBlockId (x, y, z) != BlockId.Stone)
                            continue;
                        this.world.setBlockId (x, y, z, resourceBlockId);
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
                let blockId = this.world.getBlockId (blockX, blockY, blockZ);
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
            this.world.setBlockId (blockX, blockY+1, blockZ, BlockId.Log);
            this.world.setBlockId (blockX, blockY+2, blockZ, BlockId.Log);
            this.world.setBlockId (blockX, blockY+3, blockZ, BlockId.Log);
            this.world.setBlockId (blockX, blockY+4, blockZ, BlockId.Log);
            this.world.setBlockId (blockX, blockY+5, blockZ, BlockId.Log);
            // place top layer of leaves
            this.world.setBlockId (blockX  , blockY+6, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+6, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+6, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+6, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+6, blockZ  , BlockId.Leaves);
            // place next layer of leaves
            this.world.setBlockId (blockX  , blockY+5, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+5, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+5, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+5, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+5, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+5, blockZ  , BlockId.Leaves);
            // place next layer of leaves
            this.world.setBlockId (blockX-2, blockY+4, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX-2, blockY+4, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX-2, blockY+4, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX-2, blockY+4, blockZ+2, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+4, blockZ-2, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+4, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+4, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+4, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+4, blockZ+2, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+4, blockZ-2, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+4, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+4, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+4, blockZ+2, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+4, blockZ-2, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+4, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+4, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+4, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+4, blockZ+2, BlockId.Leaves);
            this.world.setBlockId (blockX+2, blockY+4, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX+2, blockY+4, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX+2, blockY+4, blockZ+1, BlockId.Leaves);
            // place next layer of leaves
            this.world.setBlockId (blockX-2, blockY+3, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX-2, blockY+3, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX-2, blockY+3, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+3, blockZ-2, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+3, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+3, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+3, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX-1, blockY+3, blockZ+2, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+3, blockZ-2, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+3, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+3, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX  , blockY+3, blockZ+2, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+3, blockZ-2, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+3, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+3, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+3, blockZ+1, BlockId.Leaves);
            this.world.setBlockId (blockX+1, blockY+3, blockZ+2, BlockId.Leaves);
            this.world.setBlockId (blockX+2, blockY+3, blockZ-2, BlockId.Leaves);
            this.world.setBlockId (blockX+2, blockY+3, blockZ-1, BlockId.Leaves);
            this.world.setBlockId (blockX+2, blockY+3, blockZ  , BlockId.Leaves);
            this.world.setBlockId (blockX+2, blockY+3, blockZ+1, BlockId.Leaves);

        }
    }
}