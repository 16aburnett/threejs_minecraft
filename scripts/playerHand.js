// Minecraft clone made with THREE.js
// Handles the player's hand for displaying held item and arm animations.
// By Amy Burnett
// =======================================================================
// Importing

import * as THREE from 'three';
import { itemStaticData } from './itemData.js';

// =======================================================================

export const HandAnimation = {
    Idle: 0,
    Mining: 1,
    Placing: 2
};

// =======================================================================

export class PlayerHand extends THREE.Group
{
    constructor ()
    {
        super ();

        // Hand mesh
        const geometry = new THREE.BoxGeometry (0.33, 0.5, 1.0);
        const material = new THREE.MeshStandardMaterial (
            {color: 0xffffff, depthTest: false}
        );
        this.handMesh = new THREE.Mesh (geometry, material);
        this.handMesh.position.set (0.5, -1.0, -1.0);
        this.handMesh.rotation.x = Math.PI / 4;
        this.add (this.handMesh);

        this.animation = HandAnimation.Idle;
        this.animationStart = 0;
        this.animationSpeed = 0.025;
        this.animationDuration = 100.0;
        this.animationAmplitude = 0.5;
        
        this.heldItem = -1;
        this.heldItemMesh = undefined;
    }

    // ===================================================================

    update ()
    {
        if (this.animation == HandAnimation.Idle)
        {
            this.rotation.x = 0;
        }
        else if (this.animation == HandAnimation.Mining)
        {
            this.rotation.x = this.animationAmplitude * Math.sin (
                this.getAnimationTime () * this.animationSpeed
            );
        }
        else if (this.animation == HandAnimation.Placing)
        {
            this.rotation.x = this.animationAmplitude * Math.sin (
                this.getAnimationTime () * this.animationSpeed
            );
            // Placing is an instantaneous animation
            // so we are responsible for stopping it
            if (this.getAnimationTime () >= this.animationDuration)
            {
                this.setAnimation (HandAnimation.Idle);
            }
        }
    }

    // ===================================================================

    updateHeldItem (itemId)
    {
        // Ensure item changed
        if (this.heldItem == itemId)
            return;
        // Remove previously held item
        this.clear ();
        // Create the new item
        this.heldItem = itemId;
        this.heldItemMesh = itemStaticData[itemId].getModel ();
        this.add (this.heldItemMesh);
        // Position the item to the bottom right of the camera
        this.heldItemMesh.position.set (0, -0.5, -0.5);
        this.heldItemMesh.rotation.set (0, Math.PI * 0.5, 0);
        this.heldItemMesh.scale.set (0.5, 0.5, 0.5);
    }

    // ===================================================================

    removeHeldItem ()
    {
        this.clear ();
        this.add (this.handMesh);
        this.heldItem = -1;
    }

    // ===================================================================

    setAnimation (animation)
    {
        this.animation = animation;
        this.animationStart = performance.now ();
    }

    // ===================================================================

    getAnimationTime ()
    {
        return performance.now () - this.animationStart;
    }
}