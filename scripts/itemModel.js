// Minecraft clone made with THREE.js
// 3D Models for items
// By Amy Burnett
// =======================================================================
// Importing

import * as THREE from 'three';
import { itemStaticData } from './itemData.js';
import { Layers } from './layers.js';

// =======================================================================

/**
 * Creates and returns a box model of the given itemId.
 * This requires that the item has a textureFilenames field
 * @param {Number} itemId 
 */
export function createBlockModel (itemId)
{
    const itemData = itemStaticData[itemId];
    const blockSize = 0.5;
    const geometry = new THREE.BoxGeometry (blockSize, blockSize, blockSize);
    const loader = new THREE.TextureLoader ();
    const loadTexture = (filename) => {
        const texture = loader.load (filename);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    };
    const materials = [
        new THREE.MeshStandardMaterial ({map: loadTexture (itemData.textureFilenames.right)}),
        new THREE.MeshStandardMaterial ({map: loadTexture (itemData.textureFilenames.left)}),
        new THREE.MeshStandardMaterial ({map: loadTexture (itemData.textureFilenames.top)}),
        new THREE.MeshStandardMaterial ({map: loadTexture (itemData.textureFilenames.bottom)}),
        new THREE.MeshStandardMaterial ({map: loadTexture (itemData.textureFilenames.front)}),
        new THREE.MeshStandardMaterial ({map: loadTexture (itemData.textureFilenames.back)}),
    ];
    const mesh = new THREE.Mesh (geometry, materials);
    // this is ad hoc to mirror what we do with loaded models
    mesh.layers.set (Layers.ItemEntities);
    // Boxes are drawn from center, but we want it to be
    // drawn from the bottom
    mesh.position.y += blockSize * 0.5;
    // Adding to a group to mirror the behavior of loaded models
    // which are contained in a scene object
    const group = new THREE.Group ();
    group.add (mesh);
    return group;
}
