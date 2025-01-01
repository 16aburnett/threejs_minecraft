// Minecraft clone made with THREE.js
// Items
// By Amy Burnett
// =======================================================================
// Importing

import { itemStaticData } from "./itemData.js";


// =======================================================================

export class Item
{
    constructor (itemId)
    {
        this.itemId = itemId;
        this.usages = itemStaticData[this.itemId].toolDurabilityMax;
    }

    // ===================================================================

    copy ()
    {
        const itemCopy = new Item (this.itemId);
        itemCopy.usages = this.usages;
        return itemCopy;
    }

}