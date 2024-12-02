// Minecraft clone made with THREE.js
// Simple player class
// By Amy Burnett
// November 16, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { isKeyDown } from './controls.js';

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

// =======================================================================

export default class Player extends THREE.Group
{
    constructor ()
    {
        super ();

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
        document.addEventListener ('pointerlockchange', this.onPointerLockChange.bind (this) );
		document.addEventListener ('pointerlockerror' , this.onPointerLockError.bind (this) );

        // Player's camera
        this.camera = new THREE.PerspectiveCamera (70, window.innerWidth / window.innerHeight, 0.05, 1000);
        // Camera's position is offset from the player's position point
        this.cameraHeight = this.height - 0.25;
        this.camera.position.set (0, this.cameraHeight, 0);
        this.camera.lookAt (0, this.cameraHeight, 0);
        this.add (this.camera);
        this.cameraViewMode = CameraViewMode.FIRST_PERSON;
        this.cameraThirdPersonDistance = 3; // in # of blocks
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
    update (deltaTime)
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
        }
        else // if (this.cameraViewMode == CameraViewMode.THIRD_PERSON)
        {
            // TODO:
            // let cameraForward = new THREE.Vector3 (Math.cos (this.panAmount), Math.tan (this.tiltAmount), Math.sin (this.panAmount));
            // cameraForward.normalize ();
            // let focusPoint = new THREE.Vector3 ().addVectors (this.position, cameraForward);
            // // Adjust for camera being offset from player position
            // focusPoint.y += this.cameraHeight;
            // this.camera.lookAt (focusPoint);
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
