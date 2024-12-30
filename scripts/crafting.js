// Minecraft clone made with THREE.js
// Crafting
// By Amy Burnett
// =======================================================================
// Importing

import { Item } from "./item.js";
import { ItemId } from "./itemId.js";
import { ItemStack } from "./itemStack.js";
import { Recipe } from "./recipe.js";

//========================================================================

export const recipes = [];

recipes.push (new Recipe (
    [[ItemId.LogBlock]],
    new ItemStack (new Item (ItemId.DirtBlock), 4)
));
recipes.push (new Recipe (
    [[ItemId.StoneBlock]],
    new ItemStack (new Item (ItemId.SandBlock), 4)
));
// recipes.push (new Recipe (
//     [[ItemId.LogBlock]],
//     new ItemStack (new Item (ItemId._WOODEN_PLANKS), 4)
// ));
// recipes.push (new Recipe (
//     [[ItemId._WOODEN_PLANKS],
//     [ItemId._WOODEN_PLANKS]],
//     new ItemStack (new Item (ItemId.STICK), 16)
// ));
// recipes.push (new Recipe (
//     [[ItemId._WOODEN_PLANKS, ItemId._WOODEN_PLANKS],
//     [ItemId._WOODEN_PLANKS, ItemId._WOODEN_PLANKS]],
//     new ItemStack (new Item (ItemId._CRAFTING_TABLE), 1)
// ));
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

//========================================================================

export function getCraftingOutputItemStack (inputGrid)
{
    let rows = inputGrid.length;
    let cols = inputGrid[0].length;
    // Reduce grid to bounding box
    let i_min = -1;
    let j_min = -1;
    let i_max = -1;
    let j_max = -1;
    // find left
    for (let j = 0; j < cols; ++j)
    {
        let was_found = false;
        for (let i = 0; i < rows; ++i)
        {
            if (inputGrid[i][j] != null)
            {
                j_min = j;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }
    // find top
    for (let i = 0; i < rows; ++i)
    {
        let was_found = false;
        for (let j = 0; j < cols; ++j)
        {
            if (inputGrid[i][j] != null)
            {
                i_min = i;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }
    // find right
    for (let j = cols-1; j >= 0; --j)
    {
        let was_found = false;
        for (let i = 0; i < rows; ++i)
        {
            if (inputGrid[i][j] != null)
            {
                j_max = j;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }
    // find bottom
    for (let i = rows-1; i >= 0; --i)
    {
        let was_found = false;
        for (let j = 0; j < cols; ++j)
        {
            if (inputGrid[i][j] != null)
            {
                i_max = i;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }

    // ensure there was at least one item in the grid
    if (i_min == -1 || i_max == -1 || j_min == -1 || j_max == -1)
        return null;

    // create bounding boxed input
    let bounding_box_input = [];
    for (let i = i_min; i < i_max+1; ++i)
    {
        bounding_box_input.push ([]);
        for (let j = j_min; j < j_max+1; ++j)
        {
            let item = inputGrid[i][j] == null ? null : inputGrid[i][j].item.itemId;
            bounding_box_input[bounding_box_input.length-1].push (item);
        }
    }
    
    // Check for matching recipe
    let output = null;
    for (let recipe of recipes)
    {
        if (recipe.match (bounding_box_input))
        {
            // console.log ("Matches!", recipe);
            output = recipe.output;
            // we found the match
            // so we can stop checking
            // (recipes should be unique)
            break;
        }
    }

    // if recipe matches, then output result, otherwise null
    return output;
}

//========================================================================
