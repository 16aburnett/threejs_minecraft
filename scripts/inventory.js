// Minecraft clone made with THREE.js
// Inventory system
// By Amy Burnett
// =======================================================================
// Importing

import { itemStaticData } from "./itemData.js";

// =======================================================================

/**
 * A generic 2D inventory store for different items.
 */
export class Inventory
{
    constructor (rows, cols)
    {
        this.rows = rows;
        this.cols = cols;
        this.numSlots = this.rows * this.cols;
        this.slots = new Array (this.numSlots).fill (null);
    }

    // ===================================================================

    /**
     * Attempts to add the given item stack to this inventory wherever
     * there is space, if space exists.
     * @param {*} incomingItemStack 
     * @returns the remaining stack of items that could not fit
     */
    addItem (incomingItemStack)
    {
        for (let i = 0; i < this.slots.length; ++i)
        {
            // empty slot
            if (this.slots[i] == null)
            {
                // just add to slot
                this.slots[i] = incomingItemStack;
                // no leftovers to return
                return null;
            }
            // same item type - coalesce stacks
            if (this.slots[i].item.itemId == incomingItemStack.item.itemId)
            {
                let maxCount = itemStaticData.get (this.slots[i].item.itemId).maxStackSize;
                this.slots[i].amount += incomingItemStack.amount;
                // ensure we didnt exceed max count
                if (this.slots[i].amount > maxCount)
                {
                    // save leftover amount and move on to more slots
                    incomingItemStack.amount = this.slots[i].amount - maxCount;
                    this.slots[i].amount = maxCount;
                }
                else
                {
                    // didnt exceed - nothing remaining to add
                    incomingItemStack = null;
                    return null;
                }
            }
        }
        return incomingItemStack;
    }

    // ===================================================================
    
    // adds item at index and returns overflow or the previously stored item
    /**
     * Attempts to add the given item stack to the given position,
     * and returns the previously stored item stack.
     * @param {*} i 
     * @param {*} j 
     * @param {*} incomingItemStack 
     * @returns 
     */
    addItemAt (i, j, incomingItemStack)
    {
        // ensure valid position
        if (!(i < this.rows && j < this.cols && i >= 0 && j >= 0))
            // return back the same thing since we couldn't store it
            return incomingItemStack;
        let prevItemStack = this.slots[i * this.cols + j];
        // ** for right now, just swap the stacks
        this.slots[i * this.cols + j] = incomingItemStack;
        return prevItemStack;
    }

    // ===================================================================

    /**
     * Returns the item stack at the given position.
     * If position is invalid or there is no item stack, then this
     * returns null.
     * @param {*} i 
     * @param {*} j 
     * @returns 
     */
    getItemAt (i, j)
    {
        // ensure valid position
        if (!(i < this.rows && j < this.cols && i >= 0 && j >= 0))
            return null;
        return this.slots[i * this.cols + j];
    }

    // ===================================================================

    /**
     * Swaps in the given item stack to the given position and returns
     * the item stack that was previously stored there.
     * @param {*} i
     * @param {*} j 
     * @param {*} incomingItemStack 
     * @returns 
     */
    swapItemAt (i, j, incomingItemStack)
    {
        // ensure valid position
        if (!(i < this.rows && j < this.cols && i >= 0 && j >= 0))
            // return back the same thing since we couldn't store it
            return incomingItemStack;
        let prevItemStack = this.slots[i * this.cols + j];
        this.slots[i * this.cols + j] = incomingItemStack;
        return prevItemStack;
    }
}