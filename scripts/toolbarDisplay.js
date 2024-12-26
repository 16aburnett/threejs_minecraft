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
                // Ensure there is > 1 item
                if (itemAmount > 1)
                {
                    const amountDiv = document.createElement ("div");
                    amountDiv.className = "toolbar-amount";
                    amountDiv.innerHTML = itemAmount.toString ();
                    slotDisplay.appendChild (amountDiv);
                }
            }
        }
    }
}