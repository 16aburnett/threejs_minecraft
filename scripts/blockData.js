// Minecraft clone made with THREE.js
// By Amy Burnett
// September 20, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { BlockId } from './blockId.js';
import { ItemId } from './itemId.js';
import { ToolType } from './tool.js';

// =======================================================================
// Global variables

const TEXUTRE_ATLAS_WIDTH  = 160;
const TEXTURE_ATLAS_HEIGHT = 320;
const TEXTURE_WIDTH  = 16;
const TEXTURE_HEIGHT = 16;
export const NORMALIZED_TEXTURE_WIDTH = TEXTURE_WIDTH / TEXUTRE_ATLAS_WIDTH;
export const NORMALIZED_TEXTURE_HEIGHT = TEXTURE_HEIGHT / TEXTURE_ATLAS_HEIGHT;

// Texture Coords need to be normalized from 0.0 to 1.0
// This returns normalized coords from given index coords
// Index coords represent which texture in the atlas to use
// Example: (1, 0) uses the second texture (0-based indexing)
function toNormalizedTexureUV (u, v)
{
    return [
        u * NORMALIZED_TEXTURE_WIDTH,
        v * NORMALIZED_TEXTURE_HEIGHT
    ];
}

// List for mapping BlockIds to static block data
// Note that this should follow the same order as the enum
export const blockData = [
    {
        id: BlockId.Air,
        name: "Air",
        color: 0xff00ff,
        isTransparent: true,
        textureUVs: null, // Air does not have a texture
        isResource: false,
        itemToDrop: null,
        mineDuration: 0.0,
        preferredTool: ToolType.None,
    },
    {
        id: BlockId.Grass,
        name: "Grass",
        color: 0x00ff00,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (4.0, 0.0), // top
            ...toNormalizedTexureUV (3.0, 0.0), // sides
            ...toNormalizedTexureUV (2.0, 0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.GrassBlock,
        mineDuration: 0.75,
        preferredTool: ToolType.Shovel,
    },
    {
        id: BlockId.Dirt,
        name: "Dirt",
        color: 0x5C4033,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (2.0, 0.0), // top
            ...toNormalizedTexureUV (2.0, 0.0), // sides
            ...toNormalizedTexureUV (2.0, 0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.DirtBlock,
        mineDuration: 0.75,
        preferredTool: ToolType.Shovel,
    },
    {
        id: BlockId.Stone,
        name: "Stone",
        color: 0xbbbbbb,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (1.0, 0.0), // top
            ...toNormalizedTexureUV (1.0, 0.0), // sides
            ...toNormalizedTexureUV (1.0, 0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.StoneBlock,
        mineDuration: 7.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.Sand,
        name: "Sand",
        color: 0xffffff,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (5.0, 0.0), // top
            ...toNormalizedTexureUV (5.0, 0.0), // sides
            ...toNormalizedTexureUV (5.0, 0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.SandBlock,
        mineDuration: 0.75,
        preferredTool: ToolType.Shovel,
    },
    {
        id: BlockId.Water,
        name: "Water",
        color: 0x0000ff,
        isTransparent: true,
        textureUVs: [
            ...toNormalizedTexureUV (6.0, 0.0), // top
            ...toNormalizedTexureUV (6.0, 0.0), // sides
            ...toNormalizedTexureUV (6.0, 0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.WaterBlock,
        mineDuration: 1.0,
        preferredTool: ToolType.None,
    },
    {
        id: BlockId.Log,
        name: "Log",
        color: 0x694b37,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (8.0, 0.0), // top
            ...toNormalizedTexureUV (7.0, 0.0), // sides
            ...toNormalizedTexureUV (8.0, 0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.LogBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.Leaves,
        name: "Leaves",
        color: 0x88ff22,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (9.0, 0.0), // top
            ...toNormalizedTexureUV (9.0, 0.0), // sides
            ...toNormalizedTexureUV (9.0, 0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.LeavesBlock,
        mineDuration: 0.5,
        preferredTool: ToolType.Hoe,
    },
    {
        id: BlockId.CoalOre,
        name: "CoalOre",
        color: 0x000,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (6.0, -1.0), // top
            ...toNormalizedTexureUV (6.0, -1.0), // sides
            ...toNormalizedTexureUV (6.0, -1.0)  // bottom
        ],
        isResource: true,
        resourceGeneration: {
            scale: 15,
            scarcity: 0.91,
            offset: 0,
            maxHeight: -1
        },
        itemToDrop: ItemId.CoalOreBlock,
        mineDuration: 5.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.IronOre,
        name: "IronOre",
        color: 0xffbd8a,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (7.0, -1.0), // top
            ...toNormalizedTexureUV (7.0, -1.0), // sides
            ...toNormalizedTexureUV (7.0, -1.0)  // bottom
        ],
        isResource: true,
        resourceGeneration: {
            scale: 16,
            scarcity: 0.94,
            offset: 5,
            maxHeight: -1
        },
        itemToDrop: ItemId.IronOreBlock,
        mineDuration: 5.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.GoldOre,
        name: "GoldOre",
        color: 0xffff00,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (8.0, -1.0), // top
            ...toNormalizedTexureUV (8.0, -1.0), // sides
            ...toNormalizedTexureUV (8.0, -1.0)  // bottom
        ],
        isResource: true,
        resourceGeneration: {
            scale: 10,
            scarcity: 0.9,
            offset: 10,
            maxHeight: 32
        },
        itemToDrop: ItemId.GoldOreBlock,
        mineDuration: 5.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.DiamondOre,
        name: "DiamondOre",
        color: 0x00ffff,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (9.0, -1.0), // top
            ...toNormalizedTexureUV (9.0, -1.0), // sides
            ...toNormalizedTexureUV (9.0, -1.0)  // bottom
        ],
        isResource: true,
        resourceGeneration: {
            scale: 10,
            scarcity: 0.925,
            offset: 15,
            maxHeight: 16
        },
        itemToDrop: ItemId.DiamondOreBlock,
        mineDuration: 5.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.AridGrass,
        name: "AridGrass",
        color: 0xbfb755,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (1.0, -2.0), // top
            ...toNormalizedTexureUV (0.0, -2.0), // sides
            ...toNormalizedTexureUV (2.0,  0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.AridGrassBlock,
        mineDuration: 0.75,
        preferredTool: ToolType.Shovel,
    },
    {
        id: BlockId.TropicalGrass,
        name: "TropicalGrass",
        color: 0x64c73f,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (3.0, -2.0), // top
            ...toNormalizedTexureUV (2.0, -2.0), // sides
            ...toNormalizedTexureUV (2.0,  0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.TropicalGrassBlock,
        mineDuration: 0.75,
        preferredTool: ToolType.Shovel,
    },
    {
        id: BlockId.ColdGrass,
        name: "ColdGrass",
        color: 0x86b783,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (5.0, -2.0), // top
            ...toNormalizedTexureUV (4.0, -2.0), // sides
            ...toNormalizedTexureUV (2.0,  0.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.ColdGrassBlock,
        mineDuration: 0.75,
        preferredTool: ToolType.Shovel,
    },
    {
        id: BlockId.Cactus,
        name: "Cactus",
        color: 0x7cb342,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (7.0, -2.0), // top
            ...toNormalizedTexureUV (6.0, -2.0), // sides
            ...toNormalizedTexureUV (7.0, -2.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.CactusBlock,
        mineDuration: 0.75,
        preferredTool: ToolType.None,
    },
    {
        id: BlockId.JungleLog,
        name: "JungleLog",
        color: 0x544d1a,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (9.0, -2.0), // top
            ...toNormalizedTexureUV (8.0, -2.0), // sides
            ...toNormalizedTexureUV (9.0, -2.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.JungleLogBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.PineLog,
        name: "PineLog",
        color: 0x3a2618,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (1.0, -3.0), // top
            ...toNormalizedTexureUV (0.0, -3.0), // sides
            ...toNormalizedTexureUV (1.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.PineLogBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.AcaciaLog,
        name: "AcaciaLog",
        color: 0x635e5a,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (3.0, -3.0), // top
            ...toNormalizedTexureUV (2.0, -3.0), // sides
            ...toNormalizedTexureUV (3.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.AcaciaLogBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.JungleLeaves,
        name: "JungleLeaves",
        color: 0x59a127,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (5.0, -3.0), // top
            ...toNormalizedTexureUV (5.0, -3.0), // sides
            ...toNormalizedTexureUV (5.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.JungleLeavesBlock,
        mineDuration: 0.5,
        preferredTool: ToolType.Hoe,
    },
    {
        id: BlockId.PineLeaves,
        name: "PineLeaves",
        color: 0x3b5b36,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (4.0, -3.0), // top
            ...toNormalizedTexureUV (4.0, -3.0), // sides
            ...toNormalizedTexureUV (4.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.PineLeavesBlock,
        mineDuration: 0.5,
        preferredTool: ToolType.Hoe,
    },
    {
        id: BlockId.AcaciaLeaves,
        name: "AcaciaLeaves",
        color: 0x99a128,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (6.0, -3.0), // top
            ...toNormalizedTexureUV (6.0, -3.0), // sides
            ...toNormalizedTexureUV (6.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.AcaciaLeavesBlock,
        mineDuration: 0.5,
        preferredTool: ToolType.Hoe,
    },
    {
        id: BlockId.OakWoodenPlanks,
        name: "OakWoodenPlanks",
        color: 0xc7975c,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (2.0, -1.0), // top
            ...toNormalizedTexureUV (2.0, -1.0), // sides
            ...toNormalizedTexureUV (2.0, -1.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.OakWoodenPlanksBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.JungleWoodenPlanks,
        name: "JungleWoodenPlanks",
        color: 0xb88763,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (7.0, -3.0), // top
            ...toNormalizedTexureUV (7.0, -3.0), // sides
            ...toNormalizedTexureUV (7.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.JungleWoodenPlanksBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.PineWoodenPlanks,
        name: "PineWoodenPlanks",
        color: 0x82603a,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (8.0, -3.0), // top
            ...toNormalizedTexureUV (8.0, -3.0), // sides
            ...toNormalizedTexureUV (8.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.PineWoodenPlanksBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.AcaciaWoodenPlanks,
        name: "AcaciaWoodenPlanks",
        color: 0xb96337,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (9.0, -3.0), // top
            ...toNormalizedTexureUV (9.0, -3.0), // sides
            ...toNormalizedTexureUV (9.0, -3.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.AcaciaWoodenPlanksBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
    },
    {
        id: BlockId.CraftingTable,
        name: "CraftingTable",
        color: 0xc7975c,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (5.0, -1.0), // top
            ...toNormalizedTexureUV (3.0, -1.0), // sides
            ...toNormalizedTexureUV (2.0, -1.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.CraftingTableBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
        isInteractable: true,
    },
    {
        id: BlockId.Cobblestone,
        name: "Cobblestone",
        color: 0xaaaaaa,
        isTransparent: false,
        textureUVs: [
            ...toNormalizedTexureUV (1.0, -1.0), // top
            ...toNormalizedTexureUV (1.0, -1.0), // sides
            ...toNormalizedTexureUV (1.0, -1.0)  // bottom
        ],
        isResource: false,
        itemToDrop: ItemId.CobblestoneBlock,
        mineDuration: 7.0,
        preferredTool: ToolType.Pickaxe,
    }
];

// List of resource type blocks
// This is used for dynamically generating resources
export const resourceBlockIds = [];
for (let block of blockData)
{
    if (block.isResource)
        resourceBlockIds.push (block.id);
}