// Minecraft clone made with THREE.js
// Inventory display
// By Amy Burnett
// =======================================================================
// Importing

import { Item } from "./item.js";
import { itemStaticData } from "./itemData.js";
import { ItemStack } from "./itemStack.js";
import { PlayerHeaderUI } from "./playerHeaderUI.js";
import { PlayerInventoryUI } from "./playerInventoryUI.js";

// =======================================================================

// Handles displaying and the user interaction with the inventory
export class InventoryUI
{
    constructor (player)
    {
        this.player = player;

        this.isPressing = false;
        this.inventoryBeingPressed = null;
        this.slotBeingPressed = null;

        // Cursor item currently being held
        this.heldItemStack = null;
        this.heldItemStackDOM = null;

        this.isOpened = false;

        this.playerInventoryUI = new PlayerInventoryUI (this, player);
        this.otherInterface = undefined;
    }

    // ===================================================================

    show (otherInterface = undefined)
    {
        console.log ("Opening inventory");
        const inventoryContainerDOM = document.getElementById ("inventory-container");
        const inventoryWindowDOM = document.getElementById ("inventory-window");

        // Ensure no previous interfaces are loaded
        inventoryWindowDOM.innerHTML = "";

        // Add other interface
        this.otherInterface = otherInterface;
        if (this.otherInterface == undefined)
        {
            this.otherInterface = new PlayerHeaderUI (this, this.player);
        }
        inventoryWindowDOM.appendChild (this.otherInterface.html);

        // Add player inventory interface
        inventoryWindowDOM.appendChild (this.playerInventoryUI.html);

        // Show the inventory
        inventoryContainerDOM.style.display = "flex";
        this.isOpened = true;
    }

    // ===================================================================

    hide ()
    {
        console.log ("Closing inventory");
        document.getElementById ("inventory-container").style.display = "none";
        this.isOpened = false;
    }

    // ===================================================================

    toggleDisplay ()
    {
        if (this.isOpened)
            this.hide ();
        else
            this.show ();
    }

    // ===================================================================

    update ()
    {
        // Don't update unless the inventory is opened
        if (this.isOpened == false)
            return;

        this.playerInventoryUI.update ();
        if (this.otherInterface)
            this.otherInterface.update ();
    }

    // ===================================================================

    handleMouseDown (event)
    {
        // Determine what cell was clicked
        // assume we didnt press this inventory
        this.isPressing = false;
        // now try to disprove our assumption
        this.playerInventoryUI.handleMouseDown (event);
        if (this.otherInterface)
            this.otherInterface.handleMouseDown (event);
    }

    // ===================================================================

    handleMouseUp (event)
    {
        this.playerInventoryUI.handleMouseUp (event);
        if (this.otherInterface)
            this.otherInterface.handleMouseUp (event);

        // Ensure that the mouse was originally pressed here
        if (!this.isPressing)
            return;
        this.isPressing = false;
    }

    // ===================================================================

    handleMouseMove (event)
    {
        if (this.heldItemStackDOM)
        {
            // Cannot follow pointer exactly bc it will block mouse events
            const offset = 5;
            this.heldItemStackDOM.style.left = event.clientX + offset + 'px';
            this.heldItemStackDOM.style.top = event.clientY + offset + 'px';
        }
    }

    // ===================================================================

    swapHeldAndSlotItems (inventory, i, j, event)
    {
        console.log ("Swapping cell with hand");
        // swap mouse hand with cell
        let slotItem = inventory.getItemAt (i, j);
        let heldItem = this.heldItemStack;
        // combine item stacks if they are the same type
        if (slotItem != null
            && heldItem != null
            && slotItem.item.itemId == heldItem.item.itemId)
        {
            const itemId = slotItem.item.itemId;
            const maxCount = itemStaticData[itemId].maxStackSize;
            heldItem.amount += slotItem.amount;
            // ensure we didnt exceed max count
            if (heldItem.amount > maxCount)
            {
                slotItem.amount = heldItem.amount - maxCount;
                heldItem.amount = maxCount;
            }
            else
            {
                slotItem = null;
            }
        }
        // write out items
        inventory.swapItemAt (i, j, heldItem);
        // remove previously held item
        this.removeHeldItemDOM ();
        this.heldItemStack = slotItem;
        // create the held item stack that will follow the cursor
        this.createHeldItemDOM (event);
    }

    // ===================================================================

    placeSingleItemFromHand (inventory, i, j, event)
    {
        console.log ("Placing a single item");
        // ensure we have items to drop
        if (this.heldItemStack == null)
        {
            console.log ("Nothing to place");
            return;
        }
        // ensure the slot is empty or contains the same type of item
        // (and has space)
        const heldItemId = this.heldItemStack.item.itemId;
        const maxCount = itemStaticData[heldItemId].maxStackSize;
        let slotItem = inventory.getItemAt (i, j);
        const isSlotEmpty = slotItem == null;
        const doItemsMatch = !isSlotEmpty
            && slotItem.item.itemId == heldItemId;
        const isEnoughSpace = !isSlotEmpty && slotItem.amount < maxCount;
        if (isSlotEmpty || (doItemsMatch && isEnoughSpace))
        {
            // place one item from hand
            // create item stack with 1 item if it doesnt exist
            if (slotItem == null)
                inventory.swapItemAt (
                    i,
                    j,
                    new ItemStack (
                        new Item (this.heldItemStack.item.itemId),
                        1
                    )
                );
            // add one to cell
            else
                inventory.getItemAt (i, j).amount++;
            this.heldItemStack.amount--;
            // ensure hand is empty if we run out of items
            if (this.heldItemStack.amount <= 0)
            {
                this.heldItemStack = null;
                this.removeHeldItemDOM ();
            }
            // Just remove the dom element so we can update
            // the counter
            this.removeHeldItemDOM ();
            // create the held item stack that will follow the cursor
            this.createHeldItemDOM (event);
        }
    }

    // ===================================================================

    createHeldItemDOM (event)
    {
        // Ensure there is a held item to display
        if (this.heldItemStack == null)
            return;
        this.heldItemStackDOM = document.createElement ("div");
        this.heldItemStackDOM.className = "held-slot";
        // Cannot follow pointer exactly bc it will block mouse events
        const offset = 5;
        this.heldItemStackDOM.style.left = event.clientX + offset + 'px';
        this.heldItemStackDOM.style.top = event.clientY + offset + 'px';
        const itemId = this.heldItemStack.item.itemId;
        const img = document.createElement ("img");
        img.className = "inventory-icon";
        img.src = itemStaticData[itemId].texture;
        this.heldItemStackDOM.appendChild (img);
        const itemAmount = this.heldItemStack.amount;
        // Add item amount
        if (itemAmount > 1)
        {
            const amountDiv = document.createElement ("div");
            amountDiv.className = "inventory-amount";
            amountDiv.innerHTML = itemAmount.toString ();
            this.heldItemStackDOM.appendChild (amountDiv);
        }
        // Add item durability bar
        const hasUsages = this.heldItemStack.item.usages != null && this.heldItemStack.item.usages != 0;
        const durabilityMax = itemStaticData[itemId].toolDurabilityMax;
        const durabilityCurrent = this.heldItemStack.item.usages;
        const wasUsedAtLeastOnce = durabilityCurrent < durabilityMax;
        if (hasUsages && wasUsedAtLeastOnce)
        {
            const durabilityBarDiv = document.createElement ("div");
            durabilityBarDiv.className = "inventory-durability-bar";
            this.heldItemStackDOM.appendChild (durabilityBarDiv);
            const durabilityProgressDiv = document.createElement ("div");
            durabilityProgressDiv.className = "inventory-durability-progress";
            const durabilityRatio = durabilityCurrent / durabilityMax;
            durabilityProgressDiv.style.width = `${durabilityRatio*100}%`;
            if (durabilityRatio < 0.25)
                durabilityProgressDiv.style.backgroundColor = "red";
            else if (durabilityRatio < 0.5)
                durabilityProgressDiv.style.backgroundColor = "orange";
            else if (durabilityRatio < 0.75)
                durabilityProgressDiv.style.backgroundColor = "yellow";
            else if (durabilityRatio < 1.0)
                durabilityProgressDiv.style.backgroundColor = "lime";
            durabilityBarDiv.appendChild (durabilityProgressDiv);
        }
        document.getElementById ("inventory-container").appendChild (
            this.heldItemStackDOM
        );
    }

    // ===================================================================

    removeHeldItemDOM ()
    {
        if (this.heldItemStackDOM)
        {
            this.heldItemStackDOM.parentElement.removeChild (
                this.heldItemStackDOM
            );
            this.heldItemStackDOM = null;
        }
    }
}
