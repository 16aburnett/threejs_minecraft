// Minecraft clone made with THREE.js
// MobEntity class (represents Mobs/animals in the world)
// By Amy Burnett
// =======================================================================
// Importing

import * as THREE from 'three';
import { Layers } from './layers.js';
import { BlockId } from './blockId.js';

// =======================================================================

export const MobBehaviorState = Object.freeze ({
    IDLE:    Symbol ("IDLE"),
    WALKING: Symbol ("WALKING"),
    // FLEE:    Symbol ("FLEE"),
    // FOLLOW:  Symbol ("FOLLOW")
});

// =======================================================================

export default class MobEntity extends THREE.Group
{
    /**
     * Constructs a MobEntity
     */
    constructor (world, {parentChunk = null} = {})
    {
        super ();

        this.world = world;
        this.parentChunk = parentChunk;

        // Mob behaviors
        this.behaviorState = MobBehaviorState.IDLE;
        this.currentBehaviorTime = 0;

        // Mob's local axes
        this.up      = new THREE.Vector3 (0, 1, 0);
        this.right   = new THREE.Vector3 (1, 0, 0);
        this.forward = new THREE.Vector3 (0, 0, 1);

        // Mob's size (in block units)
        this.width  = 0.75;
        this.height = 0.75;

        // Mob's Model
        // const mobGeometry = new THREE.SphereGeometry (this.width / 2, 32, 32);
        const mobGeometry = new THREE.ConeGeometry(this.width / 2, this.width, 16);
        const mobMaterial = new THREE.MeshStandardMaterial ({ color: 0x0077ff });
        this.mesh = new THREE.Mesh (mobGeometry, mobMaterial);
        // Cone starts facing up so rotate to point forwards
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.layers.set (Layers.ItemEntities);
        this.mesh.position.set (0, this.height * 0.5, 0);
        this.add (this.mesh);

        // Physics
        this.position.set (0, 100, 0);
        this.velocity = new THREE.Vector3 (0, 0, 0);
        this.walkSpeed = 0.5; // blocks/second
        this.runSpeed  = this.walkSpeed * 4; // blocks/second
        this.isRunning = false;
        this.airFrictionFactor = 0.95;
        this.groundFrictionFactor = 0.9;
        this.isOnGround = false;
        this.input = new THREE.Vector3 (0, 0, 0);
        this.panAmount = -Math.PI/2;
        this.jumpForce = 10; // blocks/second/second

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
            this.add (this.collisionMeshWireframe);

        // Forward point
        const forwardPointGeometry = new THREE.SphereGeometry (0.05);
        const forwardPointWireframe = new THREE.WireframeGeometry (forwardPointGeometry);
        this.forwardPointMesh = new THREE.LineSegments (forwardPointWireframe);
        this.forwardPointMesh.material.color = new THREE.Color (0x0000ff);
        this.forwardPointMesh.layers.set (Layers.Debug);
        this.add (this.forwardPointMesh);
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
        // Apply mob's input
        let speed = this.walkSpeed;
        if (this.isRunning) speed = this.runSpeed;
        this.velocity.addScaledVector (this.right  , speed * this.input.x);
        this.velocity.addScaledVector (this.up     , speed * this.input.y);
        this.velocity.addScaledVector (this.forward, speed * this.input.z);

        // Apply pan to mob
        // Note: tilt only applies to camera
        // up vector should always match global up
        this.forward.set (Math.cos (this.panAmount), 0, Math.sin (this.panAmount));
        this.forward.normalize ();
        this.right.set (Math.cos (this.panAmount - Math.PI/2), 0, Math.sin (this.panAmount - Math.PI/2));
        this.right.normalize ();
        this.mesh.rotation.z = this.panAmount - Math.PI / 2;

        // Apply friction dampener
        this.velocity.multiply (new THREE.Vector3 (this.airFrictionFactor, 1, this.airFrictionFactor));
        if (this.isOnGround)
            this.velocity.multiply (new THREE.Vector3 (this.groundFrictionFactor, 1, this.groundFrictionFactor));

        // Apply velocity
        this.position.addScaledVector (this.velocity, deltaTime);

        // We are basing the despawning timer on the physics engine
        this.secondsLeftTilDespawn -= deltaTime;
        this.secondsLeftTilCollectable -= deltaTime;
        this.currentBehaviorTime += deltaTime;
    }

    // ===================================================================

    update ()
    {
        this.handleBehavior ();
        this.updateForwardPoint ();
        // determine if we should despawn
        // if (this.secondsLeftTilDespawn < 0)
        // {
        //     console.log ("Mob entity timed out - despawning");
        //     this.despawn ();
        // }
    }

    // ===================================================================

    updateForwardPoint ()
    {
        this.forwardPointMesh.position.copy (this.forward);
        // Adjust for mob eye height
        this.forwardPointMesh.position.y += this.height / 2;
    }

    // ===================================================================

    handleBehavior ()
    {
        if (this.behaviorState == MobBehaviorState.IDLE)
        {
            this.input.z = 0;
            if (this.currentBehaviorTime > 5)
            {
                this.enterState (MobBehaviorState.WALKING);
            }
        }
        else if (this.behaviorState == MobBehaviorState.WALKING)
        {
            this.input.z = 1;
            if (this.isBlockInWay ())
                this.jump ();
            if (this.currentBehaviorTime > 2)
            {
                this.enterState (MobBehaviorState.IDLE);
            }
        }
    }

    // ===================================================================

    isBlockInWay ()
    {
        const pointInFront = this.position.clone ().add (this.forward);
        // Offset point from bottom of mob
        pointInFront.y += 0.5;
        const blockInFront = this.world.getBlockId (pointInFront.x, pointInFront.y, pointInFront.z);
        // Ensure the block isnt air
        if (blockInFront == BlockId.Air)
            return false;
        return true;
    }

    // ===================================================================

    jump ()
    {
        if (!this.isOnGround) return;
        this.velocity.y += this.jumpForce;
    }

    // ===================================================================

    /**
     * Handles what to do upon entering a state.
     * This handles any initialization for a state.
     * @param {*} state the state to enter
     */
    enterState (state)
    {
        // Resetting the time since we are entering a new state
        this.currentBehaviorTime = 0.0;
        if (state == MobBehaviorState.IDLE)
        {
            this.behaviorState = MobBehaviorState.IDLE;
        }
        else if (state == MobBehaviorState.WALKING)
        {
            this.behaviorState = MobBehaviorState.WALKING;
            // Face a random direction
            const randomAngle = Math.random () * Math.PI * 2;
            this.panAmount = randomAngle;
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
                if (Array.isArray (object.material))
                    for (const material of object.material)
                        material.dispose ();
                else if (object.material)
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
