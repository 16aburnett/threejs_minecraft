// Minecraft clone made with THREE.js
// Furnace interface
// By Amy Burnett
// =======================================================================
// Importing

import { itemStaticData } from "./itemData.js";

// =======================================================================

export class FurnaceUI
{
    constructor (parentUI, blockEntity)
    {
        this.parentUI = parentUI;
        this.blockEntity = blockEntity;

        this.isPressing = false;
        this.inventoryBeingPressed = null;
        this.slotBeingPressed = null;

        this.html = document.createElement ('div');
        this.html.className = "inventory-window-row";
        this.html.id = "furnace-interface";
        this.html.innerHTML = `
          <!-- Furnace interface -->
            <div class="furnace-inputs-container">
                <div class="furnace-smelt-input-container">
                    <div class="inventory-grid" id="furnace-smelt-input-inventory-grid">
                        <div class="inventory-row center-content">
                            <div class="inventory-slot" id="furnace-smelt-input-inventory-0-0"></div>
                        </div>
                    </div>
                </div>
                <div class="furnace-fuel-input-container">
                    <div class="inventory-grid" id="furnace-fuel-input-inventory-grid">
                        <div class="inventory-row center-content">
                            <div class="inventory-slot" id="furnace-fuel-input-inventory-0-0"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="furnace-middle-column">
                <div class="furnace-fuel-bar-container">
                    <!-- dummy row --!>
                </div>
                <div id="furnace-arrow-container">
                    <img id="furnace-progress-arrow-image" src="assets/progress_arrow_0.png">
                </div>
                <div class="furnace-fuel-bar-container">
                    <div class="furnace-fuel-bar">
                        <div class="furnace-fuel-progress" id="furnace-fuel-progress">Fuel</div>
                    </div>
                </div>
            </div>
            <div class="furnace-output-container">
              <div class="inventory-grid" id="furnace-output-inventory-grid">
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="furnace-output-inventory-0-0"></div>
                </div>
              </div>
            </div>
          `;
    }

    // ===================================================================

    update ()
    {
        const inventories = [
            this.blockEntity.data.smeltInputInventory,
            this.blockEntity.data.fuelInputInventory,
            this.blockEntity.data.outputInventory,
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "<ERROR>";
            if (inventory == this.blockEntity.data.smeltInputInventory)
                inventoryName = "furnace-smelt-input";
            else if (inventory == this.blockEntity.data.fuelInputInventory)
                inventoryName = "furnace-fuel-input";
            else if (inventory == this.blockEntity.data.outputInventory)
                inventoryName = "furnace-output";
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

        // Update smelting progress bar
        // subtracting from 1.0 bc smelt time ticks down,
        // but we want tick up for progress
        let progressRatio = 1.0 - this.blockEntity.data.currentSmeltTimeLeft / this.blockEntity.data.maxSmeltTime;
        // Adjust for division by zero
        if (this.blockEntity.data.maxSmeltTime <= 0.0)
            progressRatio = 0.0;
        const progressImages = [
            "assets/progress_arrow_0.png",
            "assets/progress_arrow_1.png",
            "assets/progress_arrow_2.png",
            "assets/progress_arrow_3.png",
            "assets/progress_arrow_4.png",
            "assets/progress_arrow_5.png",
            "assets/progress_arrow_6.png",
            "assets/progress_arrow_7.png",
            "assets/progress_arrow_8.png",
            "assets/progress_arrow_9.png",
            "assets/progress_arrow_10.png",
            "assets/progress_arrow_11.png",
            "assets/progress_arrow_12.png",
            "assets/progress_arrow_13.png",
            "assets/progress_arrow_14.png",
            "assets/progress_arrow_15.png",
            "assets/progress_arrow_16.png",
        ];
        const index = Math.min (Math.floor (progressRatio * 16), 16);
        document.getElementById ("furnace-progress-arrow-image").src = progressImages[index];

        // Update fuel progress bar
        let fuelLeftRatio = this.blockEntity.data.currentFuelTimeLeft / this.blockEntity.data.maxFuelTime;
        // Adjust for division by zero
        if (this.blockEntity.data.maxFuelTime <= 0.0)
            fuelLeftRatio = 0.0;
        document.getElementById ("furnace-fuel-progress").style.width = fuelLeftRatio * 100.0 + "%";
    }

    // ===================================================================

    handleMouseDown (event)
    {
        // Determine what cell was clicked
        // assume we didnt press this inventory
        this.isPressing = false;
        // now try to disprove our assumption
        const inventories = [
            this.blockEntity.data.smeltInputInventory,
            this.blockEntity.data.fuelInputInventory,
            this.blockEntity.data.outputInventory,
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "<ERROR>";
            if (inventory == this.blockEntity.data.smeltInputInventory)
                inventoryName = "furnace-smelt-input";
            else if (inventory == this.blockEntity.data.fuelInputInventory)
                inventoryName = "furnace-fuel-input";
            else if (inventory == this.blockEntity.data.outputInventory)
                inventoryName = "furnace-output";
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
            this.blockEntity.data.smeltInputInventory,
            this.blockEntity.data.fuelInputInventory,
            this.blockEntity.data.outputInventory,
        ];
        for (const inventory of inventories)
        {
            let inventoryName = "<ERROR>";
            if (inventory == this.blockEntity.data.smeltInputInventory)
                inventoryName = "furnace-smelt-input";
            else if (inventory == this.blockEntity.data.fuelInputInventory)
                inventoryName = "furnace-fuel-input";
            else if (inventory == this.blockEntity.data.outputInventory)
                inventoryName = "furnace-output";
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
                        // Handle click on output
                        if (inventory == this.blockEntity.data.outputInventory)
                        {
                            console.log ("Clicked on furnace output");
                            this.pickUpFurnaceOutputItem (event);
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
                        if (inventory == this.blockEntity.data.outputInventory)
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
    }

    // ===================================================================

    pickUpFurnaceOutputItem (event)
    {
        const outputItem = this.blockEntity.data.outputInventory.getItemAt (0, 0);

        // Ensure there is an item to pick up
        if (outputItem == null)
            return;

        // Ensure player has space in hand for output items
        const hasItem = this.parentUI.heldItemStack != null;
        const has_diff_item = hasItem && this.parentUI.heldItemStack.item.itemId != outputItem.item.itemId;
        const has_not_enough_stack_space = hasItem && !has_diff_item && (this.parentUI.heldItemStack.amount + outputItem.amount > itemStaticData[this.parentUI.heldItemStack.item.itemId].maxStackSize);
        if (has_diff_item || has_not_enough_stack_space)
            return;

        // Add output item to hand
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

        // Remove output item from output slot
        this.blockEntity.data.outputInventory.swapItemAt (0, 0, null);
    }
}
