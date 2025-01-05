// Minecraft clone made with THREE.js
// Chest interface
// By Amy Burnett
// =======================================================================
// Importing

import { itemStaticData } from "./itemData.js";

// =======================================================================

export class ChestUI
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
        this.html.id = "chest-interface";
        this.html.innerHTML = `
          <!-- Chest interface -->
            <div class="chest-container">
              <div class="inventory-grid" id="chest-inventory-grid">
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="chest-inventory-0-0"></div>
                  <div class="inventory-slot" id="chest-inventory-0-1"></div>
                  <div class="inventory-slot" id="chest-inventory-0-2"></div>
                  <div class="inventory-slot" id="chest-inventory-0-3"></div>
                  <div class="inventory-slot" id="chest-inventory-0-4"></div>
                  <div class="inventory-slot" id="chest-inventory-0-5"></div>
                  <div class="inventory-slot" id="chest-inventory-0-6"></div>
                  <div class="inventory-slot" id="chest-inventory-0-7"></div>
                  <div class="inventory-slot" id="chest-inventory-0-8"></div>
                </div>
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="chest-inventory-1-0"></div>
                  <div class="inventory-slot" id="chest-inventory-1-1"></div>
                  <div class="inventory-slot" id="chest-inventory-1-2"></div>
                  <div class="inventory-slot" id="chest-inventory-1-3"></div>
                  <div class="inventory-slot" id="chest-inventory-1-4"></div>
                  <div class="inventory-slot" id="chest-inventory-1-5"></div>
                  <div class="inventory-slot" id="chest-inventory-1-6"></div>
                  <div class="inventory-slot" id="chest-inventory-1-7"></div>
                  <div class="inventory-slot" id="chest-inventory-1-8"></div>
                </div>
                <div class="inventory-row center-content">
                  <div class="inventory-slot" id="chest-inventory-2-0"></div>
                  <div class="inventory-slot" id="chest-inventory-2-1"></div>
                  <div class="inventory-slot" id="chest-inventory-2-2"></div>
                  <div class="inventory-slot" id="chest-inventory-2-3"></div>
                  <div class="inventory-slot" id="chest-inventory-2-4"></div>
                  <div class="inventory-slot" id="chest-inventory-2-5"></div>
                  <div class="inventory-slot" id="chest-inventory-2-6"></div>
                  <div class="inventory-slot" id="chest-inventory-2-7"></div>
                  <div class="inventory-slot" id="chest-inventory-2-8"></div>
                </div>
              </div>
            </div>
          `;
    }

    // ===================================================================

    update ()
    {
        const inventory = this.blockEntity.data.inventory;
        const inventoryName = "chest";
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

    // ===================================================================

    handleMouseDown (event)
    {
        // Determine what cell was clicked
        // assume we didnt press this inventory
        this.isPressing = false;
        // now try to disprove our assumption
        const inventory = this.blockEntity.data.inventory;
        const inventoryName = "chest";
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

    // ===================================================================

    handleMouseUp (event)
    {
        // Ensure that the mouse was originally pressed here
        if (!this.isPressing)
            return;
        this.isPressing = false;

        const inventory = this.blockEntity.data.inventory;
        const inventoryName = "chest";
        // Ensure it is the matching inventory
        if (inventory != this.inventoryBeingPressed)
            return;
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
                    this.parentUI.swapHeldAndSlotItems (
                        inventory,
                        i,
                        j,
                        event
                    );
                }
                // Right click
                else if (event.button == 2)
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
