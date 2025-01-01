// Minecraft clone made with THREE.js
// Inventory display
// By Amy Burnett
// =======================================================================
// Importing

import { getCraftingOutputItemStack } from "./crafting.js";
import { Item } from "./item.js";
import { itemStaticData } from "./itemData.js";
import { ItemStack } from "./itemStack.js";

// =======================================================================

// Handles displaying and the user interaction with the inventory
export class InventoryDisplay
{
    constructor (player)
    {
        this.player = player;

        this.isPressing = false;
        this.inventoryBeingPressed = null;
        this.slotBeingPressed = null;
        this.heldItemStack = null;
        this.heldItemStackDOM = null;
    }

    // ===================================================================

    show ()
    {
        console.log ("showing inventory");
        document.getElementById ("inventory-container").style.display
            = "flex";
    }

    // ===================================================================

    hide ()
    {
        console.log ("hiding inventory");
        document.getElementById ("inventory-container").style.display
            = "none";
    }

    // ===================================================================

    update ()
    {
        const inventories = [
            this.player.mainInventory,
            this.player.toolbarInventory,
            this.player.craftingInputInventory,
            this.player.craftingOutputInventory
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.player.mainInventory)
                inventoryName = "main";
            else if (inventory == this.player.craftingInputInventory)
                inventoryName = "crafting-input";
            else if (inventory == this.player.craftingOutputInventory)
                inventoryName = "crafting-output"
            for (let i = 0; i < inventory.rows; ++i)
            {
                for (let j = 0; j < inventory.cols; ++j)
                {
                    const slotItem = inventory.getItemAt (
                        i,
                        j
                    );
                    const slotDisplay = document.getElementById (
                        `${inventoryName}-inventory-${i}-${j}`
                    );
                    slotDisplay.innerHTML = '';
                    if (slotItem == null)
                        continue;
                    const itemId = slotItem.item.itemId;
                    const img = document.createElement ("img");
                    img.className = "inventory-icon";
                    img.src = itemStaticData[itemId].texture;
                    slotDisplay.appendChild (img);
                    const itemAmount = slotItem.amount;
                    // Add item amount
                    if (itemAmount > 1)
                    {
                        const amountDiv = document.createElement ("div");
                        amountDiv.className = "inventory-amount";
                        amountDiv.innerHTML = itemAmount.toString ();
                        slotDisplay.appendChild (amountDiv);
                    }
                    // Add item durability bar
                    const hasUsages = slotItem.item.usages != null && slotItem.item.usages != 0;
                    const durabilityMax = itemStaticData[itemId].toolDurabilityMax;
                    const durabilityCurrent = slotItem.item.usages;
                    const wasUsedAtLeastOnce = durabilityCurrent < durabilityMax;
                    if (hasUsages && wasUsedAtLeastOnce)
                    {
                        const durabilityBarDiv = document.createElement ("div");
                        durabilityBarDiv.className = "inventory-durability-bar";
                        slotDisplay.appendChild (durabilityBarDiv);
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
                }
            }
        }
    }

    // ===================================================================

    handleMouseDown (event)
    {
        // Determine what cell was clicked
        // assume we didnt press this inventory
        this.isPressing = false;
        // now try to disprove our assumption
        const inventories = [
            this.player.mainInventory,
            this.player.toolbarInventory,
            this.player.craftingInputInventory,
            this.player.craftingOutputInventory
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.player.mainInventory)
                inventoryName = "main"
            else if (inventory == this.player.craftingInputInventory)
                inventoryName = "crafting-input"
            else if (inventory == this.player.craftingOutputInventory)
                inventoryName = "crafting-output"
            for (let i = 0; i < inventory.rows; ++i)
            {
                for (let j = 0; j < inventory.cols; ++j)
                {
                    const slotDOM = document.getElementById (
                        `${inventoryName}-inventory-${i}-${j}`
                    );
                    // Ensure this slot was released on
                    const wasPressed = event.target == slotDOM;
                    const wasChildPressed = slotDOM.contains (
                        event.target
                    );
                    if (!wasPressed && !wasChildPressed)
                        continue;

                    this.isPressing = true;
                    this.inventoryBeingPressed = inventory;
                    this.slotBeingPressed = [i, j];
                    console.log (
                        "Pressed slot with",
                        inventory.getItemAt (i, j)
                    );
                }
            }
        }
    }

    // ===================================================================

    handleMouseUp (event)
    {
        // Ensure that the mouse was originally pressed here
        if (!this.isPressing)
            return;
        this.isPressing = false;
        const inventories = [
            this.player.mainInventory,
            this.player.toolbarInventory,
            this.player.craftingInputInventory,
            this.player.craftingOutputInventory
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.player.mainInventory)
                inventoryName = "main"
            else if (inventory == this.player.craftingInputInventory)
                inventoryName = "crafting-input"
            else if (inventory == this.player.craftingOutputInventory)
                inventoryName = "crafting-output"
            // Ensure it is the matching inventory
            if (inventory != this.inventoryBeingPressed)
                continue;
            for (let i = 0; i < inventory.rows; ++i)
            {
                for (let j = 0; j < inventory.cols; ++j)
                {
                    const slotDOM = document.getElementById (
                        `${inventoryName}-inventory-${i}-${j}`
                    );
                    // Ensure this slot was released on
                    const wasPressed = event.target == slotDOM;
                    const wasChildPressed = slotDOM.contains (
                        event.target
                    );
                    if (!wasPressed && !wasChildPressed)
                        continue;
                    // Ensure that this is the same slot that was pressed
                    const [pressI, pressJ] = this.slotBeingPressed;
                    if (pressI != i || pressJ != j)
                        // stop checking since you can only release on
                        // one slot
                        break;
                    // Left click
                    if (event.button == 0)
                    {
                        // Handle click on crafting output
                        if (inventory == this.player.craftingOutputInventory)
                        {
                            console.log ("Clicked on crafting output");
                            this.pickUpCraftingOutputItem (event);
                        }
                        // other inventories
                        else
                        {
                            this.swapHeldAndSlotItems (
                                inventory,
                                i,
                                j,
                                event
                            );
                        }
                    }
                    // Right click
                    else if (event.button == 2)
                    {
                        // Handle click on crafting output
                        if (inventory == this.player.craftingOutputInventory)
                        {
                            // Nothing
                        }
                        // other inventories
                        else
                        {
                            this.placeSingleItemFromHand (
                                inventory,
                                i,
                                j,
                                event
                            );
                        }
                    }
                }
            }
        }

        // Since mouse was released, update the crafting output
        // In case we updated the input
        const inputGrid = this.player.craftingInputInventory.get2DArray ();
        const outputItemStack = getCraftingOutputItemStack (inputGrid);
        this.player.craftingOutputInventory.swapItemAt (
            0,
            0,
            outputItemStack
        );
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

    // ===================================================================

    pickUpCraftingOutputItem (event)
    {
        // const outputItem = this.player.craftingOutputInventory.getItemAt (0, 0);

        // Ensure it is a valid crafting recipe
        const outputItem = getCraftingOutputItemStack (this.player.craftingInputInventory.get2DArray ());
        if (outputItem == null)
            return;

        // Ensure player has space in hand for crafted items
        const hasItem = this.heldItemStack != null;
        const has_diff_item = hasItem && this.heldItemStack.item.itemId != outputItem.item.itemId;
        const has_not_enough_stack_space = hasItem && !has_diff_item && (this.heldItemStack.amount + outputItem.amount > itemStaticData[this.heldItemStack.item.itemId].maxStackSize);
        if (has_diff_item || has_not_enough_stack_space)
            return;

        // Consume the crafting input items
        for (let i = 0; i < this.player.craftingInputInventory.numSlots; ++i)
        {
            if (this.player.craftingInputInventory.slots[i] != null)
            {
                // decrement item count
                --this.player.craftingInputInventory.slots[i].amount;
                // ensure item is removed if it ran out of items
                if (this.player.craftingInputInventory.slots[i].amount <= 0)
                    this.player.craftingInputInventory.slots[i] = null;
            }
        }

        // Add crafting output item to hand
        if (this.heldItemStack == null)
        {
            this.heldItemStack = outputItem.copy ();
            this.removeHeldItemDOM ();
            // create the held item stack that will follow the cursor
            this.createHeldItemDOM (event);
        }
        // or coalesce stacks
        else
        {
            this.heldItemStack.amount += outputItem.amount;
            this.removeHeldItemDOM ();
            // create the held item stack that will follow the cursor
            this.createHeldItemDOM (event);
        }

        // Remove crafting output item from output slot
        this.player.craftingOutputInventory.swapItemAt (0, 0, null);
    }
}