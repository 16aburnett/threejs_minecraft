// Minecraft clone made with THREE.js
// Player's header inventory UI: Armor, Player Display, Mini Crafting Grid
// By Amy Burnett
// =======================================================================
// Importing

import { getCraftingOutputItemStack } from "./crafting.js";
import { itemStaticData } from "./itemData.js";

// =======================================================================

export class PlayerHeaderUI
{
    constructor (parentUI, player)
    {
        this.parentUI = parentUI;
        this.player = player;

        this.isPressing = false;
        this.inventoryBeingPressed = null;
        this.slotBeingPressed = null;

        this.isOpened = false;

        this.html = document.createElement ('div');
        this.html.className = "inventory-window-row";
        this.html.innerHTML = `
        <!-- Main Inventory Header block -->
            <div class="inventory-half">

            </div>
            <div class="inventory-half">
              <div id="crafting-input-container">
                <div class="inventory-grid" id="crafting-input-inventory-grid">
                  <div class="inventory-row center-content">
                    <div class="inventory-slot" id="crafting-input-inventory-0-0"></div>
                    <div class="inventory-slot" id="crafting-input-inventory-0-1"></div>
                  </div>
                  <div class="inventory-row center-content">
                    <div class="inventory-slot" id="crafting-input-inventory-1-0"></div>
                    <div class="inventory-slot" id="crafting-input-inventory-1-1"></div>
                  </div>
                </div>
              </div>
              <div id="crafting-arrow-container">
                <img id="crafting-arrow-image" src="assets/progress_arrow_0.png">
              </div>
              <div id="crafting-output-container">
                <div class="inventory-grid" id="crafting-output-inventory-grid">
                  <div class="inventory-row center-content">
                    <div class="inventory-slot" id="crafting-output-inventory-0-0"></div>
                  </div>
                </div>
              </div>
            </div>
        `;
    }

    // ===================================================================

    update ()
    {
        const inventories = [
            this.player.craftingInputInventory,
            this.player.craftingOutputInventory
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.player.craftingInputInventory)
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

        const inventories = [
            this.player.craftingInputInventory,
            this.player.craftingOutputInventory,
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.player.craftingInputInventory)
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
            this.player.craftingInputInventory,
            this.player.craftingOutputInventory,
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.player.craftingInputInventory)
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
                            this.parentUI.swapHeldAndSlotItems (
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
                            this.parentUI.placeSingleItemFromHand (
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

    pickUpCraftingOutputItem (event)
    {
        // const outputItem = this.player.craftingOutputInventory.getItemAt (0, 0);

        // Ensure it is a valid crafting recipe
        const outputItem = getCraftingOutputItemStack (this.player.craftingInputInventory.get2DArray ());
        if (outputItem == null)
            return;

        // Ensure player has space in hand for crafted items
        const hasItem = this.parentUI.heldItemStack != null;
        const has_diff_item = hasItem && this.parentUI.heldItemStack.item.itemId != outputItem.item.itemId;
        const has_not_enough_stack_space = hasItem && !has_diff_item && (this.parentUI.heldItemStack.amount + outputItem.amount > itemStaticData[this.parentUI.heldItemStack.item.itemId].maxStackSize);
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
        if (this.parentUI.heldItemStack == null)
        {
            this.parentUI.heldItemStack = outputItem.copy ();
            this.parentUI.removeHeldItemDOM ();
            // create the held item stack that will follow the cursor
            this.parentUI.createHeldItemDOM (event);
        }
        // or coalesce stacks
        else
        {
            this.parentUI.heldItemStack.amount += outputItem.amount;
            this.parentUI.removeHeldItemDOM ();
            // create the held item stack that will follow the cursor
            this.parentUI.createHeldItemDOM (event);
        }

        // Remove crafting output item from output slot
        this.player.craftingOutputInventory.swapItemAt (0, 0, null);
    }
}
