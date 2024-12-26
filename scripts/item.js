// Minecraft clone made with THREE.js
// Items
// By Amy Burnett
// =======================================================================
// Importing


// =======================================================================

export class Item
{
    constructor (itemId)
    {
        this.itemId = itemId;
    }

    // ===================================================================

    copy ()
    {
        const itemCopy = new Item (this.itemId);
        return itemCopy;
    }

}