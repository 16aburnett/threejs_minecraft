// Minecraft clone made with THREE.js
// Simple player class
// By Amy Burnett
// November 16, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { isKeyDown } from './controls.js';
import { BlockId, blockData } from './blockData.js'
import { Inventory } from './inventory.js';
import { ItemStack } from './itemStack.js';
import { Item } from './item.js';
import { ItemId } from './itemData.js';

// =======================================================================
// Global variables

const GRAVITY_ACCELERATION = 20;
const TERMINAL_VELOCITY = 50;

export const CameraViewMode = Object.freeze ({
    FIRST_PERSON: Symbol ("FIRST_PERSON"),
    THIRD_PERSON: Symbol ("THIRD_PERSON")
});

export const PlayerControlMode = Object.freeze ({
    NORMAL: Symbol ("NORMAL"),
    FLYING: Symbol ("FLYING"),
    NOCLIP: Symbol ("NOCLIP")
});

let CENTER_OF_SCREEN = new THREE.Vector2 ();

// =======================================================================

export default class Player extends THREE.Group
{
    constructor (scene, world)
    {
        super ();

        // save reference to the world
        // this is ad hoc and I hate it but doing it to make progress
        // for now.
        this.world = world;

        // Player's local axes
        this.up      = new THREE.Vector3 (0, 1, 0);
        this.right   = new THREE.Vector3 (1, 0, 0);
        this.forward = new THREE.Vector3 (0, 0, 1);

        // Player's size (in block units)
        this.width  = 0.75;
        this.height = 1.75;

        // Collision wireframe
        this.shouldShowWireframe = false;
        const geometry = new THREE.CylinderGeometry (this.width * 0.5, this.width * 0.5, this.height);
        const wireframeGeometry = new THREE.WireframeGeometry (geometry);
        this.collisionMeshWireframe = new THREE.LineSegments( wireframeGeometry );
        // this.collisionMeshWireframe.material.depthTest = false;
        this.collisionMeshWireframe.material.opacity = 0.25;
        this.collisionMeshWireframe.material.transparent = true;
        // Cylinders are drawn from the center
        // so we need to shift since the player's position point
        // is the center,bottom,center
        this.collisionMeshWireframe.position.set (0, this.height * 0.5, 0);
        if (this.shouldShowWireframe)
            this.add(this.collisionMeshWireframe);

        // Movement
        // position is inherited from super class
        // Position represents the bottom of the player
        this.position.set (0, 100, 0);
        this.velocity = new THREE.Vector3 (0, 0, 0);
        this.walkSpeed = 1.5; // blocks/second
        this.runSpeed  = this.walkSpeed*4; // blocks/second
        this.isRunning = false;
        this.lookSpeed = 0.002;
        this.jumpForce = 10; // blocks/second/second
        this.isOnGround = false;
        // the rate at which the player's velocity dampens
        this.frictionFactor = 0.75;
        this.panAmount = -Math.PI/2;
        this.tiltAmount = 0;

        // Controls
        // Keeps track of the current player's movement input in each direction
        this.input = new THREE.Vector3 (0, 0, 0);
        this.controlMode = PlayerControlMode.FLYING;
        document.addEventListener ("keydown"  , this.onKeyDown.bind (this));
        document.addEventListener ("keyup"    , this.onKeyUp.bind (this));
        document.addEventListener ("mousedown", this.onMouseDown.bind (this));
        document.addEventListener ("mouseup"  , this.onMouseUp.bind (this));
        document.addEventListener ("mousemove", this.onMouseMove.bind (this));
        document.addEventListener ('pointerlockchange', this.onPointerLockChange.bind (this));
		document.addEventListener ('pointerlockerror' , this.onPointerLockError.bind (this));

        // Player's camera
        this.camera = new THREE.PerspectiveCamera (70, window.innerWidth / window.innerHeight, 0.05, 1000);
        // Camera's position is offset from the player's position point
        this.cameraHeight = this.height - 0.25;
        this.camera.position.set (0, this.cameraHeight, 0);
        this.camera.lookAt (0, this.cameraHeight, 0);
        this.add (this.camera);
        this.cameraViewMode = CameraViewMode.FIRST_PERSON;
        this.cameraThirdPersonDistance = 3; // in # of blocks

        // Raycasting setup
        // how far the player can reach (for breaking/placing/interacting)
        let blockReach = 3; // in unit blocks
        this.raycaster = new THREE.Raycaster (
            undefined,
            undefined,
            0,
            blockReach
        );

        this.showRaycastHelpers = false;
        // arrow helper to show ray of raycaster
        this.raycasterHelper = new THREE.ArrowHelper (this.raycaster.ray.direction, this.raycaster.ray.origin, blockReach, 0xff0000);
        scene.add (this.raycasterHelper);
        this.raycasterHelper.visible = this.showRaycastHelpers;
        // Helper to show what face is being selected via raycast
        this.selectedBlockPosition = null;
        const selectionMaterial = new THREE.MeshBasicMaterial ({
            transparent: true,
            opacity: 0.3,
            color: 0xffffff
        });
        const selectionGeometry = new THREE.PlaneGeometry (1.01, 1.01);
        this.selectionHelper = new THREE.Mesh (selectionGeometry, selectionMaterial);
        scene.add (this.selectionHelper);
        // helper to show what position a block will be placed at
        const adjacentGeometry = new THREE.BoxGeometry (1.01, 1.01, 1.01);
        const adjacentMaterial = new THREE.MeshBasicMaterial ({
            transparent: true,
            opacity: 0.2,
            color: 0xff0000
        });
        this.adjacentBlockPosition = null;
        this.adjacentHelper = new THREE.Mesh (adjacentGeometry, adjacentMaterial);
        scene.add (this.adjacentHelper);

        // Toolbar
        this.mainInventory = new Inventory (3, 9);
        for (let i = 1; i < ItemId.AcaciaLeavesBlock; ++i)
            this.mainInventory.addItem (new ItemStack (new Item (i), 64));
        this.toolbarInventory = new Inventory (1, 9);
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.GrassBlock), 64));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.DirtBlock), 64));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.StoneBlock), 64));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.LogBlock), 4));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.LeavesBlock), 64));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.SandBlock), 16));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.IronOreBlock), 64));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.DiamondOreBlock), 1));
        this.currentToolbarSlot = 0;

    }

    // ===================================================================

    /**
     * 
     * @returns the player's velocity relative to the world
     */
    getWorldVelocity ()
    {
        let worldVelocity = this.velocity.clone ();
        worldVelocity.applyEuler (new THREE.Euler (0, this.panAmount, 0));
        return worldVelocity;
    }

    // ===================================================================

    /**
     * Applies a world velocity to the player
     * @param {THREE.Vector} worldVelocity - the world velocity to apply
     * to the player.
     */
    applyWorldVelocity (worldVelocity)
    {
        worldVelocity.applyEuler (new THREE.Euler (0, -this.panAmount, 0));
        this.velocity.add (worldVelocity);
    }

    // ===================================================================
    // User Input
    // ===================================================================


    // Handles what the player should do for keys that are
    // continuously being held down.
    processContinuousInput ()
    {
        // X axis movement
        if      (isKeyDown ("KeyA")) this.input.x = 1;
        else if (isKeyDown ("KeyD")) this.input.x = -1;
        else                         this.input.x = 0;
        // Y axis movement
        if      (isKeyDown ("Space") &&
            this.controlMode != PlayerControlMode.NORMAL)
            this.input.y = 1;
        else if (isKeyDown ("KeyC")  &&
            this.controlMode != PlayerControlMode.NORMAL)
            this.input.y = -1;
        else
            this.input.y = 0;
        // Z axis movement
        if      (isKeyDown ("KeyW")) this.input.z = 1;
        else if (isKeyDown ("KeyS")) this.input.z = -1;
        else                         this.input.z = 0;
        // Walking vs running
        if (isKeyDown ("ShiftLeft")) this.isRunning = true;
        else                         this.isRunning = false;
    }

    // ===================================================================

    // Handles what the player should do when a key is pressed down
    onKeyDown (event)
    {
        // Ensure pointer is locked
        if (!this.isPointerLocked && event.code != "Escape")
            // unadjustedMovement disables OS pointer acceleration
            // this leads to smoother mouse movements
            // and prevents annoying jerking.
            document.documentElement.requestPointerLock ({
                unadjustedMovement: true
            });
        
        // jump
        if (event.code == "Space" && this.controlMode == PlayerControlMode.NORMAL && this.isOnGround)
        {
            this.velocity.y += this.jumpForce;
        }

        // Toolbar
        switch (event.code)
        {
            case "Digit1":
            case "Digit2":
            case "Digit3":
            case "Digit4":
            case "Digit5":
            case "Digit6":
            case "Digit7":
            case "Digit8":
            case "Digit9":
                document.getElementById ("toolbar-0").classList
                    .remove ("selected");
                document.getElementById ("toolbar-1").classList
                    .remove ("selected");
                document.getElementById ("toolbar-2").classList
                    .remove ("selected");
                document.getElementById ("toolbar-3").classList
                    .remove ("selected");
                document.getElementById ("toolbar-4").classList
                    .remove ("selected");
                document.getElementById ("toolbar-5").classList
                    .remove ("selected");
                document.getElementById ("toolbar-6").classList
                    .remove ("selected");
                document.getElementById ("toolbar-7").classList
                    .remove ("selected");
                document.getElementById ("toolbar-8").classList
                    .remove ("selected");
                this.currentToolbarSlot = Number (event.key) - 1;
                document.getElementById (
                    `toolbar-${this.currentToolbarSlot}`
                ).classList.add ("selected");
                break;
        }
    }

    // ===================================================================

    // Handles what the player should do when a key is released
    onKeyUp (event)
    {
        
    }

    // ===================================================================

    // Handles what the player should do when a mouse button is pressed
    onMouseDown (event)
    {
        // Ensure mouse is locked
        if (!this.isPointerLocked)
            return;

        // Left mouse button
        if (event.button === 0)
        {
            // Remove block
            if (this.selectedBlockPosition != null)
            {
                console.log ("Deleting block at", this.selectedBlockPosition);
                this.world.removeBlock (
                    this.selectedBlockPosition.x,
                    this.selectedBlockPosition.y,
                    this.selectedBlockPosition.z
                );
            }
        }
        // Right mouse button
        else if (event.button === 2)
        {
            // Place block
            if (this.adjacentBlockPosition != null)
            {
                const slotItem = this.toolbarInventory.getItemAt (
                    0,
                    this.currentToolbarSlot
                );
                // ensure slot has a block to place
                if (slotItem != null)
                {
                    console.log ("Placing block at", this.adjacentBlockPosition);
                    const blockId = slotItem.item.itemId;
                    this.world.addBlock (
                        this.adjacentBlockPosition.x,
                        this.adjacentBlockPosition.y,
                        this.adjacentBlockPosition.z,
                        blockId
                    );
                }
            }

        }
        // Middle mouse button
        else if (event.button == 1)
        {
            console.log ("MIDDLE MOUSE BUTTON");

        }
    }

    // ===================================================================

    // Handles what the player should do when a mouse button is released
    onMouseUp (event)
    {
        
    }

    // ===================================================================

    // Handles what the player should do when the mouse moves
    onMouseMove (event)
    {
        // Ensure pointer is locked
        if (!this.isPointerLocked) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        this.panAmount += this.lookSpeed * movementX;
        // wrap angle if we exceed 360 degrees
        this.panAmount = this.panAmount % (2*Math.PI);

        // movementY needs to be inverted - unsure why
        this.tiltAmount += this.lookSpeed * -movementY;
        // ensure tilt doesnt exceed bounds
        // 2.01 ensures we do not look fully up or down
        // bc it gets glitchy at 90 degrees
        if (this.tiltAmount > Math.PI/2) this.tiltAmount = Math.PI/2.01;
        if (this.tiltAmount < -Math.PI/2) this.tiltAmount = -Math.PI/2.01;

    }

    // ===================================================================

    // Handles pointer lock change events
    onPointerLockChange ()
    {
        if (document.pointerLockElement)
            this.isPointerLocked = true;
        else
            this.isPointerLocked = false;
    }

    // ===================================================================

    // Handles pointer lock error events
    onPointerLockError ()
    {
        console.error ('Error: Unable to use Pointer Lock API');
    }

    // ===================================================================

    // Updates the player's state by the given amount of time passed
    // This handles the physics and movement of the player
    updatePhysics (deltaTime)
    {
        this.processContinuousInput ();

        // Apply user's input to player's velocity
        let speed = this.walkSpeed;
        if (this.isRunning) speed = this.runSpeed;
        this.velocity.addScaledVector (this.right  , speed * this.input.x);
        this.velocity.addScaledVector (this.up     , speed * this.input.y);
        this.velocity.addScaledVector (this.forward, speed * this.input.z);

        // Apply pan to player
        // Note: tilt only applies to camera
        // up vector should always match global up
        this.forward.set (Math.cos (this.panAmount), 0, Math.sin (this.panAmount));
        this.forward.normalize ();
        this.right.set (Math.cos (this.panAmount - Math.PI/2), 0, Math.sin (this.panAmount - Math.PI/2));
        this.right.normalize ();

        // Apply friction dampener
        if (this.controlMode == PlayerControlMode.FLYING || this.controlMode == PlayerControlMode.NOCLIP)
            this.velocity.multiply (new THREE.Vector3 (this.frictionFactor, this.frictionFactor, this.frictionFactor));
        else // if (this.controlMode == PlayerControlMode.NORMAL)
            // this friction factor messes up the gravity calc for the
            // y direction so dont dampen y
            this.velocity.multiply (new THREE.Vector3 (this.frictionFactor, 1, this.frictionFactor));

        // Apply velocity to player
        this.position.addScaledVector (this.velocity, deltaTime);

        // Apply pan and tilt to the camera
        if (this.cameraViewMode == CameraViewMode.FIRST_PERSON)
        {
            let cameraForward = new THREE.Vector3 (Math.cos (this.panAmount), Math.tan (this.tiltAmount), Math.sin (this.panAmount));
            cameraForward.normalize ();
            let focusPoint = new THREE.Vector3 ().addVectors (this.position, cameraForward);
            // Adjust for camera being offset from player position
            focusPoint.y += this.cameraHeight;
            this.camera.lookAt (focusPoint);
            this.camera.position.set (0, this.cameraHeight, 0);
        }
        else // if (this.cameraViewMode == CameraViewMode.THIRD_PERSON)
        {
            let cameraForward = new THREE.Vector3 (Math.cos (this.panAmount), Math.tan (this.tiltAmount), Math.sin (this.panAmount));
            cameraForward.normalize ().negate ();
            this.camera.position.copy (cameraForward);
            this.camera.position.y += this.cameraHeight;
            this.camera.position.x *= this.cameraThirdPersonDistance;
            this.camera.position.z *= this.cameraThirdPersonDistance;
            // let focusPoint = new THREE.Vector3 ().addVectors (this.position, cameraForward);
            let focusPoint = this.position.clone ();
            // Adjust for camera being offset from player position
            focusPoint.y += this.cameraHeight;
            this.camera.lookAt (focusPoint);
        }
    }

    // ===================================================================

    /**
     * Handles non-physics based updates like block placing/breaking
     * @param {*} world 
     */
    update (world)
    {
        this.updateRaycaster (world);
    }

    // ===================================================================

    /**
     * Updates the raycaster for detecting things in front of the player
     * @param {*} world 
     */
    updateRaycaster (world)
    {
        this.raycaster.setFromCamera (CENTER_OF_SCREEN, this.camera);

        // Helper for the raycast
        let origin = this.raycaster.ray.origin.clone ();
        let direction = this.raycaster.ray.direction.clone ();
        this.raycasterHelper.setDirection (direction);
        this.raycasterHelper.position.copy (origin);

        const intersections = this.raycaster.intersectObject (
            world,
            true
        );

        if (intersections.length > 0)
        {
            const intersection = intersections[0];

            // Get containing chunk
            const chunk = intersection.object.parent;

            // Get transformation matrix of the intersected block face
            const faceMatrix = new THREE.Matrix4 ();
            intersection.object.getMatrixAt (
                intersection.instanceId,
                faceMatrix
            );

            const mesh = intersection.object;

            // Determine what block this is
            // this is the position where we would break
            // or interact with a block.
            this.selectedBlockPosition = mesh
                .userData
                .getBlockPos[intersection.instanceId]
                .clone ();
            this.selectedBlockPosition.add (chunk.position.clone ());
            // console.log (this.selectedBlockPosition);

            // Determine the adjacent block position
            // this is the position where we would place a block
            let normalMatrix = new THREE.Matrix3 ().getNormalMatrix (
                faceMatrix
            );
            this.adjacentBlockPosition =
                this.selectedBlockPosition.clone ();
            this.adjacentBlockPosition.add (
                new THREE.Vector3 ()
                    .copy (intersection.normal)
                    .applyMatrix3 (normalMatrix)
            );

            // Update the helper
            this.raycasterHelper.visible = this.showRaycastHelpers;
            this.selectionHelper.visible = this.showRaycastHelpers;
            // reset matrix of selection helper
            this.selectionHelper.position.set (0, 0, 0.01);
            this.selectionHelper.rotation.set (0, 0, 0);
            // apply matrix to move and rotate helper on top block face
            this.selectionHelper.applyMatrix4 (faceMatrix);
            // position to the chunk that contains the block face
            this.selectionHelper.position.add (chunk.position);
            // Helper to show position of where a block will be placed
            this.adjacentHelper.visible = this.showRaycastHelpers;
            this.adjacentHelper.position.copy (this.adjacentBlockPosition);
            // adjust to draw box from corner instead of center
            this.adjacentHelper.position.add (new THREE.Vector3 (0.5, 0.5, 0.5));
        }
        else
        {
            this.selectedBlockPosition = null;
            this.selectionHelper.visible = false;
            this.adjacentHelper.visible = false;
        }
    }

    // ===================================================================
    // DEBUG HELPERS
    // ===================================================================

    toggleCollisionMeshWireframe ()
    {
        if (this.shouldShowWireframe)
        {
            this.shouldShowWireframe = false;
            this.remove (this.collisionMeshWireframe);
            this.collisionMeshWireframe.geometry.dispose ();
            this.collisionMeshWireframe.material.dispose ();
        }
        else
        {
            this.shouldShowWireframe = true;
            this.add (this.collisionMeshWireframe);
        }
    }

}
