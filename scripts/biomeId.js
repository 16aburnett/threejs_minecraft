// Minecraft clone made with THREE.js
// Biome Ids
// Note that this is separate from biomeData to avoid circular imports
// By Amy Burnett
// =======================================================================

export const Elevation = {
    Ocean: 0,
    Beach: 1,
    Land:  2
};

// Ids for different biomes
export const BiomeId = {
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

export const BiomeStrings = Object.keys (BiomeId);
