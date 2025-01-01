// Minecraft clone made with THREE.js
// Toolbar display
// By Amy Burnett
// =======================================================================
// Importing

import { itemStaticData } from "./itemData.js";

// =======================================================================

// Handles displaying the toolbar to the HUD
export class ToolbarDisplay
{
    constructor (player)
    {
        this.player = player;
    }

    // ===================================================================

    update ()
    {
        for (let i = 0; i < this.player.toolbarInventory.rows; ++i)
        {
            for (let j = 0; j < this.player.toolbarInventory.cols; ++j)
            {
                const slotItem = this.player.toolbarInventory.getItemAt (
                    i,
                    j
                );
                const slotDisplay = document.getElementById (
                    `toolbar-${j}`
                );
                slotDisplay.innerHTML = '';
                if (slotItem == null)
                    continue;
                const itemId = slotItem.item.itemId;
                const img = document.createElement ("img");
                img.className = "toolbar-icon";
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