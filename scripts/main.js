// Minecraft clone made with THREE.js
// By Amy Burnett
// November 16, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import Stats from 'three/addons/libs/stats.module.js';
import { LightProbeGenerator } from 'three/addons/lights/LightProbeGenerator.js';
import World from './world.js'
import { UI } from './ui.js';
import Player from './player.js'
import { registerKeyDown, registerKeyUp, registerMouseButtonDown, registerMouseButtonUp } from './controls.js';
import { Physics } from './physics.js';
import { InventoryUI } from './inventoryUI.js';
import { ToolbarDisplay } from './toolbarDisplay.js';
import { DebugHUD } from './debugHUD.js';
import MobEntity from './mobEntity.js';

// =======================================================================
// Global variables

let renderer;
let scene;
let stats;
let ui;
// Lighting
let ambientLight;
let sunLight;
let sunLightHelper; // for debug
// World
let world;
let axesHelper;
// Player
export let player;
let previousFrameTimeMS = 0;
let physics;
// HUD elements
let toolbarDisplay;
export let inventoryUI;
let debugHUD;
export let isGamePaused = false;
export let isPointerLocked = false;

// =======================================================================
// Setup

function setup ()
{
    renderer = new THREE.WebGLRenderer ({antialias: true});
    renderer.setPixelRatio (window.devicePixelRatio);
    renderer.setSize (window.innerWidth, window.innerHeight);
    // Enable shadow maps so we can have shadows
    renderer.shadowMap.enabled = true;
    // PCFSoftShadowMap is the most costly but looks the best
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Add canvas to the page
    document.body.appendChild (renderer.domElement);
    // Setup draw/animation loop
    renderer.setAnimationLoop (draw);

    // Setup the scene
    scene = new THREE.Scene ();
    scene.background = new THREE.Color ().setRGB (135/256, 220/256, 235/256);
    scene.fog = new THREE.Fog (scene.background, 32, 128);

    // Setup world
    world = new World ();
    scene.add (world);

    // Setup lighting
    // Directional Light - Sun
    sunLight = new THREE.DirectionalLight ();
    // directionalLight.color.setHSL (0.1, 1.0, 0.95);
    sunLight.position.set (-1, 1.75, 1);
    sunLight.position.multiplyScalar (25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize = new THREE.Vector2 (1024, 1024);
    const d = 100;
    sunLight.shadow.camera.left   = -d;
    sunLight.shadow.camera.right  =  d;
    sunLight.shadow.camera.top    =  d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near   = 0.1;
    sunLight.shadow.camera.far    = 200.0;
    sunLight.shadow.bias = -0.0001;
    scene.add (sunLight);
    // not sure we really need to add the target to the scene but eh.
    scene.add (sunLight.target);
    // Debug icon helper
    sunLightHelper = new THREE.DirectionalLightHelper (sunLight, 10);
    // scene.add (directionalLightHelper);
    let shadowHelper = new THREE.CameraHelper (sunLight.shadow.camera);
    // scene.add (shadowHelper);
    // Ambient light
    // We really dont want ambient light
    ambientLight = new THREE.AmbientLight ();
    ambientLight.intensity = 0.1;
    scene.add (ambientLight);

    axesHelper = new THREE.AxesHelper (100);
    scene.add (axesHelper);
    // Initially not visible
    // GUI can be used to toggle bisibility
    axesHelper.visible = false;

    // Player
    player = new Player (scene, world);
    // player = new OrbitPlayer (renderer);
    scene.add (player);

    // Physics
    physics = new Physics (scene);

    // Setup GUI elements
    // stats is a popup gui that shows FPS
	stats = new Stats ();
	document.body.appendChild (stats.dom);
    ui = new UI (scene, world, sunLight, player, axesHelper, physics);

    // HUD
    toolbarDisplay = new ToolbarDisplay (player);
    inventoryUI = new InventoryUI (player);
    debugHUD = new DebugHUD ();
}
setup ();

// =======================================================================
// Draw loop - called once per frame

function draw (currentFrameTimeMS)
{
    const deltaTime = (currentFrameTimeMS - previousFrameTimeMS) * 0.001;
    previousFrameTimeMS = currentFrameTimeMS;
    player.update (world);
    world.update (deltaTime, player);
    physics.update (deltaTime, player, world, world.getEntities ());

    // Make sun light and shadows follow player
    sunLight.position.copy (player.position);
    sunLight.position.add (new THREE.Vector3 (50, 50, 50));
    sunLight.target.position.copy (player.position);

    renderer.render (scene, player.camera);
    stats.update ();
    ui.update ();
    toolbarDisplay.update ();
    inventoryUI.update ();
    debugHUD.update (player, world);
}

// =======================================================================

function spawnMob ()
{
    console.log ("Spawning mob");
    const mobId = Math.round (Math.random ());
    const mob = new MobEntity (mobId, world);
    world.addEntity (mob);
}

// =======================================================================

function pauseGame ()
{
    console.log ("Game is paused");
    isGamePaused = true;
    physics.pause ();
    renderer.setAnimationLoop (null);
    if (isPointerLocked)
        document.exitPointerLock ();
    document.getElementById ("pause-menu-container").style.display = "flex";
}

// =======================================================================

function resumeGame ()
{
    console.log ("Game resumed");
    isGamePaused = false;
    physics.resume ();
    renderer.setAnimationLoop (draw);
    document.getElementById ("pause-menu-container").style.display = "none";
}

// =======================================================================
// Event Listeners
// =======================================================================

window.addEventListener ("resize", () => {
	player.camera.aspect = window.innerWidth / window.innerHeight;
	player.camera.updateProjectionMatrix ();
	renderer.setSize (window.innerWidth, window.innerHeight);
});

document.addEventListener ("keydown", (event) => {
    // Need to prevent normal commands like ctrl+R
    // This will not prevent commands like ctrl+W which closes the window
    event.preventDefault ();
    event.stopPropagation ();
    registerKeyDown (event);

    if (event.code == "KeyP")
    {
        if (isGamePaused)
            resumeGame ();
        else
            pauseGame ();
    }

    // ensure the game is not paused
    if (isGamePaused)
        return;

    if (event.code == "KeyE")
    {
        inventoryUI.toggleDisplay ();
        if (inventoryUI.isOpened)
            document.exitPointerLock ();
    }

    if (event.code == "KeyG")
    {
        debugHUD.toggleDisplay ();
    }

    if (event.code == "KeyM")
    {
        spawnMob ();
    }

    if (inventoryUI.isOpened)
    {
        return;
    }
    
    player.onKeyDown (event);
}, false);

document.addEventListener ("keyup", (event) => {
    // Need to prevent normal commands like ctrl+R
    // This will not prevent commands like ctrl+W which closes the window
    event.preventDefault ();
    event.stopPropagation ();
    registerKeyUp (event);
    
    // ensure the game is not paused
    if (isGamePaused)
        return;

    if (inventoryUI.isOpened)
    {
        return;
    }

    player.onKeyUp (event);
}, false);

document.addEventListener ("mousedown", (event) => {
    registerMouseButtonDown (event);

    // ensure the game is not paused
    if (isGamePaused)
        return;

    if (inventoryUI.isOpened)
    {
        inventoryUI.handleMouseDown (event);
        return;
    }

    if (!inventoryUI.isOpened)
        player.onMouseDown (event);
});

document.addEventListener ("mouseup", (event) => {
    registerMouseButtonUp (event);

    // ensure the game is not paused
    if (isGamePaused)
        return;

    if (inventoryUI.isOpened)
    {
        inventoryUI.handleMouseUp (event);
        return;
    }

    player.onMouseUp (event);
});

document.addEventListener ("mousemove", (event) => {
    // ensure the game is not paused
    if (isGamePaused)
        return;

    if (inventoryUI.isOpened)
    {
        inventoryUI.handleMouseMove (event);
        return;
    }

    player.onMouseMove (event);
});

document.addEventListener ("contextmenu", (event) => {
    // Disable right click pop up menu
    event.preventDefault ();
});

// Handles tabbing out of the game
document.addEventListener ("visibilitychange", (event) => {
    if (document.visibilityState === "hidden")
        pauseGame ();
});

document.addEventListener ("pointerlockchange", () => {
    if (document.pointerLockElement)
    {
        console.log ("Pointer was locked");
        isPointerLocked = true;
    }
    else
    {
        console.log ("Pointer was released");
        isPointerLocked = false;
    }
});

document.addEventListener ("pointerlockerror" , () => {
    console.error ('Error: Unable to use Pointer Lock API');
});

// Pause menu buttons
document.getElementById ("resume-game-button").addEventListener ("click", (event) => {
    resumeGame ();
});