// Minecraft clone made with THREE.js
// Item entities - an in-world representation of an item
// By Amy Burnett
// =======================================================================
// Importing

import * as THREE from 'three';
import { itemStaticData } from './itemData.js';
import { Layers } from './layers.js';

// =======================================================================
// Globals


// =======================================================================

// Represents an in-world version of an item
export class ItemEntity extends THREE.Group
{
    constructor (itemStack, parentChunk)
    {
        super ();

        this.itemStack = itemStack;
        this.secondsLeftTilDespawn = 300.0;
        this.parentChunk = parentChunk;

        // Geometry
        this.width = 0.5;
        this.height = 0.5;
        // const geometry = new THREE.BoxGeometry (
        //     this.width,
        //     this.height,
        //     this.width
        // );
        const geometry = new THREE.PlaneGeometry (
            this.width,
            this.height
        );
        const textureFilename = itemStaticData[itemStack.item.itemId]
            .texture;
        const texture = new THREE.TextureLoader ().load (textureFilename);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Using nearest filter for crisp, non-blurry textures
        texture.magFilter = THREE.NearestFilter;
        // We need to set this, otherwise the textures look washed out
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshStandardMaterial ({
            // color: 0xff00ff,
            side: THREE.DoubleSide,
            map: texture
        });
        this.mesh = new THREE.Mesh (geometry, material);
        // The mesh needs to be offset since
        // planes are drawn from the center
        // and we want the center point to be the bottom of the plane
        this.mesh.position.y += this.height * 0.5;
        // Make sure this is a different layer to avoid raycasts
        this.mesh.layers.set (Layers.ItemEntities);
        this.add (this.mesh);
        this.rotationSpeed = 0.01;

        // Physics
        this.position.set (0, 0, 0);
        this.velocity = new THREE.Vector3 (0, 0, 0);
        this.airFrictionFactor = 0.99;
        this.groundFrictionFactor = 0.5;
        this.isOnGround = false;

        // Collision bounding box mesh
        this.shouldShowCollisionMesh = true;
        const collisionGeometry = new THREE.BoxGeometry (
            this.width,
            this.height,
            this.width
        );
        const collisionWireframe = new THREE.WireframeGeometry (
            collisionGeometry
        );
        this.collisionMeshWireframe = new THREE.LineSegments (
            collisionWireframe
        );
        // this.collisionMeshWireframe.material.depthTest = false;
        // this.collisionMeshWireframe.material.opacity = 0.25;
        // this.collisionMeshWireframe.material.transparent = true;
        this.collisionMeshWireframe.material.color = new THREE.Color (0xff0000);
        // Boxes are drawn from the center so offset
        // to match entity's position at the bottom
        this.collisionMeshWireframe.position.set (
            0,
            this.height * 0.5,
            0
        );
        this.collisionMeshWireframe.layers.set (Layers.Debug);
        if (this.shouldShowCollisionMesh)
            this.add(this.collisionMeshWireframe);

    }

    // ===================================================================

    /**
     * 
     * @returns the entity's velocity relative to the world
     */
    getWorldVelocity ()
    {
        let worldVelocity = this.velocity.clone ();
        worldVelocity.applyEuler (new THREE.Euler (0, 0, 0));
        return worldVelocity;
    }

    // ===================================================================

    /**
     * Applies a world velocity to the entity
     * @param {THREE.Vector} worldVelocity - the world velocity to apply
     * to the entity.
     */
    applyWorldVelocity (worldVelocity)
    {
        worldVelocity.applyEuler (new THREE.Euler (0, 0, 0));
        this.velocity.add (worldVelocity);
    }

    // ===================================================================

    // This handles the physics and movement of the entity
    updatePhysics (deltaTime)
    {
        // Apply friction dampener
        this.velocity.multiply (new THREE.Vector3 (this.airFrictionFactor, 1, this.airFrictionFactor));

        // Apply velocity
        this.position.addScaledVector (this.velocity, deltaTime);

        // We are basing the despawning timer on the physics engine
        this.secondsLeftTilDespawn -= deltaTime;
    }

    // ===================================================================

    update ()
    {
        this.mesh.rotation.y += this.rotationSpeed;
        // determine if we should despawn
        if (this.secondsLeftTilDespawn < 0)
        {
            console.log ("Item entity timed out - despawning");
            this.despawn ();
        }
    }

    // ===================================================================

    despawn ()
    {
        // remove from the world
        this.parent.remove (this);
        // remove from the chunk
        this.parentChunk.removeEntity (this);
        // ensure GPU resources are freed
        this.disposeGPUResources ();
    }

    // ===================================================================

    disposeGPUResources ()
    {
        this.traverse ((object) =>
        {
            if (object.isMesh)
            {
                if (object.geometry)
                    object.geometry.dispose ();
                if (object.material)
                    object.material.dispose ();
            }
        });
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
        const halfWidth = this.width * 0.5;
        const halfHeight = this.height * 0.5;
        const entityCenterX = this.position.x;
        const entityCenterY = this.position.y + halfHeight;
        const entityCenterZ = this.position.z;
        const dx = point.x - entityCenterX;
        const dy = point.y - entityCenterY;
        const dz = point.z - entityCenterZ;

        const isWithinX = Math.abs (dx) < halfWidth;
        const isWithinY = Math.abs (dy) < halfHeight;
        const isWithinZ = Math.abs (dz) < halfWidth;
        
        return isWithinX && isWithinY && isWithinZ;
    }

    // ===================================================================

    /**
     * Determines how far a point is inside from the collision mesh
     * boundaries and the normal vector of the collision.
     * @param {THREE.Vector3} point
     * @returns a list with the normal vector and the overlap amount.
     */
    calculateCollisionVector (point)
    {
        const halfWidth = this.width * 0.5;
        const halfHeight = this.height * 0.5;
        const entityCenterX = this.position.x;
        const entityCenterY = this.position.y + halfHeight;
        const entityCenterZ = this.position.z;
        const dx = point.x - entityCenterX;
        const dy = point.y - entityCenterY;
        const dz = point.z - entityCenterZ;
        // Compute the overlap between the point and the entity's
        // bounding box. Essentially how far the entity moved
        // past the block's collision mesh.
        const overlapX = halfWidth - Math.abs (dx);
        const overlapY = halfHeight - Math.abs (dy);
        const overlapZ = halfWidth - Math.abs (dz);
        
        // Compute the normal of the collision. From the collision
        // point towards the entity. Essentially the direction of
        // the collision.
        const normalX = new THREE.Vector3 (-Math.sign (dx), 0, 0);
        const normalY = new THREE.Vector3 (0, -Math.sign (dy), 0);
        const normalZ = new THREE.Vector3 (0, 0, -Math.sign (dz));

        // Only use the normal and overlap of the smaller change.
        // Smaller changes will be less jarring of a correction.
        let normal, overlap;
        if (overlapX < overlapY && overlapX < overlapZ)
        {
            normal = normalX;
            overlap = overlapX;
        }
        else if (overlapZ < overlapY && overlapZ < overlapX)
        {
            normal = normalZ;
            overlap = overlapZ;
        }
        else
        {
            normal = normalY;
            overlap = overlapY;
            this.isOnGround = true;
        }
        return [normal, overlap];
    }

}