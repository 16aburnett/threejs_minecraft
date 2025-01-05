// Minecraft clone made with THREE.js
// Crafting table UI
// By Amy Burnett
// =======================================================================
// Importing

import { getCraftingOutputItemStack } from "./crafting.js";
import { Inventory } from "./inventory.js";
import { itemStaticData } from "./itemData.js";

// =======================================================================

export class CraftingTableUI
{
    constructor (parentUI)
    {
        this.parentUI = parentUI;

        this.isPressing = false;
        this.inventoryBeingPressed = null;
        this.slotBeingPressed = null;

        // Crafting tables
        this.isCraftingTable = false;
        this.craftingTableInputInventory = new Inventory (3, 3);
        this.craftingTableOutputInventory = new Inventory (1, 1);

        this.html = document.createElement ('div');
        this.html.className = "inventory-window-row";
        this.html.id = "crafting-table-display";
        this.html.innerHTML = `
          <!-- Crafting table interface -->
            <div class="crafting-table-container">
              <div class="inventory-grid" id="crafting-input-inventory-grid">
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="crafting-table-input-inventory-0-0"></div>
                  <div class="inventory-slot" id="crafting-table-input-inventory-0-1"></div>
                  <div class="inventory-slot" id="crafting-table-input-inventory-0-2"></div>
                </div>
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="crafting-table-input-inventory-1-0"></div>
                  <div class="inventory-slot" id="crafting-table-input-inventory-1-1"></div>
                  <div class="inventory-slot" id="crafting-table-input-inventory-1-2"></div>
                </div>
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="crafting-table-input-inventory-2-0"></div>
                  <div class="inventory-slot" id="crafting-table-input-inventory-2-1"></div>
                  <div class="inventory-slot" id="crafting-table-input-inventory-2-2"></div>
                </div>
              </div>
            </div>
            <div id="crafting-arrow-container">
              <img id="crafting-arrow-image" src="assets/crafting_arrow.png">
            </div>
            <div id="crafting-output-container">
              <div class="inventory-grid" id="crafting-output-inventory-grid">
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="crafting-table-output-inventory-0-0"></div>
                </div>
              </div>
            </div>
          `;
    }

    // ===================================================================

    update ()
    {
        const inventories = [
            this.craftingTableInputInventory,
            this.craftingTableOutputInventory
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.craftingTableInputInventory)
                inventoryName = "crafting-table-input";
            else if (inventory == this.craftingTableOutputInventory)
                inventoryName = "crafting-table-output"
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
            this.craftingTableInputInventory,
            this.craftingTableOutputInventory
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.craftingTableInputInventory)
                inventoryName = "crafting-table-input";
            else if (inventory == this.craftingTableOutputInventory)
                inventoryName = "crafting-table-output"
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
            this.craftingTableInputInventory,
            this.craftingTableOutputInventory
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "toolbar";
            if (inventory == this.craftingTableInputInventory)
                inventoryName = "crafting-table-input";
            else if (inventory == this.craftingTableOutputInventory)
                inventoryName = "crafting-table-output"
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
                        if (inventory == this.craftingTableOutputInventory)
                        {
                            console.log ("Clicked on crafting table output");
                            this.pickUpCraftingTableOutputItem (event);
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
                        if (inventory == this.craftingTableOutputInventory)
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
        const craftingInputGrid = this.craftingTableInputInventory.get2DArray ();
        const craftingOutputStack = getCraftingOutputItemStack (craftingInputGrid);
        this.craftingTableOutputInventory.swapItemAt (0, 0, craftingOutputStack);
    }

    // ===================================================================

    pickUpCraftingTableOutputItem (event)
    {
        // const outputItem = this.player.craftingOutputInventory.getItemAt (0, 0);

        // Ensure it is a valid crafting recipe
        const outputItem = getCraftingOutputItemStack (this.craftingTableInputInventory.get2DArray ());
        if (outputItem == null)
            return;

        // Ensure player has space in hand for crafted items
        const hasItem = this.parentUI.heldItemStack != null;
        const has_diff_item = hasItem && this.parentUI.heldItemStack.item.itemId != outputItem.item.itemId;
        const has_not_enough_stack_space = hasItem && !has_diff_item && (this.parentUI.heldItemStack.amount + outputItem.amount > itemStaticData[this.parentUI.heldItemStack.item.itemId].maxStackSize);
        if (has_diff_item || has_not_enough_stack_space)
            return;

        // Consume the crafting input items
        for (let i = 0; i < this.craftingTableInputInventory.numSlots; ++i)
        {
            if (this.craftingTableInputInventory.slots[i] != null)
            {
                // decrement item count
                --this.craftingTableInputInventory.slots[i].amount;
                // ensure item is removed if it ran out of items
                if (this.craftingTableInputInventory.slots[i].amount <= 0)
                    this.craftingTableInputInventory.slots[i] = null;
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
        this.craftingTableOutputInventory.swapItemAt (0, 0, null);
    }
}
