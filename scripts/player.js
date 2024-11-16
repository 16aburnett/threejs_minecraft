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

        // Movement
        // position is inherited from super class
        // Position represents the bottom of the player
        this.position.set (48, 64, 48);
        this.velocity = new THREE.Vector3 (0, 0, 0);
        this.walkSpeed = 1.5; // blocks/second
        this.runSpeed  = this.walkSpeed*4; // blocks/second
        this.isRunning = false;
        this.lookSpeed = 0.002;
        this.jumpForce = 2; // blocks/second/second
        // the rate at which the player's velocity dampens
        this.frictionFactor = 0.75;
        this.panAmount = -Math.PI/2;
        this.tiltAmount = 0;

        // Controls
        // Keeps track of the current player's movement input in each direction
        this.input = new THREE.Vector3 (0, 0, 0);
        document.addEventListener ("keydown"  , this.onKeyDown.bind (this));
        document.addEventListener ("keyup"    , this.onKeyUp.bind (this));
        document.addEventListener ("mousedown", this.onMouseDown.bind (this));
        document.addEventListener ("mouseup"  , this.onMouseUp.bind (this));
        document.addEventListener ("mousemove", this.onMouseMove.bind (this));
        document.addEventListener ('pointerlockchange', this.onPointerLockChange.bind (this) );
		document.addEventListener ('pointerlockerror' , this.onPointerLockError.bind (this) );

        // Player's camera
        this.camera = new THREE.PerspectiveCamera (70, window.innerWidth / window.innerHeight, 1, 1000);
        // Camera's position is relative to the player's position
        this.camera.position.set (0, 0, 0);
        // this.camera.lookAt (0, this.position.y + this.camera.position.y, 0);
        this.camera.lookAt (0, 0, 0);
        this.add (this.camera);
    }

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
        if      (isKeyDown ("Space")) this.input.y = 1;
        else if (isKeyDown ("KeyC"))  this.input.y = -1;
        else                          this.input.y = 0;
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
        this.velocity.multiply (new THREE.Vector3 (this.frictionFactor, this.frictionFactor, this.frictionFactor));
        
        // Apply velocity to player
        this.position.addScaledVector (this.velocity, deltaTime);

        // Apply pan and tilt to the camera
        let cameraForward = new THREE.Vector3 (Math.cos (this.panAmount), Math.tan (this.tiltAmount), Math.sin (this.panAmount));
        cameraForward.normalize ();
        let focusPoint = new THREE.Vector3 ().addVectors (this.position, cameraForward);
        this.camera.lookAt (focusPoint);
    }

}
