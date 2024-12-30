// Minecraft clone made with THREE.js
// Crafting recipes
// By Amy Burnett
// =======================================================================
// Importing


//========================================================================

export class Recipe
{
    constructor (input, output)
    {
        this.input = input;
        this.output = output;
        this.rows = input.length;
        // **this might not be ideal because this assumes that the user 
        // inputted a non-jagged 2D array
        this.cols = input[0].length;
    }

    // ===================================================================

    match (otherInput)
    {
        // ensure that dimensions match
        if (otherInput.length != this.rows || otherInput[0].length != this.cols)
            return false;
        // ensure each item matches
        for (let i = 0; i < this.rows; ++i)
            for (let j = 0; j < this.cols; ++j)
                if (otherInput[i][j] != this.input[i][j])
                    return false;
        // all items match so the given input matches this recipe
        return true;
    }
}