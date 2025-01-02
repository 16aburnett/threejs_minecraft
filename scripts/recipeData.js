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
// recipes.push (new Recipe (
//     [
//         [ItemId._WOODEN_PLANKS, ItemId._WOODEN_PLANKS, ItemId._WOODEN_PLANKS],
//         [null                  , ItemId.STICK         , null                  ],
//         [null                  , ItemId.STICK         , null                  ]
//     ],
//     new ItemStack (new Item (ItemId.WOODEN_PICKAXE), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._WOODEN_PLANKS, ItemId._WOODEN_PLANKS],
//         [ItemId._WOODEN_PLANKS, ItemId.STICK         ],
//         [null                  , ItemId.STICK         ]
//     ],
//     new ItemStack (new Item (ItemId.WOODEN_AXE), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._WOODEN_PLANKS],
//         [ItemId.STICK         ],
//         [ItemId.STICK         ]
//     ],
//     new ItemStack (new Item (ItemId.WOODEN_SHOVEL), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._WOODEN_PLANKS, ItemId._WOODEN_PLANKS],
//         [null                  , ItemId.STICK         ],
//         [null                  , ItemId.STICK         ]
//     ],
//     new ItemStack (new Item (ItemId.WOODEN_HOE), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._WOODEN_PLANKS],
//         [ItemId._WOODEN_PLANKS],
//         [ItemId.STICK         ]
//     ],
//     new ItemStack (new Item (ItemId.WOODEN_SWORD), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._COBBLESTONE, ItemId._COBBLESTONE, ItemId._COBBLESTONE],
//         [null                , ItemId.STICK       , null                ],
//         [null                , ItemId.STICK       , null                ]
//     ],
//     new ItemStack (new Item (ItemId.STONE_PICKAXE), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._COBBLESTONE  , ItemId._COBBLESTONE],
//         [ItemId._COBBLESTONE  , ItemId.STICK       ],
//         [null                  , ItemId.STICK       ]
//     ],
//     new ItemStack (new Item (ItemId.STONE_AXE), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._COBBLESTONE],
//         [ItemId.STICK       ],
//         [ItemId.STICK       ]
//     ],
//     new ItemStack (new Item (ItemId.STONE_SHOVEL), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._COBBLESTONE  , ItemId._COBBLESTONE],
//         [null                  , ItemId.STICK       ],
//         [null                  , ItemId.STICK       ]
//     ],
//     new ItemStack (new Item (ItemId.STONE_HOE), 1)
// ));
// recipes.push (new Recipe (
//     [
//         [ItemId._COBBLESTONE],
//         [ItemId._COBBLESTONE],
//         [ItemId.STICK       ]
//     ],
//     new ItemStack (new Item (ItemId.STONE_SWORD), 1)
// ));
