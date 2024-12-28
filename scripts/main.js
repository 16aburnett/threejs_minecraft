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
import { registerKeyDown, registerKeyUp } from './controls.js';
import { Physics } from './physics.js';
import { InventoryDisplay } from './inventoryDisplay.js';
import { ToolbarDisplay } from './toolbarDisplay.js';

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
let inventoryDisplay;
let isInventoryOpened = false;

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
    inventoryDisplay = new InventoryDisplay (player);
}
setup ();

// =======================================================================
// Draw loop - called once per frame

function draw (currentFrameTimeMS)
{
    const deltaTime = (currentFrameTimeMS - previousFrameTimeMS) * 0.001;
    previousFrameTimeMS = currentFrameTimeMS;
    player.update (world);
    world.update (player);
    physics.update (deltaTime, player, world, world.getEntities ());

    // Make sun light and shadows follow player
    sunLight.position.copy (player.position);
    sunLight.position.add (new THREE.Vector3 (50, 50, 50));
    sunLight.target.position.copy (player.position);

    renderer.render (scene, player.camera);
    stats.update ();
    ui.update ();
    toolbarDisplay.update ();
    inventoryDisplay.update ();
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

    if (event.code == "KeyE")
    {
        if (isInventoryOpened)
        {
            isInventoryOpened = false;
            inventoryDisplay.hide ();
        }
        else
        {
            isInventoryOpened = true;
            inventoryDisplay.show ();
        }
    }
}, false);

document.addEventListener ("keyup", (event) => {
    // Need to prevent normal commands like ctrl+R
    // This will not prevent commands like ctrl+W which closes the window
    event.preventDefault ();
    event.stopPropagation ();
    registerKeyUp (event);
}, false);

document.addEventListener ("mousedown", (event) => {
    if (isInventoryOpened)
    {
        inventoryDisplay.handleMouseDown (event);
    }
});

document.addEventListener ("mouseup", (event) => {
    inventoryDisplay.handleMouseUp (event);
});

document.addEventListener ('mousemove', (event) => {
    inventoryDisplay.handleMouseMove (event);
});

document.addEventListener ('contextmenu', function(e) {
    // Disable right click pop up menu
    e.preventDefault ();
});