// THREE.js Minecraft - Terrain Generation
// This handles generating the terrain for the world
// By Amy Burnett
// =======================================================================
// Importing

import { RNG } from './rng.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { WORLD_HEIGHT, CHUNK_SIZE } from './chunk.js'
import { BlockId } from "./blockId.js";
import { blockData, resourceBlockIds } from './blockData.js'
import { convertWorldPosToChunkIndex } from './world.js';
import { biomeStaticData } from './biomeData.js';
import { Elevation } from './biomeId.js';

// =======================================================================
// Global variables

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
    }
    
    // ===================================================================

    generateTerrainForChunk (worldX, worldZ)
    {
        this.generateBaseTerrainForChunk (worldX, worldZ);
        this.generateResourcesForChunk (worldX, worldZ);
        this.generateTreesForChunk (worldX, worldZ);
        this.applySavedDataForChunk (worldX, worldZ);
        this.reloadSavedEntitiesForChunk (worldX, worldZ);
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
                const surfaceBlock = biomeStaticData[biome].surfaceBlock;
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
        for (let biomeSettings of biomeStaticData)
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
                const treeDensity = biomeStaticData[biome].treeDensity;
                
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
                    if (blockId == biomeStaticData[biome].surfaceBlock)
                        break;
                }
                // Ensure that we found the surface
                if (y >= WORLD_HEIGHT)
                    // no surface so just dont place a tree here
                    continue;
                const surfaceHeight = y;

                // Spawn tree
                const treeGenerator = biomeStaticData[biome].treeGenerator;
                if (treeGenerator)
                    treeGenerator (this.world, x, surfaceHeight+1, z, vegetationRNG);

            }
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

    // ===================================================================

    reloadSavedEntitiesForChunk (worldX, worldZ)
    {
        const [
            chunkIndexX,
            chunkIndexY,
            chunkIndexZ
        ] = convertWorldPosToChunkIndex (worldX, 0, worldZ);
        const entities = this.world.dataStore.getEntities (chunkIndexX, chunkIndexZ);
        // Ensure there were entities to reload
        if (entities === undefined)
            return;
        console.log (`Reloading ${entities.length} entities for chunk '${chunkIndexX},${chunkIndexZ}'`);
        for (const entity of entities)
        {
            this.world.addEntity (entity);
        }
    }

}
