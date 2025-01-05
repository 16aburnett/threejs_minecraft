// Minecraft clone made with THREE.js
// Valid recipes
// By Amy Burnett
// =======================================================================
// Importing

import { Item } from "./item.js";
import { ItemId } from "./itemId.js";
import { ItemStack } from "./itemStack.js";
import { Recipe } from "./recipe.js";

// =======================================================================

export const recipes = [];

recipes.push (new Recipe (
    [[ItemId.LogBlock]],
    new ItemStack (new Item (ItemId.OakWoodenPlanksBlock), 4)
));
recipes.push (new Recipe (
    [[ItemId.JungleLogBlock]],
    new ItemStack (new Item (ItemId.JungleWoodenPlanksBlock), 4)
));
recipes.push (new Recipe (
    [[ItemId.PineLogBlock]],
    new ItemStack (new Item (ItemId.PineWoodenPlanksBlock), 4)
));
recipes.push (new Recipe (
    [[ItemId.AcaciaLogBlock]],
    new ItemStack (new Item (ItemId.AcaciaWoodenPlanksBlock), 4)
));
recipes.push (new Recipe (
    [[ItemId.OakWoodenPlanksBlock],
    [ItemId.OakWoodenPlanksBlock]],
    new ItemStack (new Item (ItemId.Stick), 16)
));
recipes.push (new Recipe (
    [[ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock],
    [ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock]],
    new ItemStack (new Item (ItemId.CraftingTableBlock), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock],
        [null                       , ItemId.Stick               , null                       ],
        [null                       , ItemId.Stick               , null                       ]
    ],
    new ItemStack (new Item (ItemId.WoodenPickaxe), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock],
        [ItemId.OakWoodenPlanksBlock, ItemId.Stick               ],
        [null                       , ItemId.Stick               ]
    ],
    new ItemStack (new Item (ItemId.WoodenAxe), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.OakWoodenPlanksBlock],
        [ItemId.Stick               ],
        [ItemId.Stick               ]
    ],
    new ItemStack (new Item (ItemId.WoodenShovel), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock],
        [null                       , ItemId.Stick               ],
        [null                       , ItemId.Stick               ]
    ],
    new ItemStack (new Item (ItemId.WoodenHoe), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.OakWoodenPlanksBlock],
        [ItemId.OakWoodenPlanksBlock],
        [ItemId.Stick               ]
    ],
    new ItemStack (new Item (ItemId.WoodenSword), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.CobblestoneBlock, ItemId.CobblestoneBlock, ItemId.CobblestoneBlock],
        [null                   , ItemId.Stick           , null                   ],
        [null                   , ItemId.Stick           , null                   ]
    ],
    new ItemStack (new Item (ItemId.StonePickaxe), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.CobblestoneBlock  , ItemId.CobblestoneBlock],
        [ItemId.CobblestoneBlock  , ItemId.Stick           ],
        [null                     , ItemId.Stick           ]
    ],
    new ItemStack (new Item (ItemId.StoneAxe), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.CobblestoneBlock],
        [ItemId.Stick           ],
        [ItemId.Stick           ]
    ],
    new ItemStack (new Item (ItemId.StoneShovel), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.CobblestoneBlock, ItemId.CobblestoneBlock],
        [null                   , ItemId.Stick           ],
        [null                   , ItemId.Stick           ]
    ],
    new ItemStack (new Item (ItemId.StoneHoe), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.CobblestoneBlock],
        [ItemId.CobblestoneBlock],
        [ItemId.Stick           ]
    ],
    new ItemStack (new Item (ItemId.StoneSword), 1)
));
recipes.push (new Recipe (
    [
        [ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock],
        [ItemId.OakWoodenPlanksBlock, null                       , ItemId.OakWoodenPlanksBlock],
        [ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock, ItemId.OakWoodenPlanksBlock]
    ],
    new ItemStack (new Item (ItemId.ChestBlock), 1)
));
