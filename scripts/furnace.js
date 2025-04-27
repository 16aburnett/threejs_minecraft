// Minecraft clone made with THREE.js
// Logic for the interactable furnance block
// By Amy Burnett
// =======================================================================
// Importing

import { BlockEntity } from "./blockEntity.js";
import { Item } from "./item.js";
import { itemStaticData } from "./itemData.js";
import { ItemId } from "./itemId.js";
import { ItemStack } from "./itemStack.js";

// =======================================================================

// Constant for the time it takes to smelt 1 item
// This is static for every type of smeltable item - similar to minecraft
// But it might be interesting to explore different smelt times for different items
const SMELT_TIME = 10.0;

// =======================================================================

/**
 * Handles the updates for a given furnace
 * @param {BlockEntity} entity the block entity for the given furnace to update
 * @param {number} deltaTime the change in time since last frame (in seconds)
 */
export function updateFurnace (entity, deltaTime)
{
    // Continue smelting
    const doneSmelting = entity.data.currentSmeltTimeLeft <= 0.0;
    if (entity.data.isSmelting && !doneSmelting)
    {
        continueSmelting (entity, deltaTime);
    }
    // Smelting finished - complete the smelt
    if (entity.data.isSmelting && doneSmelting)
    {
        finishSmelting (entity, deltaTime);
    }
    // Try to start a new smelt
    const hasFuel = entity.data.currentFuelTimeLeft > 0.0;
    if (!entity.data.isSmelting && hasFuel)
    {
        startSmelting (entity, deltaTime);
    }
    // Deplete current fuel
    if (hasFuel)
        entity.data.currentFuelTimeLeft -= deltaTime;
    // Try to add more fuel if furnace ran out
    if (entity.data.currentFuelTimeLeft <= 0.0)
    {
        addFuel (entity, deltaTime);
    }
}

// =======================================================================

function startSmelting (entity, deltaTime)
{
    // Ensure there is an item to smelt
    const smeltInputItem = entity.data.smeltInputInventory.getItemAt (0, 0)?.item?.itemId;
    if (!smeltInputItem)
        return;
    // Ensure that item can be smelted
    const resultingItem = itemStaticData[smeltInputItem].smeltsInto;
    if (resultingItem == undefined)
        return;
    // Ensure that if this item smelted, that there is space in the output
    const itemStackInOutput = entity.data.outputInventory.getItemAt (0, 0);
    const isAnItemInOutput = itemStackInOutput != null;
    const isOutputItemDifferent = isAnItemInOutput ? itemStackInOutput.item.itemId != resultingItem : true;
    const isOutputItemStackFull = isAnItemInOutput ?
        itemStackInOutput.amount >= itemStaticData[itemStackInOutput.item.itemId].maxStackSize
        : false;
    if (isAnItemInOutput && (isOutputItemDifferent || isOutputItemStackFull))
        return;
    // Start smelting
    entity.data.isSmelting = true;
    entity.data.currentSmeltTimeLeft = SMELT_TIME;
    entity.data.maxSmeltTime = SMELT_TIME;
    entity.data.itemBeingSmelted = smeltInputItem;
}

// =======================================================================

function continueSmelting (entity, deltaTime)
{
    // Ensure item did not change
    const smeltInputItem = entity.data.smeltInputInventory.getItemAt (0, 0)?.item?.itemId;
    const itemChanged = entity.data.itemBeingSmelted != smeltInputItem;
    if (itemChanged)
    {
        // Stop smelting
        stopSmelting (entity, deltaTime);
        return;
    }
    entity.data.currentSmeltTimeLeft -= deltaTime;
}

// =======================================================================

function finishSmelting (entity, deltaTime)
{
    const smeltInputItem = entity.data.smeltInputInventory.getItemAt (0, 0)?.item?.itemId;
    // Ensure item did not change
    const itemChanged = entity.data.itemBeingSmelted != smeltInputItem;
    if (itemChanged)
    {
        // Stop smelting
        stopSmelting (entity, deltaTime);
        return;
    }
    const resultingItem = itemStaticData[smeltInputItem].smeltsInto;
    // Consume input item
    entity.data.smeltInputInventory.decrementItemAt (0, 0);
    // Output smelted item
    entity.data.outputInventory.addItem (new ItemStack (new Item (resultingItem), 1));
    // Stop smelting
    stopSmelting (entity, deltaTime);
}

// =======================================================================

function stopSmelting (entity, deltaTime)
{
    entity.data.isSmelting = false;
    entity.data.currentSmeltTimeLeft = 0.0;
    entity.data.maxSmeltTime = 0.0;
    entity.data.itemBeingSmelted = null;
}

// =======================================================================

function addFuel (entity, deltaTime)
{
    // Ensure fuel input item is a valid fuel source
    const fuelInputItemStack = entity.data.fuelInputInventory.getItemAt (0, 0);
    const isValidFuel = fuelInputItemStack ? itemStaticData[fuelInputItemStack.item.itemId].fuelTime : false;
    if (fuelInputItemStack == null || !isValidFuel)
    {
        entity.data.currentFuelTimeLeft = 0.0;
        entity.data.maxFuelTime = 0.0;
        stopSmelting (entity, deltaTime);
        return;
    }
    // Add fuel from item
    const fuelTime = itemStaticData[fuelInputItemStack.item.itemId].fuelTime;
    entity.data.currentFuelTimeLeft = fuelTime;
    entity.data.maxFuelTime = fuelTime;
    // Consume the item from the input
    entity.data.fuelInputInventory.decrementItemAt (0, 0);
}
