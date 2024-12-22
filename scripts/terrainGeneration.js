// THREE.js Minecraft - Terrain Generation
// This handles generating the terrain for the world
// By Amy Burnett
// =======================================================================
// Importing

import { RNG } from './rng.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { WORLD_HEIGHT, CHUNK_SIZE } from './chunk.js'
import { BlockId, blockData, resourceBlockIds } from './blockData.js'
import { convertWorldPosToChunkIndex } from './world.js';
import { distanceSquared, lerp } from './utils.js';

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

const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;

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
        const temperatureRNG = new RNG (this.seed + 1234);
        this.temperatureSimplexNoise = new SimplexNoise (temperatureRNG);
        
        // Precipitation
        this.precipitationNoiseScale = 0.0005;
        this.precipitationRoughnessNoiseScale = this.precipitationNoiseScale * 10;
        this.precipitationRoughnessFactor = 0.2;
        // Using a different seed so this noise differs from others
        // Still based on the main seed so terrain will be reproducable
        const precipitationRNG = new RNG (this.seed + 4321);
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
            surfaceBlock: BlockId.Sand,
            treeGenerator: null,
            treeDensity: 0.0
        });
        this.biomeSettings.push ({
            biome: Biome.Ocean,
            elevation: Elevation.Ocean,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:   0,
            temperatureHigh:  15,
            surfaceBlock: BlockId.Sand,
            treeGenerator: null,
            treeDensity: 0.0
        });
        this.biomeSettings.push ({
            biome: Biome.WarmOcean,
            elevation: Elevation.Ocean,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Sand,
            treeGenerator: null,
            treeDensity: 0.0
        });
        // Elevation: Beach
        this.biomeSettings.push ({
            biome: Biome.ColdBeach,
            elevation: Elevation.Beach,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow: -15,
            temperatureHigh:  0,
            surfaceBlock: BlockId.Sand,
            treeGenerator: null,
            treeDensity: 0.0
        });
        this.biomeSettings.push ({
            biome: Biome.Beach,
            elevation: Elevation.Beach,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:   0,
            temperatureHigh:  15,
            surfaceBlock: BlockId.Sand,
            treeGenerator: null,
            treeDensity: 0.0
            
        });
        this.biomeSettings.push ({
            biome: Biome.WarmBeach,
            elevation: Elevation.Beach,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Sand,
            treeGenerator: null,
            treeDensity: 0.0
        });
        // Elevation: Land
        this.biomeSettings.push ({
            biome: Biome.Tundra,
            elevation: Elevation.Land,
            precipitationLow:    0,
            precipitationHigh: 500,
            temperatureLow: -15,
            temperatureHigh: -5,
            surfaceBlock: BlockId.ColdGrass,
            treeGenerator: null,
            treeDensity: 0.0
        });
        this.biomeSettings.push ({
            biome: Biome.Taiga,
            elevation: Elevation.Land,
            precipitationLow:   50,
            precipitationHigh: 500,
            temperatureLow:  -5,
            temperatureHigh:  0,
            surfaceBlock: BlockId.ColdGrass,
            treeGenerator: this.generatePineTree.bind (this),
            treeDensity: 0.01
        });
        this.biomeSettings.push ({
            biome: Biome.Desert,
            elevation: Elevation.Land,
            precipitationLow:    0,
            precipitationHigh:  50,
            temperatureLow:  -5,
            temperatureHigh: 30,
            surfaceBlock: BlockId.Sand,
            treeGenerator: this.generateCactus.bind (this),
            treeDensity: 0.0025
        });
        this.biomeSettings.push ({
            biome: Biome.Grassland,
            elevation: Elevation.Land,
            precipitationLow:   50,
            precipitationHigh: 150,
            temperatureLow:   0,
            temperatureHigh: 15,
            surfaceBlock: BlockId.Grass,
            treeGenerator: this.generateOakTree.bind (this),
            treeDensity: 0.0001
        });
        this.biomeSettings.push ({
            biome: Biome.Savanna,
            elevation: Elevation.Land,
            precipitationLow:   50,
            precipitationHigh: 150,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.AridGrass,
            treeGenerator: this.generateAcaciaTree.bind (this),
            treeDensity: 0.0005
        });
        this.biomeSettings.push ({
            biome: Biome.TemperateForest,
            elevation: Elevation.Land,
            precipitationLow:  150,
            precipitationHigh: 500,
            temperatureLow:   0,
            temperatureHigh: 15,
            surfaceBlock: BlockId.Grass,
            treeGenerator: this.generateOakTree.bind (this),
            treeDensity: 0.009
        });
        this.biomeSettings.push ({
            biome: Biome.TropicalForest,
            elevation: Elevation.Land,
            precipitationLow:  150,
            precipitationHigh: 250,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.TropicalGrass,
            treeGenerator: this.generateOakTree.bind (this),
            treeDensity: 0.02
        });
        this.biomeSettings.push ({
            biome: Biome.Rainforest,
            elevation: Elevation.Land,
            precipitationLow:  250,
            precipitationHigh: 500,
            temperatureLow:  15,
            temperatureHigh: 30,
            surfaceBlock: BlockId.TropicalGrass,
            treeGenerator: this.generateJungleTree.bind (this),
            treeDensity: 0.01
        });

    }
    
    // ===================================================================

    generateTerrainForChunk (worldX, worldZ)
    {
        this.generateBaseTerrainForChunk (worldX, worldZ);
        this.generateResourcesForChunk (worldX, worldZ);
        this.generateTreesForChunk (worldX, worldZ);
        this.applySavedDataForChunk (worldX, worldZ);
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
                const biome = this.getBiome (x, z);
                const surfaceBlock = this.biomeSettings[biome].surfaceBlock;
                this.world.setBlockId (x, surfaceHeight, z, surfaceBlock);

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

    getBiome (worldX, worldZ)
    {
        const surfaceHeight = this.getElevation (worldX, worldZ);
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

    generateTreesForChunk (worldX, worldZ)
    {
        // RNG is created here instead of the constructor so that
        // vegetation is exactly the same every time the same chunk
        // is generated.
        // Applying the chunk coords to the seed will create
        // variety between chunks.
        // There will be some repetition but it shouldnt be as noticeable
        // due to the "* 10"
        const vegetationRNG = new RNG (this.seed + worldX * 10 + worldZ);
        for (let x = worldX; x < worldX + CHUNK_SIZE; ++x)
        {
            for (let z = worldZ; z < worldZ + CHUNK_SIZE; ++z)
            {
                // Determine what biome this is so we know what tree to
                // spawn and with what frequency
                const biome = this.getBiome (x, z);
                const treeDensity = this.biomeSettings[biome].treeDensity;
                
                // Ensure that we are going to spawn a tree here
                const randomValue = vegetationRNG.random ();
                if (randomValue >= treeDensity)
                    continue;

                // Determine where the surface is so we know where to
                // spawn the tree
                // Note: this method of finding the surface is not
                // performant.
                // Also this might not be a true assumption
                let y = 0;
                for ( ; y < WORLD_HEIGHT; ++y)
                {
                    const blockId = this.world.getBlockId (x, y, z);
                    if (blockId == this.biomeSettings[biome].surfaceBlock)
                        break;
                }
                // Ensure that we found the surface
                if (y >= WORLD_HEIGHT)
                    // no surface so just dont place a tree here
                    continue;
                const surfaceHeight = y;

                // Spawn tree
                const treeGenerator
                    = this.biomeSettings[biome].treeGenerator;
                if (treeGenerator)
                    treeGenerator (x, surfaceHeight+1, z, vegetationRNG);

            }
        }

    }

    // ===================================================================

    generateOakTree (x, y, z, vegetationRNG)
    {
        // Place trunk
        const trunkHeightMin = 2;
        const trunkHeightMax = 6;
        const trunkHeight = lerp (
            trunkHeightMin,
            trunkHeightMax,
            vegetationRNG.random ()
        );
        for (let i = 0; i < trunkHeight; ++i)
        {
            this.world.setBlockId (x, y+i, z, BlockId.Log);
        }

        // Place crown
        const crownHeightMin = 3;
        const crownHeightMax = 6;
        // offsetting coords so rand number is different from above
        const crownHeight = lerp (
            crownHeightMin,
            crownHeightMax,
            vegetationRNG.random ()
        );
        const crownRadiusBottom = 3;
        const crownRadiusTop = 2;
        for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
        {
            const crownY = y + trunkHeight + crownRow;
            // Place the part of the trunk that is in the crown
            if (crownRow < crownHeight - 1)
                this.world.setBlockId (x, crownY, z, BlockId.Log);

            // Lerp between bottom and top radii while moving up the crown
            const crownHeightRatio = crownRow / crownHeight;
            const crownRadius = lerp (
                crownRadiusBottom,
                crownRadiusTop,
                crownHeightRatio
            );
            for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
            {
                for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
                {
                    // Ignore corners
                    const isCornerX = crownX == x-crownRadius+1
                        || crownX == x+crownRadius-1;
                    const isCornerZ = crownZ == z-crownRadius+1
                        || crownZ == z+crownRadius-1;
                    if (isCornerX && isCornerZ)
                        continue;
                    
                    // Ensure we are not overwritting blocks
                    const blockId = this.world.getBlockId (
                        crownX,
                        crownY,
                        crownZ
                    );
                    if (blockId != BlockId.Air)
                        continue;

                    this.world.setBlockId (
                        crownX,
                        crownY,
                        crownZ,
                        BlockId.Leaves
                    );
                }
            }
        }
    }

    // ===================================================================

    generatePineTree (x, y, z, vegetationRNG)
    {
        // Place trunk
        const trunkHeightMin = 2;
        const trunkHeightMax = 6;
        const trunkHeight = lerp (
            trunkHeightMin,
            trunkHeightMax,
            vegetationRNG.random ()
        );
        for (let i = 0; i < trunkHeight; ++i)
        {
            this.world.setBlockId (x, y+i, z, BlockId.PineLog);
        }

        // Place crown
        const crownHeightMin = 8;
        const crownHeightMax = 15;
        const crownHeight = lerp (
            crownHeightMin,
            crownHeightMax,
            vegetationRNG.random ()
        );
        const crownRadiusBottom = crownHeight / 3;
        const crownRadiusTop = 1;
        for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
        {
            const crownY = y + trunkHeight + crownRow;
            // Place the part of the trunk that is in the crown
            if (crownRow < crownHeight - 1)
                this.world.setBlockId (x, crownY, z, BlockId.PineLog);
            else
                this.world.setBlockId (x, crownY, z, BlockId.PineLeaves);

            // Lerp between bottom and top radii while moving up the crown
            const crownHeightRatio = crownRow / crownHeight;
            let crownRadius = lerp (
                crownRadiusBottom,
                crownRadiusTop,
                crownHeightRatio
            );
            // adjust so that alternating layers push in and out
            if (crownRow % 2 == 1)
                crownRadius -= 1;
            const crownRadiusSquared = crownRadius * crownRadius;
            for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
            {
                for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
                {
                    // Ignore blocks outside of radius
                    const distSquared = distanceSquared (
                        x,
                        z,
                        crownX,
                        crownZ
                    );
                    if (distSquared > crownRadiusSquared)
                        continue;
                    
                    // Ensure we are not overwritting blocks
                    const blockId = this.world.getBlockId (
                        crownX,
                        crownY,
                        crownZ
                    );
                    if (blockId != BlockId.Air)
                        continue;

                    this.world.setBlockId (
                        crownX,
                        crownY,
                        crownZ,
                        BlockId.PineLeaves
                    );
                }
            }
        }
    }

    // ===================================================================

    generateAcaciaTree (x, y, z, vegetationRNG)
    {
        // Place trunk
        const trunkHeightMin = 1;
        const trunkHeightMax = 4;
        const trunkHeight = lerp (
            trunkHeightMin,
            trunkHeightMax,
            vegetationRNG.random ()
        );
        for (let i = 0; i < trunkHeight; ++i)
        {
            this.world.setBlockId (x, y+i, z, BlockId.AcaciaLog);
        }

        const dir = lerp (0, 3, vegetationRNG.random ());
        const height1 = lerp (3, 5, vegetationRNG.random ());
        this.placeAcaciaBranch (x, y+trunkHeight, z, dir, 0, height1);
        const oppositeDir = (dir + 2) % 4;
        const height2 = lerp (1, 3, vegetationRNG.random ());
        this.placeAcaciaBranch (
            x,
            y+trunkHeight,
            z,
            oppositeDir,
            0,
            height2
        );

    }
    
    // ===================================================================

    placeAcaciaCanopy (x, y, z)
    {
        // Place crown
        const crownHeight = 2
        const crownRadiusBottom = 4;
        const crownRadiusTop = 2;
        for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
        {
            const crownY = y + crownRow;

            // Lerp between bottom and top radii while moving up the crown
            const crownHeightRatio = crownRow / crownHeight;
            const crownRadius = lerp (
                crownRadiusBottom,
                crownRadiusTop,
                crownHeightRatio
            );
            const crownRadiusSquared = crownRadius * crownRadius;
            for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
            {
                for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
                {
                    // Ignore blocks outside of radius
                    const distSquared = distanceSquared (
                        x,
                        z,
                        crownX,
                        crownZ
                    );
                    if (distSquared > crownRadiusSquared)
                        continue;
                    
                    // Ensure we are not overwritting blocks
                    const blockId = this.world.getBlockId (
                        crownX,
                        crownY,
                        crownZ
                    );
                    if (blockId != BlockId.Air)
                        continue;

                    this.world.setBlockId (
                        crownX,
                        crownY,
                        crownZ,
                        BlockId.AcaciaLeaves
                    );
                }
            }
        }
    }

    // ===================================================================

    placeAcaciaBranch (x, y, z, dir, length, limit)
    {
        if (length >= limit)
        {
            this.placeAcaciaCanopy (x, y, z);
            return;
        }
        if (dir == NORTH)
        {
            this.world.setBlockId (x, y, z, BlockId.AcaciaLog);
            this.world.setBlockId (x, y, z+1, BlockId.AcaciaLog);
            this.placeAcaciaBranch (x, y+1, z+1, dir, length+1, limit);
        }
        else if (dir == EAST)
        {
            this.world.setBlockId (x, y, z, BlockId.AcaciaLog);
            this.world.setBlockId (x+1, y, z, BlockId.AcaciaLog);
            this.placeAcaciaBranch (x+1, y+1, z, dir, length+1, limit);
        }
        else if (dir == SOUTH)
        {
            this.world.setBlockId (x, y, z, BlockId.AcaciaLog);
            this.world.setBlockId (x, y, z-1, BlockId.AcaciaLog);
            this.placeAcaciaBranch (x, y+1, z-1, dir, length+1, limit);
        }
        else if (dir == WEST)
        {
            this.world.setBlockId (x, y, z, BlockId.AcaciaLog);
            this.world.setBlockId (x-1, y, z, BlockId.AcaciaLog);
            this.placeAcaciaBranch (x-1, y+1, z, dir, length+1, limit);
        }
    }

    // ===================================================================

    generateJungleTree (x, y, z, vegetationRNG)
    {
        // Place trunk
        const trunkHeight = lerp (15, 25, vegetationRNG.random ());
        for (let i = 0; i < trunkHeight; ++i)
        {
            this.world.setBlockId (x, y+i, z, BlockId.JungleLog);
        }
        // place tree roots
        const rootOffset = lerp (0, 3, vegetationRNG.random ());
        this.placeJungleTrunkRoot (x, y+rootOffset, z, NORTH, 0, 4);
        this.placeJungleTrunkRoot (x, y+rootOffset, z, EAST , 0, 4);
        this.placeJungleTrunkRoot (x, y+rootOffset, z, SOUTH, 0, 4);
        this.placeJungleTrunkRoot (x, y+rootOffset, z, WEST , 0, 4);

        // Side branches
        const numBranches = lerp (1, 3, vegetationRNG.random ());
        for (let b = 0; b < numBranches; ++b)
        {
            const branchY = y + lerp (
                4,
                trunkHeight,
                vegetationRNG.random ()
            );
            const dir = lerp (0, 3, vegetationRNG.random ());
            const heightLimit = lerp (1, 4, vegetationRNG.random ());
            this.placeJungleBranch (x, branchY, z, dir, 0, heightLimit);
        }

        // Top branches
        const numTopBranches = lerp (0, 2, vegetationRNG.random ());
        for (let b = 0; b < numTopBranches; ++b)
        {
            const dir = lerp (0, 3, vegetationRNG.random ());
            const heightLimit = lerp (2, 5, vegetationRNG.random ());
            this.placeJungleBranch (
                x,
                y+trunkHeight,
                z,
                dir,
                0,
                heightLimit
            );
        }

        // Put a canopy topper at the top of the trunk
        this.placeJungleCanopy (x, y+trunkHeight, z);

    }

    // ===================================================================

    placeJungleTrunkRoot (x, y, z, dir, length, limit)
    {
        if (length >= limit)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            return;
        }
        if (dir == NORTH)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x, y, z+1, BlockId.JungleLog);
            this.placeJungleTrunkRoot (x, y-1, z+1, dir, length+1, limit);
        }
        else if (dir == EAST)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x+1, y, z, BlockId.JungleLog);
            this.placeJungleTrunkRoot (x+1, y-1, z, dir, length+1, limit);
        }
        else if (dir == SOUTH)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x, y, z-1, BlockId.JungleLog);
            this.placeJungleTrunkRoot (x, y-1, z-1, dir, length+1, limit);
        }
        else if (dir == WEST)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x-1, y, z, BlockId.JungleLog);
            this.placeJungleTrunkRoot (x-1, y-1, z, dir, length+1, limit);
        }
    }

    // ===================================================================

    placeJungleCanopy (x, y, z)
    {
        // Place crown
        const crownHeight = 2
        const crownRadiusBottom = 4;
        const crownRadiusTop = 2;
        for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
        {
            const crownY = y + crownRow;

            // Lerp between bottom and top radii while moving up the crown
            const crownHeightRatio = crownRow / crownHeight;
            const crownRadius = lerp (
                crownRadiusBottom,
                crownRadiusTop,
                crownHeightRatio
            );
            const crownRadiusSquared = crownRadius * crownRadius;
            for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
            {
                for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
                {
                    // Ignore blocks outside of radius
                    const distSquared = distanceSquared (
                        x,
                        z,
                        crownX,
                        crownZ
                    );
                    if (distSquared > crownRadiusSquared)
                        continue;
                    
                    // Ensure we are not overwritting blocks
                    const blockId = this.world.getBlockId (
                        crownX,
                        crownY,
                        crownZ
                    );
                    if (blockId != BlockId.Air)
                        continue;

                    // Place the block
                    this.world.setBlockId (
                        crownX,
                        crownY,
                        crownZ,
                        BlockId.JungleLeaves
                    );
                }
            }
        }
    }

    // ===================================================================

    placeJungleBranch (x, y, z, dir, length, limit)
    {
        if (length >= limit)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.placeJungleCanopy (x, y, z);
            return;
        }
        if (dir == NORTH)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x, y, z+1, BlockId.JungleLog);
            this.placeJungleBranch (x, y+1, z+1, dir, length+1, limit);
        }
        else if (dir == EAST)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x+1, y, z, BlockId.JungleLog);
            this.placeJungleBranch (x+1, y+1, z, dir, length+1, limit);
        }
        else if (dir == SOUTH)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x, y, z-1, BlockId.JungleLog);
            this.placeJungleBranch (x, y+1, z-1, dir, length+1, limit);
        }
        else if (dir == WEST)
        {
            this.world.setBlockId (x, y, z, BlockId.JungleLog);
            this.world.setBlockId (x-1, y, z, BlockId.JungleLog);
            this.placeJungleBranch (x-1, y+1, z, dir, length+1, limit);
        }
    }

    // ===================================================================

    generateCactus (x, y, z, vegetationRNG)
    {
        const cactusHeight = lerp (1, 4, vegetationRNG.random ());
        for (let yoff = 0; yoff < cactusHeight; ++yoff)
        {
            this.world.setBlockId (x, y + yoff, z, BlockId.Cactus);
        }
    }

    // ===================================================================

    applySavedDataForChunk (worldX, worldZ)
    {
        const [
            chunkIndexX,
            chunkIndexY,
            chunkIndexZ
        ] = convertWorldPosToChunkIndex (worldX, 0, worldZ);
        const changes = this.world.dataStore.getAllChangesForChunk (
            chunkIndexX,
            chunkIndexZ
        );
        // Ensure there were changes
        if (changes === undefined)
            return;
        // Apply each change
        for (const [key, blockId] of changes.entries ())
        {
            // Parse block position
            const tokens = key.split (",");
            const chunkBlockX = parseInt (tokens[0]);
            const chunkBlockY = parseInt (tokens[1]);
            const chunkBlockZ = parseInt (tokens[2]);
            // Apply change
            this.world.setBlockId (
                CHUNK_SIZE * chunkIndexX + chunkBlockX,
                chunkBlockY,
                CHUNK_SIZE * chunkIndexZ + chunkBlockZ,
                blockId
            );
        }
    }


}
