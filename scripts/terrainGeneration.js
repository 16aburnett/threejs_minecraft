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

export const Elevation = {
    Ocean: 0,
    Beach: 1,
    Land:  2
};

export const Biome = {
    // Ocean
    ColdOcean:        0,
    Ocean:            1,
    WarmOcean:        2,
    // Beach
    ColdBeach:        3,
    Beach:            4,
    WarmBeach:        5,
    // Land
    Tundra:           6,
    Taiga:            7,
    Desert:           8,
    Grassland:        9,
    Savanna:         10,
    TemperateForest: 11,
    TropicalForest:  12,
    Rainforest:      13,
};

// =======================================================================

export class TerrainGenerator
{
    constructor (world)
    {
        this.world = world;
        this.seed = 0;

        // Elevation
        this.noiseScale = 0.003;
        this.elevationRoughnessNoiseScale = this.noiseScale * 10;
        this.elevationRoughnessFactor = 0.2;
        this.noiseOffsetx = 0.5;
        this.noiseOffsetz = 0.5;
        this.seaLevel = Math.round (WORLD_HEIGHT / 2);
        const elevationRNG = new RNG (this.seed);
        this.elevationSimplexNoise = new SimplexNoise (elevationRNG);

        // Temperature
        this.temperatureNoiseScale = 0.0005;
        this.temperatureRoughnessNoiseScale = this.temperatureNoiseScale * 10;
        this.temperatureRoughnessFactor = 0.2;
        // Using a different seed so this noise differs from others
        // Still based on the main seed so terrain will be reproducable
        const temperatureRNG = new RNG (this.seed+1234);
        this.temperatureSimplexNoise = new SimplexNoise (temperatureRNG);
        
        // Precipitation
        this.precipitationNoiseScale = 0.0005;
        this.precipitationRoughnessNoiseScale = this.precipitationNoiseScale * 10;
        this.precipitationRoughnessFactor = 0.2;
        // Using a different seed so this noise differs from others
        // Still based on the main seed so terrain will be reproducable
        const precipitationRNG = new RNG (this.seed+4321);
        this.precipitationSimplexNoise = new SimplexNoise (precipitationRNG);
        
        // Biomes
        this.biomeSettings = [];
        // Elevation: Ocean
        this.biomeSettings.push ({
            biome: Biome.ColdOcean,
            elevation: Elevation.Ocean,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow: -15,
            temperatureHigh:  0,
            surfaceBlock: BlockId.Sand
        });
        this.biomeSettings.push ({
            biome: Biome.Ocean,
            elevation: Elevation.Ocean,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:   0,
            temperatureHigh:  15,
            surfaceBlock: BlockId.Sand
        });
        this.biomeSettings.push ({
            biome: Biome.WarmOcean,
            elevation: Elevation.Ocean,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Sand
        });
        // Elevation: Beach
        this.biomeSettings.push ({
            biome: Biome.ColdBeach,
            elevation: Elevation.Beach,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow: -15,
            temperatureHigh:  0,
            surfaceBlock: BlockId.Sand
        });
        this.biomeSettings.push ({
            biome: Biome.Beach,
            elevation: Elevation.Beach,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:   0,
            temperatureHigh:  15,
            surfaceBlock: BlockId.Sand
            
        });
        this.biomeSettings.push ({
            biome: Biome.WarmBeach,
            elevation: Elevation.Beach,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Sand
        });
        // Elevation: Land
        this.biomeSettings.push ({
            biome: Biome.Tundra,
            elevation: Elevation.Land,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow: -15,
            temperatureHigh: -5,
            surfaceBlock: BlockId.Grass
            // surfaceBlock: BlockId.CoalOre
        });
        this.biomeSettings.push ({
            biome: Biome.Taiga,
            elevation: Elevation.Land,
            precipitationLow:   50,
            precipitationHigh: 500,
            temperatureLow:  -5,
            temperatureHigh:  0,
            surfaceBlock: BlockId.Grass
            // surfaceBlock: BlockId.DiamondOre
        });
        this.biomeSettings.push ({
            biome: Biome.Desert,
            elevation: Elevation.Land,
            precipitationLow:    0,
            precipitationHigh:  50,
            temperatureLow:  -5,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Sand
            // surfaceBlock: BlockId.Dirt
        });
        this.biomeSettings.push ({
            biome: Biome.Grassland,
            elevation: Elevation.Land,
            precipitationLow:   50,
            precipitationHigh: 150,
            temperatureLow:   0,
            temperatureHigh: 15,
            surfaceBlock: BlockId.Grass
            // surfaceBlock: BlockId.Grass
        });
        this.biomeSettings.push ({
            biome: Biome.Savanna,
            elevation: Elevation.Land,
            precipitationLow:   50,
            precipitationHigh: 150,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Grass
            // surfaceBlock: BlockId.GoldOre
        });
        this.biomeSettings.push ({
            biome: Biome.TemperateForest,
            elevation: Elevation.Land,
            precipitationLow:  150,
            precipitationHigh: 500,
            temperatureLow:   0,
            temperatureHigh: 15,
            surfaceBlock: BlockId.Grass
            // surfaceBlock: BlockId.IronOre
        });
        this.biomeSettings.push ({
            biome: Biome.TropicalForest,
            elevation: Elevation.Land,
            precipitationLow:  150,
            precipitationHigh: 250,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Grass
            // surfaceBlock: BlockId.Leaves
        });
        this.biomeSettings.push ({
            biome: Biome.Rainforest,
            elevation: Elevation.Land,
            precipitationLow:  250,
            precipitationHigh: 500,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Grass
            // surfaceBlock: BlockId.Log
        });

    }
    
    // ===================================================================

    generateTerrainForChunk (worldX, worldZ)
    {
        this.generateBaseTerrainForChunk (worldX, worldZ);
        this.generateResourcesForChunk (worldX, worldZ);
        // this.generateRandomTreesForChunk (worldX, worldZ);
    }

    // ===================================================================

    // Generates the main blocks for the chunk
    // - Dirt, grass, stone
    generateBaseTerrainForChunk (worldX, worldZ)
    {
        for (let x = worldX; x < worldX + CHUNK_SIZE; ++x)
        {
            for (let z = worldZ; z < worldZ + CHUNK_SIZE; ++z)
            {
                const elevation = this.getElevation (x, z);
                const surfaceHeight = elevation;

                // Place surface block
                const biome = this.getBiome (x, z, surfaceHeight);
                const surfaceBlock = this.biomeSettings[biome].surfaceBlock;
                this.world.setBlockId (x, surfaceHeight, z, surfaceBlock);
                // this.world.setBlockId (x, this.seaLevel+1, z, surfaceBlock);

                // continue;
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

    getElevation (worldX, worldZ)
    {
        // Base layer of noise
        let noiseRangeLow = -1 + this.elevationRoughnessFactor * -1;
        let noiseRangeHigh = 1 + this.elevationRoughnessFactor * 1;
        let noiseRange = noiseRangeHigh - noiseRangeLow;
        let noiseValue = this.elevationSimplexNoise.noise (
            this.noiseOffsetx + this.noiseScale * worldX,
            this.noiseOffsetz + this.noiseScale * worldZ
        );
        // Add second layer of noise for more local variation
        const roughness = this.elevationSimplexNoise.noise (
            this.elevationRoughnessNoiseScale * worldX,
            this.elevationRoughnessNoiseScale * worldZ
        );
        noiseValue += this.elevationRoughnessFactor * roughness;
        // convert noise value to surface height
        let maxDepthBelowSeaLevel = 20;
        let maxLandAboveSeaLevel = 20;
        let surfaceHeightRangeLow = this.seaLevel - maxDepthBelowSeaLevel;
        let surfaceHeightRangeHight = this.seaLevel + maxLandAboveSeaLevel;
        let surfaceHeightRange = surfaceHeightRangeHight - surfaceHeightRangeLow;
        let surfaceHeight = Math.floor (
            (((noiseValue - noiseRangeLow) * surfaceHeightRange)
            / noiseRange) + surfaceHeightRangeLow
        );

        return surfaceHeight;
    }

    // ===================================================================

    getBiome (worldX, worldZ, surfaceHeight)
    {
        let elevation = Elevation.Ocean;
        if (surfaceHeight < this.seaLevel)
            elevation = Elevation.Ocean;
        else if (surfaceHeight < this.seaLevel + 2)
            elevation = Elevation.Beach;
        else
            elevation = Elevation.Land;

        const temperature = this.getTemperature (worldX, worldZ);
        const precipitation = this.getPrecipitation (worldX, worldZ);

        // Find the biome that matches
        for (let biomeSettings of this.biomeSettings)
        {
            // Ensure elevation matches
            if (elevation != biomeSettings.elevation)
                continue;
            // Ensure temperature matches
            if (biomeSettings.temperatureLow > temperature
                || temperature >= biomeSettings.temperatureHigh)
                continue;
            // Ensure precipitation matches
            if (biomeSettings.precipitationLow > precipitation
                || precipitation >= biomeSettings.precipitationHigh)
                continue;
            // Biome matches!
            return biomeSettings.biome;
        }
        // Reaches here if no biome found
        console.error (`Cannot find biome with temperature ${temperature} and precipitation ${precipitation}`);
        
    }

    // ===================================================================

    getTemperature (worldX, worldZ)
    {
        // Base layer of noise
        let noiseRangeLow = -1 + this.temperatureRoughnessFactor * -1;
        let noiseRangeHigh = 1 + this.temperatureRoughnessFactor * 1;
        let noiseRange = noiseRangeHigh - noiseRangeLow;
        let noiseValue = this.temperatureSimplexNoise.noise (
            this.temperatureNoiseScale * worldX, 
            this.temperatureNoiseScale * worldZ
        );
        // Add second layer of noise for more local variation
        const roughness = this.temperatureSimplexNoise.noise (
            this.temperatureRoughnessNoiseScale * worldX,
            this.temperatureRoughnessNoiseScale * worldZ
        );
        noiseValue += this.temperatureRoughnessFactor * roughness;
        // convert noise value to Temperature range (Celcius)
        let tempRangeLow = -15;
        let tempRangeHight = 30;
        let tempRange = tempRangeHight - tempRangeLow;
        let temperature = Math.floor (
            (((noiseValue - noiseRangeLow) * tempRange)
            / noiseRange) + tempRangeLow
        );
        return temperature;
    }

    // ===================================================================

    getPrecipitation (worldX, worldZ)
    {
        // Base layer of noise
        let noiseRangeLow = -1 + this.precipitationRoughnessFactor * -1;
        let noiseRangeHigh = 1 + this.precipitationRoughnessFactor * 1;
        let noiseRange = noiseRangeHigh - noiseRangeLow;
        let noiseValue = this.precipitationSimplexNoise.noise (
            this.precipitationNoiseScale * worldX, 
            this.precipitationNoiseScale * worldZ
        );
        // Add second layer of noise for more local variation
        const roughness = this.precipitationSimplexNoise.noise (
            this.precipitationRoughnessNoiseScale * worldX,
            this.precipitationRoughnessNoiseScale * worldZ
        );
        noiseValue += this.precipitationRoughnessFactor * roughness;
        // convert noise value to Precipitation range (cm)
        let precipRangeLow = 0;
        let precipRangeHight = 500;
        let precipRange = precipRangeHight - precipRangeLow;
        let precipitation = Math.floor (
            (((noiseValue - noiseRangeLow) * precipRange)
            / noiseRange) + precipRangeLow
        );
        return precipitation;
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