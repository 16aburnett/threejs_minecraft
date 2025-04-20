// Minecraft clone made with THREE.js
// Static data for defining different biomes
// By Amy Burnett
// =======================================================================
// Importing

import { BiomeId, Elevation } from "./biomeId.js";
import { BlockId } from "./blockId.js";
import { generateAcaciaTree, generateCactus, generateJungleTree, generateOakTree, generatePineTree } from "./featureGeneration.js";

// =======================================================================

// Note: order must match enum order
export const biomeStaticData = [
    // Elevation: Ocean
    {
        biome: BiomeId.ColdOcean,
        elevation: Elevation.Ocean,
        precipitationLow:    0,
        precipitationHigh: 500,
        temperatureLow: -15,
        temperatureHigh:  0,
        surfaceBlock: BlockId.Sand,
        treeGenerator: null,
        treeDensity: 0.0
    },
    {
        biome: BiomeId.Ocean,
        elevation: Elevation.Ocean,
        precipitationLow:    0,
        precipitationHigh: 500,
        temperatureLow:   0,
        temperatureHigh:  15,
        surfaceBlock: BlockId.Sand,
        treeGenerator: null,
        treeDensity: 0.0
    },
    {
        biome: BiomeId.WarmOcean,
        elevation: Elevation.Ocean,
        precipitationLow:    0,
        precipitationHigh: 500,
        temperatureLow:  15,
        temperatureHigh: 30,
        surfaceBlock: BlockId.Sand,
        treeGenerator: null,
        treeDensity: 0.0
    },
    // Elevation: Beach
    {
        biome: BiomeId.ColdBeach,
        elevation: Elevation.Beach,
        precipitationLow:    0,
        precipitationHigh: 500,
        temperatureLow: -15,
        temperatureHigh:  0,
        surfaceBlock: BlockId.Sand,
        treeGenerator: null,
        treeDensity: 0.0
    },
    {
        biome: BiomeId.Beach,
        elevation: Elevation.Beach,
        precipitationLow:    0,
        precipitationHigh: 500,
        temperatureLow:   0,
        temperatureHigh:  15,
        surfaceBlock: BlockId.Sand,
        treeGenerator: null,
        treeDensity: 0.0
        
    },
    {
        biome: BiomeId.WarmBeach,
        elevation: Elevation.Beach,
        precipitationLow:    0,
        precipitationHigh: 500,
        temperatureLow:  15,
        temperatureHigh: 30,
        surfaceBlock: BlockId.Sand,
        treeGenerator: null,
        treeDensity: 0.0
    },
    // Elevation: Land
    {
        biome: BiomeId.Tundra,
        elevation: Elevation.Land,
        precipitationLow:    0,
        precipitationHigh: 500,
        temperatureLow: -15,
        temperatureHigh: -5,
        surfaceBlock: BlockId.ColdGrass,
        treeGenerator: null,
        treeDensity: 0.0
    },
    {
        biome: BiomeId.Taiga,
        elevation: Elevation.Land,
        precipitationLow:   50,
        precipitationHigh: 500,
        temperatureLow:  -5,
        temperatureHigh:  0,
        surfaceBlock: BlockId.ColdGrass,
        treeGenerator: generatePineTree,
        treeDensity: 0.01
    },
    {
        biome: BiomeId.Desert,
        elevation: Elevation.Land,
        precipitationLow:    0,
        precipitationHigh:  50,
        temperatureLow:  -5,
        temperatureHigh: 30,
        surfaceBlock: BlockId.Sand,
        treeGenerator: generateCactus,
        treeDensity: 0.0025
    },
    {
        biome: BiomeId.Grassland,
        elevation: Elevation.Land,
        precipitationLow:   50,
        precipitationHigh: 150,
        temperatureLow:   0,
        temperatureHigh: 15,
        surfaceBlock: BlockId.Grass,
        treeGenerator: generateOakTree,
        treeDensity: 0.0001
    },
    {
        biome: BiomeId.Savanna,
        elevation: Elevation.Land,
        precipitationLow:   50,
        precipitationHigh: 150,
        temperatureLow:  15,
        temperatureHigh: 30,
        surfaceBlock: BlockId.AridGrass,
        treeGenerator: generateAcaciaTree,
        treeDensity: 0.0005
    },
    {
        biome: BiomeId.TemperateForest,
        elevation: Elevation.Land,
        precipitationLow:  150,
        precipitationHigh: 500,
        temperatureLow:   0,
        temperatureHigh: 15,
        surfaceBlock: BlockId.Grass,
        treeGenerator: generateOakTree,
        treeDensity: 0.009
    },
    {
        biome: BiomeId.TropicalForest,
        elevation: Elevation.Land,
        precipitationLow:  150,
        precipitationHigh: 250,
        temperatureLow:  15,
        temperatureHigh: 30,
        surfaceBlock: BlockId.TropicalGrass,
        treeGenerator: generateOakTree,
        treeDensity: 0.02
    },
    {
        biome: BiomeId.Rainforest,
        elevation: Elevation.Land,
        precipitationLow:  250,
        precipitationHigh: 500,
        temperatureLow:  15,
        temperatureHigh: 30,
        surfaceBlock: BlockId.TropicalGrass,
        treeGenerator: generateJungleTree,
        treeDensity: 0.01
    },

];
