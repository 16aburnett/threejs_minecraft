// Minecraft clone made with THREE.js
// Static data for defining items
// By Amy Burnett
// =======================================================================
// Importing

import { BlockId } from "./blockId.js";
import { ItemId } from "./itemId.js";
import { ToolType } from "./tool.js";

// =======================================================================

// Note: order must match enum order
export const itemStaticData = [
    {
        id: ItemId.AirBlock,
        name: "AirBlock",
        maxStackSize: 64,
        texture: null,
        blockToPlace: BlockId.Air,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.GrassBlock,
        name: "GrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_grass_side.png",
        blockToPlace: BlockId.Grass,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.DirtBlock,
        name: "DirtBlock",
        maxStackSize: 64,
        texture: "assets/texture_dirt.png",
        blockToPlace: BlockId.Dirt,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.StoneBlock,
        name: "StoneBlock",
        maxStackSize: 64,
        texture: "assets/texture_stone.png",
        blockToPlace: BlockId.Stone,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.SandBlock,
        name: "SandBlock",
        maxStackSize: 64,
        texture: "assets/texture_sand.png",
        blockToPlace: BlockId.Sand,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.WaterBlock,
        name: "WaterBlock",
        maxStackSize: 64,
        texture: "assets/texture_water.png",
        blockToPlace: BlockId.Water,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.LogBlock,
        name: "LogBlock",
        maxStackSize: 64,
        texture: "assets/texture_log_top.png",
        blockToPlace: BlockId.Log,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.LeavesBlock,
        name: "LeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_leaves.png",
        blockToPlace: BlockId.Leaves,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.CoalOreBlock,
        name: "CoalOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_coal_ore.png",
        blockToPlace: BlockId.CoalOre,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.IronOreBlock,
        name: "IronOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_iron_ore.png",
        blockToPlace: BlockId.IronOre,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.GoldOreBlock,
        name: "GoldOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_gold_ore.png",
        blockToPlace: BlockId.GoldOre,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.DiamondOreBlock,
        name: "DiamondOreBlock",
        maxStackSize: 64,
        texture: "assets/texture_diamond_ore.png",
        blockToPlace: BlockId.DiamondOre,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.AridGrassBlock,
        name: "AridGrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_arid_grass_side.png",
        blockToPlace: BlockId.AridGrass,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.TropicalGrassBlock,
        name: "TropicalGrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_jungle_grass_side.png",
        blockToPlace: BlockId.TropicalGrass,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.ColdGrassBlock,
        name: "ColdGrassBlock",
        maxStackSize: 64,
        texture: "assets/texture_cold_grass_side.png",
        blockToPlace: BlockId.ColdGrass,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.CactusBlock,
        name: "CactusBlock",
        maxStackSize: 64,
        texture: "assets/texture_cactus_side.png",
        blockToPlace: BlockId.Cactus,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.JungleLogBlock,
        name: "JungleLogBlock",
        maxStackSize: 64,
        texture: "assets/texture_jungle_log_top.png",
        blockToPlace: BlockId.JungleLog,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.PineLogBlock,
        name: "PineLogBlock",
        maxStackSize: 64,
        texture: "assets/texture_pine_log_top.png",
        blockToPlace: BlockId.PineLog,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.AcaciaLogBlock,
        name: "AcaciaLogBlock",
        maxStackSize: 64,
        texture: "assets/texture_acacia_log_top.png",
        blockToPlace: BlockId.AcaciaLog,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.JungleLeavesBlock,
        name: "JungleLeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_jungle_leaves.png",
        blockToPlace: BlockId.JungleLeaves,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.PineLeavesBlock,
        name: "PineLeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_pine_leaves.png",
        blockToPlace: BlockId.PineLeaves,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.AcaciaLeavesBlock,
        name: "AcaciaLeavesBlock",
        maxStackSize: 64,
        texture: "assets/texture_acacia_leaves.png",
        blockToPlace: BlockId.AcaciaLeaves,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.OakWoodenPlanksBlock,
        name: "OakWoodenPlanksBlock",
        maxStackSize: 64,
        texture: "assets/texture_wooden_planks.png",
        blockToPlace: BlockId.OakWoodenPlanks,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.JungleWoodenPlanksBlock,
        name: "JungleWoodenPlanksBlock",
        maxStackSize: 64,
        texture: "assets/texture_jungle_wooden_planks.png",
        blockToPlace: BlockId.JungleWoodenPlanks,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.PineWoodenPlanksBlock,
        name: "PineWoodenPlanksBlock",
        maxStackSize: 64,
        texture: "assets/texture_pine_wooden_planks.png",
        blockToPlace: BlockId.PineWoodenPlanks,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.AcaciaWoodenPlanksBlock,
        name: "AcaciaWoodenPlanksBlock",
        maxStackSize: 64,
        texture: "assets/texture_acacia_wooden_planks.png",
        blockToPlace: BlockId.AcaciaWoodenPlanks,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.Stick,
        name: "Stick",
        maxStackSize: 64,
        texture: "assets/texture_stick.png",
        blockToPlace: null,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.WoodenAxe,
        name: "WoodenAxe",
        maxStackSize: 1,
        texture: "assets/texture_wooden_axe.png",
        blockToPlace: null,
        toolType: ToolType.Axe,
        toolEfficiencyFactor: 2,
        toolDurabilityMax: 64,
    },
    {
        id: ItemId.WoodenHoe,
        name: "WoodenHoe",
        maxStackSize: 1,
        texture: "assets/texture_wooden_hoe.png",
        blockToPlace: null,
        toolType: ToolType.Hoe,
        toolEfficiencyFactor: 10,
        toolDurabilityMax: 64,
    },
    {
        id: ItemId.WoodenPickaxe,
        name: "WoodenPickaxe",
        maxStackSize: 1,
        texture: "assets/texture_wooden_pickaxe.png",
        blockToPlace: null,
        toolType: ToolType.Pickaxe,
        toolEfficiencyFactor: 1 / 0.16,
        toolDurabilityMax: 64,
    },
    {
        id: ItemId.WoodenShovel,
        name: "WoodenShovel",
        maxStackSize: 1,
        texture: "assets/texture_wooden_shovel.png",
        blockToPlace: null,
        toolType: ToolType.Shovel,
        toolEfficiencyFactor: 2,
        toolDurabilityMax: 64,
    },
    {
        id: ItemId.WoodenSword,
        name: "WoodenSword",
        maxStackSize: 1,
        texture: "assets/texture_wooden_sword.png",
        blockToPlace: null,
        toolType: ToolType.Sword,
        toolEfficiencyFactor: 2,
        toolDurabilityMax: 64,
    },
    {
        id: ItemId.StoneAxe,
        name: "StoneAxe",
        maxStackSize: 1,
        texture: "assets/texture_stone_axe.png",
        blockToPlace: null,
        toolType: ToolType.Axe,
        toolEfficiencyFactor: 3,
        toolDurabilityMax: 128,
    },
    {
        id: ItemId.StoneHoe,
        name: "StoneHoe",
        maxStackSize: 1,
        texture: "assets/texture_stone_hoe.png",
        blockToPlace: null,
        toolType: ToolType.Hoe,
        toolEfficiencyFactor: 10,
        toolDurabilityMax: 128,
    },
    {
        id: ItemId.StonePickaxe,
        name: "StonePickaxe",
        maxStackSize: 1,
        texture: "assets/texture_stone_pickaxe.png",
        blockToPlace: null,
        toolType: ToolType.Pickaxe,
        toolEfficiencyFactor: 1 / 0.085,
        toolDurabilityMax: 128,
    },
    {
        id: ItemId.StoneShovel,
        name: "StoneShovel",
        maxStackSize: 1,
        texture: "assets/texture_stone_shovel.png",
        blockToPlace: null,
        toolType: ToolType.Shovel,
        toolEfficiencyFactor: 3,
        toolDurabilityMax: 128,
    },
    {
        id: ItemId.StoneSword,
        name: "StoneSword",
        maxStackSize: 1,
        texture: "assets/texture_stone_sword.png",
        blockToPlace: null,
        toolType: ToolType.Sword,
        toolEfficiencyFactor: 3,
        toolDurabilityMax: 128,
    },
    {
        id: ItemId.CraftingTableBlock,
        name: "CraftingTableBlock",
        maxStackSize: 64,
        texture: "assets/texture_crafting_table_front.png",
        blockToPlace: BlockId.CraftingTable,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    },
    {
        id: ItemId.CobblestoneBlock,
        name: "CobblestoneBlock",
        maxStackSize: 64,
        texture: "assets/texture_cobblestone.png",
        blockToPlace: BlockId.Cobblestone,
        toolType: ToolType.None,
        toolEfficiencyFactor: 0,
        toolDurabilityMax: 0,
    }
];