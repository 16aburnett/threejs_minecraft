// Minecraft clone made with THREE.js
// Input control handling
// By Amy Burnett
// November 16, 2024
// =======================================================================
// Importing

import * as THREE from 'three';

// =======================================================================
// Global variables

// keeps track of whether a given key is currently down or up.
// keys are made lowercase as keys should have the same behavior
// regardless of if shift/caps is enabled.
let keyDownStatus = new Map ();
// true = key is down (being pressed/held)
const KEY_IS_DOWN = true;
// false = key is up (released)
const KEY_IS_UP = false;

// =======================================================================

// Returns true if the given key is currently being held down,
// false otherwise
// if the given key's status is not recorded, then returns false.
export function isKeyDown (key)
{
    // Ensure the key's status is being recorded
    if (!keyDownStatus.has (key))
        // we don't know what key it is
        // so assume that it is not being held down
        return false;
    return keyDownStatus.get (key);
}

// =======================================================================

// Registers that the given key is being held down
export function registerKeyDown (event)
{
    // Register that the key is being held
    keyDownStatus.set (event.code, KEY_IS_DOWN);
}

// =======================================================================

// Registers that the given key is no longer being held
export function registerKeyUp (event)
{
    // Register that the key was released
    keyDownStatus.set (event.code, KEY_IS_UP);
}

// =======================================================================

/**
 * Registers that the mouse button for the given event is currently being
 * held down.
 * @param {*} event
 */
export function registerMouseButtonDown (event)
{
    if (event.button == 0)
        keyDownStatus.set ("LeftMouseButton", KEY_IS_DOWN);
    else if (event.button == 1)
        keyDownStatus.set ("MiddelMouseButton", KEY_IS_DOWN);
    else if (event.button == 2)
        keyDownStatus.set ("RightMouseButton", KEY_IS_DOWN);
}

// =======================================================================

/**
 * Registers that the mouse button for the given event has been
 * released.
 * @param {*} event
 */
export function registerMouseButtonUp (event)
{
    if (event.button == 0)
        keyDownStatus.set ("LeftMouseButton", KEY_IS_UP);
    else if (event.button == 1)
        keyDownStatus.set ("MiddelMouseButton", KEY_IS_UP);
    else if (event.button == 2)
        keyDownStatus.set ("RightMouseButton", KEY_IS_UP);
}
