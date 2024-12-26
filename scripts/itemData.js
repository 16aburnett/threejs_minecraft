// Minecraft clone made with THREE.js
// Static data for defining items
// By Amy Burnett
// =======================================================================
// Importing

import { BlockId } from "./blockData.js";

// =======================================================================

// Enum of item IDs
export const ItemId = {
    AirBlock:           0,
    GrassBlock:         1,
    DirtBlock:          2,
    StoneBlock:         3,
    SandBlock:          4,
    WaterBlock:         5,
    LogBlock:           6,
    LeavesBlock:        7,
    CoalOreBlock:       8,
    IronOreBlock:       9,
    GoldOreBlock:       10,
    DiamondOreBlock:    11,
    AridGrassBlock:     12,
    TropicalGrassBlock: 13,
    ColdGrassBlock:     14,
    CactusBlock:        15,
    JungleLogBlock:     16,
    PineLogBlock:       17,
    AcaciaLogBlock:     18,
    JungleLeavesBlock:  19,
    PineLeavesBlock:    20,
    AcaciaLeavesBlock:  21,
};

// Note: order must match enum order
export const itemStaticData = [
    {
        id: ItemId.AirBlock,
        name: "AirBlock",
        maxStackSize: 64,
        texture: null,
        blockToPlace: BlockId.Air
    },
    {
        id: ItemId.GrassBlock,
        name: "GrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_grass_side.png",
        blockToPlace: BlockId.Grass
    },
    {
        id: ItemId.DirtBlock,
        name: "DirtBlock",
        maxStackSize: 64,
        texture: "assets/texture_dirt.png",
        blockToPlace: BlockId.Dirt
    },
    {
        id: ItemId.StoneBlock,
        name: "StoneBlock",
        maxStackSize: 64,
        texture: "assets/texture_stone.png",
        blockToPlace: BlockId.Stone
    },
    {
        id: ItemId.SandBlock,
        name: "SandBlock",
        maxStackSize: 64,
        texture: "assets/texture_sand.png",
        blockToPlace: BlockId.Sand
    },
    {
        id: ItemId.WaterBlock,
        name: "WaterBlock",
        maxStackSize: 64,
        texture: "assets/texture_water.png",
        blockToPlace: BlockId.Water
    },
    {
        id: ItemId.LogBlock,
        name: "LogBlock",
        maxStackSize: 64,
        texture: "assets/texture_log_top.png",
        blockToPlace: BlockId.Log
    },
    {
        id: ItemId.LeavesBlock,
        name: "LeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_leaves.png",
        blockToPlace: BlockId.Leaves
    },
    {
        id: ItemId.CoalOreBlock,
        name: "CoalOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_coal_ore.png",
        blockToPlace: BlockId.CoalOre
    },
    {
        id: ItemId.IronOreBlock,
        name: "IronOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_iron_ore.png",
        blockToPlace: BlockId.IronOre
    },
    {
        id: ItemId.GoldOreBlock,
        name: "GoldOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_gold_ore.png",
        blockToPlace: BlockId.GoldOre
    },
    {
        id: ItemId.DiamondOreBlock,
        name: "DiamondOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_diamond_ore.png",
        blockToPlace: BlockId.DiamondOre
    },
    {
        id: ItemId.AridGrassBlock,
        name: "AridGrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_arid_grass_side.png",
        blockToPlace: BlockId.AridGrass
    },
    {
        id: ItemId.TropicalGrassBlock,
        name: "TropicalGrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_jungle_grass_side.png",
        blockToPlace: BlockId.TropicalGrass
    },
    {
        id: ItemId.ColdGrassBlock,
        name: "ColdGrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_cold_grass_side.png",
        blockToPlace: BlockId.ColdGrass
    },
    {
        id: ItemId.CactusBlock,
        name: "CactusBlock",
        maxStackSize: 64,
        texture: "assets/texture_cactus_side.png",
        blockToPlace: BlockId.Cactus
    },
    {
        id: ItemId.JungleLogBlock,
        name: "JungleLogBlock",
        maxStackSize: 64,
        texture: "assets/texture_jungle_log_top.png",
        blockToPlace: BlockId.JungleLog
    },
    {
        id: ItemId.PineLogBlock,
        name: "PineLogBlock",
        maxStackSize: 64,
        texture: "assets/texture_pine_log_top.png",
        blockToPlace: BlockId.PineLog
    },
    {
        id: ItemId.AcaciaLogBlock,
        name: "AcaciaLogBlock",
        maxStackSize: 64,
        texture: "assets/texture_acacia_log_top.png",
        blockToPlace: BlockId.AcaciaLog
    },
    {
        id: ItemId.JungleLeavesBlock,
        name: "JungleLeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_jungle_leaves.png",
        blockToPlace: BlockId.JungleLeaves
    },
    {
        id: ItemId.PineLeavesBlock,
        name: "PineLeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_pine_leaves.png",
        blockToPlace: BlockId.PineLeaves
    },
    {
        id: ItemId.AcaciaLeavesBlock,
        name: "AcaciaLeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_acacia_leaves.png",
        blockToPlace: BlockId.AcaciaLeaves
    }
];