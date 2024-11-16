// Minecraft clone made with THREE.js
// Player class which uses simple orbit controls
// By Amy Burnett
// November 11, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// =======================================================================
// Global variables


// =======================================================================

export default class OrbitPlayer extends THREE.Group
{
    constructor (renderer)
    {
        super ();
        this.camera = new THREE.PerspectiveCamera (45, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set (0, 0, 250);
        this.camera.lookAt (0, 0, 0);
        this.add (this.camera);
        this.controls = new OrbitControls (this.camera, renderer.domElement);
    }

    // ===================================================================

    update ()
    {
        this.controls.update ();
    }

}
