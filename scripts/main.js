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

// =======================================================================
// Global variables

let renderer;
let scene;
let stats;
let ui;
// Lighting
let ambientLight;
let directionalLight;
let directionalLightHelper; // for debug
// World
let world;
let axesHelper;
// Player
export let player;
let previousFrameTimeMS = 0;
let physics;

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
    scene.fog = new THREE.Fog (scene.background, 1, 5000);

    // Setup world
    world = new World ();
    scene.add (world);

    // Setup lighting
    // Directional Light - Sun
    directionalLight = new THREE.DirectionalLight ();
    // directionalLight.color.setHSL (0.1, 1.0, 0.95);
    directionalLight.position.set (-1, 1.75, 1);
    directionalLight.position.multiplyScalar (25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width  = 512;
    directionalLight.shadow.mapSize.height = 512;
    const d = 50;
    directionalLight.shadow.camera.left   = -d;
    directionalLight.shadow.camera.right  =  d;
    directionalLight.shadow.camera.top    =  d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.near   = 0.1;
    directionalLight.shadow.camera.far    = 100.0;
    directionalLight.shadow.bias = -0.0005;
    scene.add (directionalLight);
    // Debug icon helper
    directionalLightHelper = new THREE.DirectionalLightHelper (directionalLight, 10);
    // scene.add (directionalLightHelper);
    let shadowHelper = new THREE.CameraHelper (directionalLight.shadow.camera);
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
    player = new Player ();
    // player = new OrbitPlayer (renderer);
    scene.add (player);

    // Physics
    physics = new Physics (scene);

    // Setup GUI elements
    // stats is a popup gui that shows FPS
	stats = new Stats ();
	document.body.appendChild (stats.dom);
    ui = new UI (world, directionalLight, player, axesHelper, physics);
}
setup ();

// =======================================================================
// Draw loop - called once per frame

function draw (currentFrameTimeMS)
{
    const deltaTime = (currentFrameTimeMS - previousFrameTimeMS) * 0.001;
    previousFrameTimeMS = currentFrameTimeMS;
    world.update (player);
    physics.update (deltaTime, player, world);
    renderer.render (scene, player.camera);
    stats.update ();
    ui.update ();
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
}, false);

document.addEventListener ("keyup", (event) => {
    // Need to prevent normal commands like ctrl+R
    // This will not prevent commands like ctrl+W which closes the window
    event.preventDefault ();
    event.stopPropagation ();
    registerKeyUp (event);
}, false);
