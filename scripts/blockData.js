// Minecraft clone made with THREE.js
// By Amy Burnett
// September 20, 2024
// =======================================================================
// Importing

import { BlockId } from './blockId.js';
import { ItemId } from './itemId.js';
import { ToolType } from './tool.js';
import { BlockEntity } from './blockEntity.js';
import { Inventory } from './inventory.js';
import { ChestUI } from './chestUI.js';
import { CraftingTableUI } from './craftingTableUI.js';
import { FurnaceUI } from './furnaceUI.js';
import { updateFurnace } from './furnace.js';

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
        textureUVs: {
            top:    toNormalizedTexureUV (4.0, 0.0), // top
            front:  toNormalizedTexureUV (3.0, 0.0), // sides
            back:   toNormalizedTexureUV (3.0, 0.0), // sides
            left:   toNormalizedTexureUV (3.0, 0.0), // sides
            right:  toNormalizedTexureUV (3.0, 0.0), // sides
            bottom: toNormalizedTexureUV (2.0, 0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (2.0, 0.0), // top
            front:  toNormalizedTexureUV (2.0, 0.0), // sides
            back:   toNormalizedTexureUV (2.0, 0.0), // sides
            left:   toNormalizedTexureUV (2.0, 0.0), // sides
            right:  toNormalizedTexureUV (2.0, 0.0), // sides
            bottom: toNormalizedTexureUV (2.0, 0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (1.0, 0.0), // top
            front:  toNormalizedTexureUV (1.0, 0.0), // sides
            back:   toNormalizedTexureUV (1.0, 0.0), // sides
            left:   toNormalizedTexureUV (1.0, 0.0), // sides
            right:  toNormalizedTexureUV (1.0, 0.0), // sides
            bottom: toNormalizedTexureUV (1.0, 0.0)  // bottom
        },
        isResource: false,
        itemToDrop: ItemId.CobblestoneBlock,
        mineDuration: 7.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.Sand,
        name: "Sand",
        color: 0xffffff,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (5.0, 0.0), // top
            front:  toNormalizedTexureUV (5.0, 0.0), // sides
            back:   toNormalizedTexureUV (5.0, 0.0), // sides
            left:   toNormalizedTexureUV (5.0, 0.0), // sides
            right:  toNormalizedTexureUV (5.0, 0.0), // sides
            bottom: toNormalizedTexureUV (5.0, 0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (6.0, 0.0), // top
            front:  toNormalizedTexureUV (6.0, 0.0), // sides
            back:   toNormalizedTexureUV (6.0, 0.0), // sides
            left:   toNormalizedTexureUV (6.0, 0.0), // sides
            right:  toNormalizedTexureUV (6.0, 0.0), // sides
            bottom: toNormalizedTexureUV (6.0, 0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (8.0, 0.0), // top
            front:  toNormalizedTexureUV (7.0, 0.0), // sides
            back:   toNormalizedTexureUV (7.0, 0.0), // sides
            left:   toNormalizedTexureUV (7.0, 0.0), // sides
            right:  toNormalizedTexureUV (7.0, 0.0), // sides
            bottom: toNormalizedTexureUV (8.0, 0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (9.0, 0.0), // top
            front:  toNormalizedTexureUV (9.0, 0.0), // sides
            back:   toNormalizedTexureUV (9.0, 0.0), // sides
            left:   toNormalizedTexureUV (9.0, 0.0), // sides
            right:  toNormalizedTexureUV (9.0, 0.0), // sides
            bottom: toNormalizedTexureUV (9.0, 0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (6.0, -1.0), // top
            front:  toNormalizedTexureUV (6.0, -1.0), // sides
            back:   toNormalizedTexureUV (6.0, -1.0), // sides
            left:   toNormalizedTexureUV (6.0, -1.0), // sides
            right:  toNormalizedTexureUV (6.0, -1.0), // sides
            bottom: toNormalizedTexureUV (6.0, -1.0)  // bottom
        },
        isResource: true,
        resourceGeneration: {
            scale: 15,
            scarcity: 0.91,
            offset: 0,
            maxHeight: -1
        },
        itemToDrop: ItemId.Coal,
        mineDuration: 7.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.IronOre,
        name: "IronOre",
        color: 0xffbd8a,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (7.0, -1.0), // top
            front:  toNormalizedTexureUV (7.0, -1.0), // sides
            back:   toNormalizedTexureUV (7.0, -1.0), // sides
            left:   toNormalizedTexureUV (7.0, -1.0), // sides
            right:  toNormalizedTexureUV (7.0, -1.0), // sides
            bottom: toNormalizedTexureUV (7.0, -1.0)  // bottom
        },
        isResource: true,
        resourceGeneration: {
            scale: 16,
            scarcity: 0.94,
            offset: 5,
            maxHeight: -1
        },
        itemToDrop: ItemId.IronIngot,
        mineDuration: 7.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.GoldOre,
        name: "GoldOre",
        color: 0xffff00,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (8.0, -1.0), // top
            front:  toNormalizedTexureUV (8.0, -1.0), // sides
            back:   toNormalizedTexureUV (8.0, -1.0), // sides
            left:   toNormalizedTexureUV (8.0, -1.0), // sides
            right:  toNormalizedTexureUV (8.0, -1.0), // sides
            bottom: toNormalizedTexureUV (8.0, -1.0)  // bottom
        },
        isResource: true,
        resourceGeneration: {
            scale: 10,
            scarcity: 0.9,
            offset: 10,
            maxHeight: 32
        },
        itemToDrop: ItemId.GoldIngot,
        mineDuration: 8.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.DiamondOre,
        name: "DiamondOre",
        color: 0x00ffff,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (9.0, -1.0), // top
            front:  toNormalizedTexureUV (9.0, -1.0), // sides
            back:   toNormalizedTexureUV (9.0, -1.0), // sides
            left:   toNormalizedTexureUV (9.0, -1.0), // sides
            right:  toNormalizedTexureUV (9.0, -1.0), // sides
            bottom: toNormalizedTexureUV (9.0, -1.0)  // bottom
        },
        isResource: true,
        resourceGeneration: {
            scale: 10,
            scarcity: 0.925,
            offset: 15,
            maxHeight: 16
        },
        itemToDrop: ItemId.Diamond,
        mineDuration: 9.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.AridGrass,
        name: "AridGrass",
        color: 0xbfb755,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (1.0, -2.0), // top
            front:  toNormalizedTexureUV (0.0, -2.0), // sides
            back:   toNormalizedTexureUV (0.0, -2.0), // sides
            left:   toNormalizedTexureUV (0.0, -2.0), // sides
            right:  toNormalizedTexureUV (0.0, -2.0), // sides
            bottom: toNormalizedTexureUV (2.0,  0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (3.0, -2.0), // top
            front:  toNormalizedTexureUV (2.0, -2.0), // sides
            back:   toNormalizedTexureUV (2.0, -2.0), // sides
            left:   toNormalizedTexureUV (2.0, -2.0), // sides
            right:  toNormalizedTexureUV (2.0, -2.0), // sides
            bottom: toNormalizedTexureUV (2.0,  0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (5.0, -2.0), // top
            front:  toNormalizedTexureUV (4.0, -2.0), // sides
            back:   toNormalizedTexureUV (4.0, -2.0), // sides
            left:   toNormalizedTexureUV (4.0, -2.0), // sides
            right:  toNormalizedTexureUV (4.0, -2.0), // sides
            bottom: toNormalizedTexureUV (2.0,  0.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (7.0, -2.0), // top
            front:  toNormalizedTexureUV (6.0, -2.0), // sides
            back:   toNormalizedTexureUV (6.0, -2.0), // sides
            left:   toNormalizedTexureUV (6.0, -2.0), // sides
            right:  toNormalizedTexureUV (6.0, -2.0), // sides
            bottom: toNormalizedTexureUV (7.0, -2.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (9.0, -2.0), // top
            front:  toNormalizedTexureUV (8.0, -2.0), // sides
            back:   toNormalizedTexureUV (8.0, -2.0), // sides
            left:   toNormalizedTexureUV (8.0, -2.0), // sides
            right:  toNormalizedTexureUV (8.0, -2.0), // sides
            bottom: toNormalizedTexureUV (9.0, -2.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (1.0, -3.0), // top
            front:  toNormalizedTexureUV (0.0, -3.0), // sides
            back:   toNormalizedTexureUV (0.0, -3.0), // sides
            left:   toNormalizedTexureUV (0.0, -3.0), // sides
            right:  toNormalizedTexureUV (0.0, -3.0), // sides
            bottom: toNormalizedTexureUV (1.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (3.0, -3.0), // top
            front:  toNormalizedTexureUV (2.0, -3.0), // sides
            back:   toNormalizedTexureUV (2.0, -3.0), // sides
            left:   toNormalizedTexureUV (2.0, -3.0), // sides
            right:  toNormalizedTexureUV (2.0, -3.0), // sides
            bottom: toNormalizedTexureUV (3.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (5.0, -3.0), // top
            front:  toNormalizedTexureUV (5.0, -3.0), // sides
            back:   toNormalizedTexureUV (5.0, -3.0), // sides
            left:   toNormalizedTexureUV (5.0, -3.0), // sides
            right:  toNormalizedTexureUV (5.0, -3.0), // sides
            bottom: toNormalizedTexureUV (5.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (4.0, -3.0), // top
            front:  toNormalizedTexureUV (4.0, -3.0), // sides
            back:   toNormalizedTexureUV (4.0, -3.0), // sides
            left:   toNormalizedTexureUV (4.0, -3.0), // sides
            right:  toNormalizedTexureUV (4.0, -3.0), // sides
            bottom: toNormalizedTexureUV (4.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (6.0, -3.0), // top
            front:  toNormalizedTexureUV (6.0, -3.0), // sides
            back:   toNormalizedTexureUV (6.0, -3.0), // sides
            left:   toNormalizedTexureUV (6.0, -3.0), // sides
            right:  toNormalizedTexureUV (6.0, -3.0), // sides
            bottom: toNormalizedTexureUV (6.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (2.0, -1.0), // top
            front:  toNormalizedTexureUV (2.0, -1.0), // sides
            back:   toNormalizedTexureUV (2.0, -1.0), // sides
            left:   toNormalizedTexureUV (2.0, -1.0), // sides
            right:  toNormalizedTexureUV (2.0, -1.0), // sides
            bottom: toNormalizedTexureUV (2.0, -1.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (7.0, -3.0), // top
            front:  toNormalizedTexureUV (7.0, -3.0), // sides
            back:   toNormalizedTexureUV (7.0, -3.0), // sides
            left:   toNormalizedTexureUV (7.0, -3.0), // sides
            right:  toNormalizedTexureUV (7.0, -3.0), // sides
            bottom: toNormalizedTexureUV (7.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (8.0, -3.0), // top
            front:  toNormalizedTexureUV (8.0, -3.0), // sides
            back:   toNormalizedTexureUV (8.0, -3.0), // sides
            left:   toNormalizedTexureUV (8.0, -3.0), // sides
            right:  toNormalizedTexureUV (8.0, -3.0), // sides
            bottom: toNormalizedTexureUV (8.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (9.0, -3.0), // top
            front:  toNormalizedTexureUV (9.0, -3.0), // sides
            back:   toNormalizedTexureUV (9.0, -3.0), // sides
            left:   toNormalizedTexureUV (9.0, -3.0), // sides
            right:  toNormalizedTexureUV (9.0, -3.0), // sides
            bottom: toNormalizedTexureUV (9.0, -3.0)  // bottom
        },
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
        textureUVs: {
            top:    toNormalizedTexureUV (5.0, -1.0), // top
            front:  toNormalizedTexureUV (3.0, -1.0), // sides
            back:   toNormalizedTexureUV (3.0, -1.0), // sides
            left:   toNormalizedTexureUV (4.0, -1.0), // sides
            right:  toNormalizedTexureUV (4.0, -1.0), // sides
            bottom: toNormalizedTexureUV (2.0, -1.0)  // bottom
        },
        isResource: false,
        itemToDrop: ItemId.CraftingTableBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
        isInteractable: true,
        interface: CraftingTableUI
    },
    {
        id: BlockId.Cobblestone,
        name: "Cobblestone",
        color: 0xaaaaaa,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (1.0, -1.0), // top
            front:  toNormalizedTexureUV (1.0, -1.0), // sides
            back:   toNormalizedTexureUV (1.0, -1.0), // sides
            left:   toNormalizedTexureUV (1.0, -1.0), // sides
            right:  toNormalizedTexureUV (1.0, -1.0), // sides
            bottom: toNormalizedTexureUV (1.0, -1.0)  // bottom
        },
        isResource: false,
        itemToDrop: ItemId.CobblestoneBlock,
        mineDuration: 7.0,
        preferredTool: ToolType.Pickaxe,
    },
    {
        id: BlockId.Chest,
        name: "Chest",
        color: 0xc7975c,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (2.0, -4.0),
            front:  toNormalizedTexureUV (0.0, -4.0),
            back:   toNormalizedTexureUV (1.0, -4.0),
            left:   toNormalizedTexureUV (1.0, -4.0),
            right:  toNormalizedTexureUV (1.0, -4.0),
            bottom: toNormalizedTexureUV (2.0, -4.0),
        },
        isResource: false,
        itemToDrop: ItemId.ChestBlock,
        mineDuration: 2.0,
        preferredTool: ToolType.Axe,
        getBlockEntity: () => {
            return new BlockEntity ({
                inventory:  new Inventory (3, 9)
            })
        },
        isInteractable: true,
        interface: ChestUI
    },
    {
        id: BlockId.Furnace,
        name: "Furnace",
        color: 0xbbbbbb,
        isTransparent: false,
        textureUVs: {
            top:    toNormalizedTexureUV (3.0, -4.0),
            front:  toNormalizedTexureUV (5.0, -4.0),
            back:   toNormalizedTexureUV (4.0, -4.0),
            left:   toNormalizedTexureUV (4.0, -4.0),
            right:  toNormalizedTexureUV (4.0, -4.0),
            bottom: toNormalizedTexureUV (3.0, -4.0),
        },
        isResource: false,
        itemToDrop: ItemId.Furnace,
        mineDuration: 7.0,
        preferredTool: ToolType.Pickaxe,
        getBlockEntity: () => {
            return new BlockEntity ({
                smeltInputInventory:  new Inventory (1, 1),
                fuelInputInventory:   new Inventory (1, 1),
                outputInventory:      new Inventory (1, 1),
                currentFuelTimeLeft:  0.0,
                maxFuelTime:          0.0,
                currentSmeltTimeLeft: 0.0,
                maxSmeltTime:         0.0,
                isSmelting:           false,
                itemBeingSmelted:     null
            }, updateFurnace)
        },
        isInteractable: true,
        interface: FurnaceUI
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