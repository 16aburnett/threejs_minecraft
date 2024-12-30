// Minecraft clone made with THREE.js
// Block Ids
// Note that this is separate from blockData to avoid circular imports
// By Amy Burnett
// =======================================================================
// Importing

// =======================================================================

// Enum of block IDs
export const BlockId = {
    Air:           0,
    Grass:         1,
    Dirt:          2,
    Stone:         3,
    Sand:          4,
    Water:         5,
    Log:           6,
    Leaves:        7,
    CoalOre:       8,
    IronOre:       9,
    GoldOre:       10,
    DiamondOre:    11,
    AridGrass:     12,
    TropicalGrass: 13,
    ColdGrass:     14,
    Cactus:        15,
    JungleLog:     16,
    PineLog:       17,
    AcaciaLog:     18,
    JungleLeaves:  19,
    PineLeaves:    20,
    AcaciaLeaves:  21,
    OakWoodenPlanks:     22,
    JungleWoodenPlanks:  23,
    PineWoodenPlanks:    24,
    AcaciaWoodenPlanks:  25,
};

export const BlockStrings = Object.keys (BlockId);