// Minecraft clone made with THREE.js
// Block entities - data for associated blocks in the world
// By Amy Burnett
// =======================================================================
// Importing


// =======================================================================

/**
 * BlockEntity represents any extra data that may be associated with a
 * Block beyond what is stored statically and beyond block states.
 */
export class BlockEntity
{
    /**
     * Constructs a Block Entity
     * @param {Object} dataObject - the data to store for the given block
     * entity
     */
    constructor (dataObject)
    {
        this.data = dataObject;
    }

}
