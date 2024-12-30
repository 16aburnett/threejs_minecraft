// Minecraft clone made with THREE.js
// Crafting
// By Amy Burnett
// =======================================================================
// Importing

import { recipes } from "./recipeData.js";

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
