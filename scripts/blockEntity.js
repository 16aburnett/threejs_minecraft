// Minecraft clone made with THREE.js
// Block entities - data for associated blocks in the world
// By Amy Burnett
// =======================================================================
// Importing

import * as THREE from 'three';

// =======================================================================

/**
 * BlockEntity represents any extra data that may be associated with a
 * Block beyond what is stored statically and beyond block states.
 * Note: this is a THREE.Group so that it is compatible with other entities
 * Currently, BlockEntities have no meshes.
 */
export class BlockEntity extends THREE.Group
{
    /**
     * Constructs a Block Entity
     * @param {Object} dataObject - the data to store for the given block
     * entity
     */
    constructor (dataObject, updateFunction = null)
    {
        super ();
        this.data = dataObject;
        this.parentChunk = null;
        this.isPhysicsEntity = false;
        this.updateFunction = updateFunction;
    }

    // ===================================================================

    /**
     * Handles per-frame updates to this entity
     */
    update (deltaTime)
    {
        if (this.updateFunction)
            this.updateFunction (this, deltaTime);
    }

}
