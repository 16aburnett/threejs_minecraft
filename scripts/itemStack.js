// Minecraft clone made with THREE.js
// Stacks of items
// By Amy Burnett
// =======================================================================
// Importing


// =======================================================================

// Represents multiple amounts of a given item.
export class ItemStack
{
    constructor (item, amount)
    {
        this.item = item;
        // Warning: we are not making sure that amount is < max
        // so this may cause unintended behaviors
        this.amount = amount;
    }

    // ===================================================================

    copy ()
    {
        const itemCopy = new ItemStack (this.item.copy (), this.amount);
        return itemCopy;
    }

}