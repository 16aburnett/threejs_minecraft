// Minecraft clone made with THREE.js
// Static data for defining different mobs
// By Amy Burnett
// =======================================================================
// Importing

import { ItemId } from "./itemId.js";
import { MobId } from "./mobId.js";
import { loadAnimatedModel } from "./modelLoading.js";

// =======================================================================

// Note: order must match enum order
export const mobStaticData = [
    {
        id: MobId.Cow,
        baseHealth: 10,
        width: 0.9,
        height: 1.4,
        getModel: (caller) => {return loadAnimatedModel ("assets/models/entity_cow.gltf", caller)},
        itemToDrop: ItemId.Diamond,
    },
    {
        id: MobId.Chicken,
        baseHealth: 5,
        width: 0.4,
        height: 0.7,
        getModel: (caller) => {return loadAnimatedModel ("assets/models/entity_chicken.gltf", caller)},
        itemToDrop: ItemId.Stick,
    }
];