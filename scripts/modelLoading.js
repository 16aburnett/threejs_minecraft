// Minecraft clone made with THREE.js
// Model loading
// By Amy Burnett
// =======================================================================
// Importing

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Layers } from './layers.js';

// =======================================================================

/**
 * Tries to load the model from the given filename.
 * This function immediately returns a THREE.Group object.
 * Loading the model happens asynchronously and will be populated to the
 * returned Group when it is successfully loaded. 
 * @param {string} modelFilename
 * @returns
 */
export function loadModel (modelFilename)
{
    const modelGroup = new THREE.Group ();

    const loader = new GLTFLoader ();
    loader.load (modelFilename, (gltf) => {
        const model = gltf.scene;
        // Need to make sure the mesh is not the default layer
        model.traverse ((child) => {
            if (child.isMesh) {
                child.layers.set (Layers.ItemEntities);
            }
        });
        // The model is drawn from the front,bottom,left corner
        // But we want to have it centered along the X
        model.position.x -= 0.5;
        modelGroup.add (model);
    });

    return modelGroup;
}
