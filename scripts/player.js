// Minecraft clone made with THREE.js
// Simple player class
// By Amy Burnett
// =======================================================================
// Importing

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { isKeyDown } from './controls.js';
import { Inventory } from './inventory.js';
import { ItemStack } from './itemStack.js';
import { Item } from './item.js';
import { ItemId } from "./itemId.js";
import { Layers } from './layers.js';
import { ItemEntity } from './itemEntity.js';
import World from './world.js';
import { blockData } from './blockData.js';
import { inventoryDisplay } from './main.js';
import { ToolType } from './tool.js';
import { itemStaticData } from './itemData.js';

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
    /**
     * Constructs a Player
     * @param {THREE.Scene} scene
     * @param {World} world
     */
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
        // Make sure the camera can see the different layers of objects
        this.camera.layers.enable (Layers.Default);
        this.camera.layers.enable (Layers.ItemEntities);
        this.camera.layers.enable (Layers.Debug);

        // Raycasting setup
        // how far the player can reach (for breaking/placing/interacting)
        let blockReach = 3; // in unit blocks
        this.raycaster = new THREE.Raycaster (
            undefined,
            undefined,
            0,
            blockReach
        );
        // We only want the raycaster to intersect with block faces
        this.raycaster.layers.set (Layers.Default);

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

        // Block breaking
        this.blockBeingMined = null;
        this.blockBeingMinedDelayMax = 0.0;
        this.blockBeingMinedDelay = 0.0;
        this.waitingForMouseRelease = false;
        this.blockBreakTextures = [];
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_0.png"));
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_1.png"));
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_2.png"));
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_3.png"));
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_4.png"));
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_5.png"));
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_6.png"));
        this.blockBreakTextures.push (new THREE.TextureLoader ().load ("assets/texture_block_break_7.png"));
        for (const texture of this.blockBreakTextures)
        {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            // Using nearest filter for crisp, non-blurry textures
            texture.magFilter = THREE.NearestFilter;
            // We need to set this, otherwise the textures look washed out
            texture.colorSpace = THREE.SRGBColorSpace;
        }
        this.blockBreakMesh = new THREE.Mesh (
            new THREE.BoxGeometry (1.01, 1.01, 1.01),
            new THREE.MeshBasicMaterial ({
                transparent: true,
                map: this.blockBreakTextures[0]
            })
        );
        scene.add (this.blockBreakMesh);

        // Inventories
        this.mainInventory = new Inventory (3, 9);
        for (let i = 1; i <= ItemId.Stick; ++i)
            this.mainInventory.addItem (new ItemStack (new Item (i), 64));
        this.toolbarInventory = new Inventory (1, 9);
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.StoneSword), 1));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.StonePickaxe), 1));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.StoneShovel), 1));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.StoneAxe), 1));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.StoneHoe), 1));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.StoneBlock), 64));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.CraftingTableBlock), 64));
        this.toolbarInventory.addItem (new ItemStack (new Item (ItemId.CobblestoneBlock), 64));
        this.currentToolbarSlot = 0;
        // Crafting inventories
        this.craftingInputInventory = new Inventory (2, 2);
        this.craftingOutputInventory = new Inventory (1, 1);

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
        // Ensure inventory is not opened
        if (inventoryDisplay.isOpened)
            return;

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

    processBreakingBlocks (deltaTime)
    {
        // Ensure mouse is being pressed
        if (this.blockBeingMined != null && !isKeyDown ("LeftMouseButton"))
        {
            this.stopBreakingBlock ();
            return;
        }

        // Ensure inventory is not opened
        if (inventoryDisplay.isOpened)
        {
            // Ensure we stop break blocks if we were
            if (this.blockBeingMined != null)
                this.stopBreakingBlock ();
            return;
        }

        if (this.blockBeingMined != null && !this.waitingForMouseRelease)
        {
            // check if we finished breaking the block
            if (this.blockBeingMinedDelay <= 0.0)
            {
                this.finishBreakingBlock ();
            }
            // keep breaking block IFF we are still facing it
            else if (this.selectedBlockPosition != null && this.selectedBlockPosition.equals (this.blockBeingMined))
            {
                this.continueBreakingBlock (deltaTime);
            }
            // not looking at block anymore, reset
            else
            {
                this.stopBreakingBlock ();
            }
        }
        // start breaking a new block if we are holding down the mouse
        else if (this.blockBeingMined == null && this.selectedBlockPosition != null && isKeyDown ("LeftMouseButton") && !this.waitingForMouseRelease)
        {
            this.startBreakingBlock ();
        }
    }

    // ===================================================================

    startBreakingBlock ()
    {
        console.log ("start breaking block");
        this.blockBeingMined = this.selectedBlockPosition.clone ();
        const blockId = this.world.getBlockId (this.blockBeingMined.x, this.blockBeingMined.y, this.blockBeingMined.z);
        // insta-mine if in creative
        // if (current_player_mode == PLAYER_MODE_CREATIVE)
        // {
        //     this.blockBeingMinedDelayMax = 0;
        //     this.blockBeingMinedDelay = 0;
        // }
        // we cant insta-mine in survival mode
        // else if (current_player_mode == PLAYER_MODE_SURVIVAL)
        // {
            this.blockBeingMinedDelayMax = blockData[blockId].mineDuration;
            // this.blockBeingMinedDelayMax = 5;
            this.blockBeingMinedDelay = this.blockBeingMinedDelayMax;
            // scale delay if player is holding the necessary tool
            const blockPreferredTool = blockData[blockId].preferredTool;
            // ensure we are holding an item
            const selectedSlot = this.toolbarInventory.slots[this.currentToolbarSlot];
            const heldItem = selectedSlot == null ? null : selectedSlot.item.itemId;
            if (heldItem != null)
            {
                // ensure item is a tool
                let isTool = itemStaticData[heldItem].toolType != ToolType.None;
                let isMatchingTool = blockPreferredTool == itemStaticData[heldItem].toolType;
                if (isTool && isMatchingTool)
                {
                    console.log ("preferred tool detected, breaking faster");
                    // tool is preferred tool for block
                    // reduce delay to simulate mining faster
                    let toolEfficiencyFactor = itemStaticData[heldItem].toolEfficiencyFactor;
                    // guard against div-by-zero
                    if (toolEfficiencyFactor != 0)
                    {
                        this.blockBeingMinedDelayMax = this.blockBeingMinedDelayMax / toolEfficiencyFactor;
                        this.blockBeingMinedDelay = this.blockBeingMinedDelayMax;
                    }
                }
            }
        // }
    }

    // ===================================================================

    continueBreakingBlock (deltaTime)
    {
        console.log ("continue breaking block");
        this.blockBeingMinedDelay -= deltaTime;
    }

    // ===================================================================

    stopBreakingBlock ()
    {
        console.log ("stop breaking block");
        this.blockBeingMined = null;
        this.blockBeingMinedDelay = 0.0;
    }

    // ===================================================================
    
    finishBreakingBlock ()
    {
        console.log ("finish breaking block");
        // block is broken, delete it and pop out an item
        // let block_type = world.get_block_type (this.blockBeingMined.x, this.blockBeingMined.y, this.blockBeingMined.z);
        // delete the block
        this.world.removeBlock (this.blockBeingMined.x, this.blockBeingMined.y, this.blockBeingMined.z);
        // creative mode should not drop item entities
        // if (current_player_mode != PLAYER_MODE_CREATIVE)
        // {
        //     // drop item entity from the block
        //     let item_stack_to_drop = map_block_id_to_block_static_data.get (block_type).block_drops_func ();
        //     if (item_stack_to_drop != null)
        //     {
        //         let block_item_entity = new ItemEntity (item_stack_to_drop);
        //         // move entity to block's position
        //         block_item_entity.set_position (this.blockBeingMined.x * BLOCK_WIDTH, -this.blockBeingMined.y * BLOCK_WIDTH - BLOCK_WIDTH/2, this.blockBeingMined.z * BLOCK_WIDTH);
        //         // send block in a random direction
        //         let dir = p5.Vector.random3D ();
        //         let vel = p5.Vector.mult (dir, BLOCK_THROW_SPEED/2);
        //         block_item_entity.add_velocity (vel.x, vel.y, vel.z);
        //         // Broken blocks should be able to be picked up instantly
        //         // so clear delay
        //         block_item_entity.collect_delay = 0.0;
        //         // add entity to global list
        //         g_entities.push (block_item_entity);
        //     }
        // }
        // block is broken so stop mining
        this.blockBeingMined = null;
        this.selectedBlockPosition = null;
        // creative mode should wait until the mouse is released before it can break another block
        // if (current_player_mode == PLAYER_MODE_CREATIVE)
            // this.waitingForMouseRelease = true;
        // consume 1 usage for the current tool (if a tool was used)
        let heldItemStack = this.toolbarInventory.slots[this.currentToolbarSlot];
        let hasItem = heldItemStack != null;
        // ensure player is holding an item
        if (hasItem)
        {
            let heldItemStaticData = itemStaticData[heldItemStack.item.itemId];
            let isItemTool = heldItemStaticData.toolType != ToolType.None;
            // ensure player's held item is a tool
            if (isItemTool)
            {
                // consume 1 usage of the item
                heldItemStack.item.usages--;
                console.log (`${heldItemStack.item.usages} uses left`);
                // ensure item is deleted if it does not have anymore usages
                if (heldItemStack.item.usages <= 0)
                {
                    // remove item since it is broken/used up
                    this.toolbarInventory.slots[this.currentToolbarSlot] = null;
                }
            }
        }
    }

    // ===================================================================

    // Handles what the player should do when a key is pressed down
    onKeyDown (event)
    {
        // Ensure inventory is not opened
        if (inventoryDisplay.isOpened)
            return;

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

        // Dropping a single item
        if (event.code == "KeyQ" && !isKeyDown ("ShiftLeft"))
        {
            const itemStack = this.toolbarInventory.getItemAt (0, this.currentToolbarSlot);
            // Ensure there is an item to drop
            if (itemStack == null)
                return;
            const itemStackToDrop = new ItemStack (itemStack.item.copy (), 1);
            // remove item from inventory
            itemStack.amount -= 1;
            // Ensure stack is removed if all items are gone
            if (itemStack.amount <= 0)
                this.toolbarInventory.swapItemAt (0, this.currentToolbarSlot, null);
            // Drop item into the world
            const itemEntity = new ItemEntity (itemStackToDrop, {collectDelay: 3.0});
            const throwPosition = this.position.clone ();
            throwPosition.y += this.cameraHeight;
            itemEntity.position.copy (throwPosition);
            const cameraForward = new THREE.Vector3 ();
            this.camera.getWorldDirection (cameraForward);
            const itemThrowVelocity = cameraForward;
            itemThrowVelocity.multiplyScalar (10);
            itemEntity.velocity.copy (itemThrowVelocity);
            console.log ("Dropping single item");
            this.world.addItemEntity (itemEntity);
        }
        // Dropping the full item stack
        else if (event.code == "KeyQ" && isKeyDown ("ShiftLeft"))
        {
            const itemStackToDrop = this.toolbarInventory.getItemAt (0, this.currentToolbarSlot);
            // Ensure there is an item to drop
            if (itemStackToDrop == null)
                return;
            // remove item from inventory
            this.toolbarInventory.swapItemAt (0, this.currentToolbarSlot, null);
            // Drop item into the world
            const itemEntity = new ItemEntity (itemStackToDrop, {collectDelay: 3.0});
            const throwPosition = this.position.clone ();
            throwPosition.y += this.cameraHeight;
            itemEntity.position.copy (throwPosition);
            const cameraForward = new THREE.Vector3 ();
            this.camera.getWorldDirection (cameraForward);
            const itemThrowVelocity = cameraForward;
            itemThrowVelocity.multiplyScalar (10);
            itemEntity.velocity.copy (itemThrowVelocity);
            console.log ("Dropping full item stack");
            this.world.addItemEntity (itemEntity);
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
        // Ensure inventory is not opened
        if (inventoryDisplay.isOpened)
            return;
    }

    // ===================================================================

    // Handles what the player should do when a mouse button is pressed
    onMouseDown (event)
    {
        // Ensure inventory is not opened
        if (inventoryDisplay.isOpened)
            return;

        // Ensure mouse is locked
        if (!this.isPointerLocked)
            return;

        // Left mouse button
        if (event.button === 0)
        {
            // Block breaking is handled by continuous controls
        }
        // Right mouse button
        else if (event.button === 2)
        {
            // If player is targeting a block
            if (this.adjacentBlockPosition != null)
            {
                // Interacting with targeted blocks
                const targetedBlockId = this.world.getBlockId (
                    this.selectedBlockPosition.x,
                    this.selectedBlockPosition.y,
                    this.selectedBlockPosition.z
                );
                const isInteractable = blockData[targetedBlockId].isInteractable;
                if (isInteractable && !isKeyDown("ShiftLeft"))
                {
                    console.log ("Interacting with block");
                    inventoryDisplay.showWithCraftingTable ();
                }
                // Placing blocks
                else
                {
                    const slotItem = this.toolbarInventory.getItemAt (
                        0,
                        this.currentToolbarSlot
                    );
                    // ensure slot has an item
                    if (slotItem != null)
                    {
                        const blockId = itemStaticData[slotItem.item.itemId].blockToPlace;
                        // ensure that this item places blocks
                        if (blockId != null)
                        {
                            console.log ("Placing block at", this.adjacentBlockPosition);
                            this.world.addBlock (
                                this.adjacentBlockPosition.x,
                                this.adjacentBlockPosition.y,
                                this.adjacentBlockPosition.z,
                                blockId
                            );
                        }
                    }
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
        // Ensure inventory is not opened
        if (inventoryDisplay.isOpened)
            return;
    }

    // ===================================================================

    // Handles what the player should do when the mouse moves
    onMouseMove (event)
    {
        // Ensure inventory is not opened
        if (inventoryDisplay.isOpened)
            return;

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
        this.processBreakingBlocks (deltaTime);

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
     * Returns true if the given point is within this entity's collision
     * mesh, otherwise false.
     * @param {THREE.Vector3} point
     * @returns
     */
    isPointWithinCollisionMesh (point)
    {
        const entityCenterX = this.position.x;
        const entityCenterY = this.position.y + this.height / 2;
        const entityCenterZ = this.position.z;
        const dx = point.x - entityCenterX;
        const dy = point.y - entityCenterY;
        const dz = point.z - entityCenterZ;
        const radius = this.width * 0.5;

        // TODO: sqrt is slow, we can factor this out and compare against
        // radius squared 
        const distanceXZ = Math.sqrt (dx * dx + dz * dz);

        const withinXZ = Math.abs (distanceXZ) < radius;
        const withinY = Math.abs (dy) < (this.height / 2);
        
        return withinXZ && withinY;
    }

    // ===================================================================

    /**
     * Determines how far a point is inside from the collision mesh
     * boundaries and the normal vector of the collision.
     * @param {*} point
     * @returns a list with the normal vector and the overlap amount.
     */
    calculateCollisionVector (point)
    {
        const entityCenterX = this.position.x;
        const entityCenterY = this.position.y + this.height / 2;
        const entityCenterZ = this.position.z;
        const dx = point.x - entityCenterX;
        const dy = point.y - entityCenterY;
        const dz = point.z - entityCenterZ;
        const entityRadius = this.width * 0.5;
        // Compute the overlap between the point and the entity's
        // bounding cylinder. Essentially how far the entity moved
        // past the block's collision mesh.
        const overlapXZ = entityRadius - Math.sqrt (dx * dx + dz * dz);
        const overlapY = this.height / 2 - Math.abs (dy);
        
        // Compute the normal of the collision. From the collision
        // point towards the entity. Essentially the direction of
        // the collision.
        let normalXZ = new THREE.Vector3 (-dx, 0, -dz).normalize ();
        let normalY = new THREE.Vector3 (0, -Math.sign (dy), 0);

        // Only use the normal and overlap of the smaller change.
        // Smaller changes will be less jarring of a correction.
        let normal, overlap;
        if (overlapXZ < overlapY)
        {
            normal = normalXZ;
            overlap = overlapXZ;
        }
        else
        {
            normal = normalY;
            overlap = overlapY;
            this.isOnGround = true;
        }
        return [normal, overlap];
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
            this.selectionHelper.visible = true;
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
            // Block breaking texture
            if (this.blockBeingMined != null)
            {
                this.blockBreakMesh.visible = true;
                this.blockBreakMesh.position.copy (this.selectedBlockPosition);
                this.blockBreakMesh.position.add (new THREE.Vector3 (0.5, 0.5, 0.5));
                const progress = 1.0 - (this.blockBeingMinedDelay / this.blockBeingMinedDelayMax);
                if (progress < 1/7)
                    this.blockBreakMesh.material.map = this.blockBreakTextures[0];
                else if (progress < 2/7)
                    this.blockBreakMesh.material.map = this.blockBreakTextures[1];
                else if (progress < 3/7)
                    this.blockBreakMesh.material.map = this.blockBreakTextures[2];
                else if (progress < 4/7)
                    this.blockBreakMesh.material.map = this.blockBreakTextures[3];
                else if (progress < 5/7)
                    this.blockBreakMesh.material.map = this.blockBreakTextures[4];
                else if (progress < 6/7)
                    this.blockBreakMesh.material.map = this.blockBreakTextures[5];
                else if (progress < 7/7)
                    this.blockBreakMesh.material.map = this.blockBreakTextures[6];
                else
                    this.blockBreakMesh.material.map = this.blockBreakTextures[7];
                this.blockBreakMesh.material.map.needsUpdate = true;
            }
            else
                this.blockBreakMesh.visible = false;
        }
        else
        {
            this.selectedBlockPosition = null;
            this.selectionHelper.visible = false;
            this.adjacentHelper.visible = false;
            this.blockBreakMesh.visible = false;
        }
    }

    // ===================================================================

    collectItemEntity (entity)
    {
        // Ensure item entity is ready to be collected
        if (entity.isCollectable () == false)
            return;

        console.log ("Collecting item");
        const itemStack = entity.itemStack;
        // try toolbar inventory
        let remainingItemStack = this.toolbarInventory.addItem (
            itemStack
        );

        // try main inventory if there are more items
        if (remainingItemStack)
            remainingItemStack = this.mainInventory.addItem (
                remainingItemStack
            );

        // update entity's stack
        entity.itemStack = remainingItemStack;

        // ensure entity despawns if no items are left
        if (remainingItemStack == null || remainingItemStack.amount <= 0)
        {
            entity.despawn ();
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
