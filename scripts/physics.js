// Minecraft clone made with THREE.js
// Physics class
// handles the physics between the entities and the world.
// This includes collision detection.
// I developed this class following this tutorial by Dan Greenheck:
// https://www.youtube.com/watch?v=_aK-1L-GC6I&list=PLtzt35QOXmkKALLv9RzT8oGwN5qwmRjTo&index=5
// By Amy Burnett
// December 2, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { BlockId } from "./blockData.js";
import { PlayerControlMode } from './player.js';

// =======================================================================
// Global variables

const collisionCandidateHighlightMaterial = new THREE.MeshBasicMaterial ({
    color: 0xff0000,
    transparent: true,
    opacity: 0.25
});
const collisionCandidateHighlightGeometry = new THREE.BoxGeometry (
    1.001,
    1.001,
    1.001
);
const collisionPointMaterial = new THREE.MeshBasicMaterial ({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.25
});
const collisionPointGeometry = new THREE.SphereGeometry (0.05);

// =======================================================================

export class Physics
{
    /**
     * Constructs a physics manager object
     * @param {THREE.Scene} scene - the main scene to add debug helpers to
     */
    constructor (scene)
    {
        // the number of timesteps per second
        this.simulationRate = 240;
        this.timestep = 1 / this.simulationRate;
        this.accumulatedDeltaTime = 0;
        this.isPaused = false;
        this.skipCurrentFrame = false;

        // TODO: This value should probably be defined in the world class
        // as different worlds could have different gravity - i.e. Moon.
        this.gravityAcceleration = 9.8; // meters/sec/sec

        // Debug helpers
        this.shouldShowHelpers = false;
        this.collisionCandidateHelpers = new THREE.Group ();
        scene.add (this.collisionCandidateHelpers);
        this.collisionPointHelpers = new THREE.Group ();
        scene.add (this.collisionPointHelpers);

        document.addEventListener (
            "visibilitychange",
            this.onVisibilitychange.bind (this)
        );
    }
    
    // ===================================================================

    /**
     * Updates the physics simulation of the world by the given deltaTime.
     * @param {number} deltaTime - the amount of time (seconds) that has
     * passed since the last frame.
     * @param {Player} player - the player in the world.
     * @param {World} world - the world.  
     */
    update (deltaTime, player, world)
    {
        // We need to skip the super long delta time
        if (this.skipCurrentFrame)
        {
            this.skipCurrentFrame = false;
            console.log ("Physics sim restored");
            return;
        }

        // The physics simulations are based on regular intervals,
        // but frames are calculated at irregular intervals
        // render frames      -|---|-----||--|----|----|--|----> time
        // physics timesteps  -|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-> time
        // This results in scenarios where multiple physics timesteps may
        // occur before the next frame or a frame may complete before
        // it is time for the next physics timestep.
        // For these scenarios, we need to accumulate the time since last
        // physics timestep.
        // This is meant to help smooth the motion of the physics
        // and to be platform independent.
        this.accumulatedDeltaTime += deltaTime;

        // Process all timesteps since last frame
        while (this.accumulatedDeltaTime >= this.timestep)
        {
            this.clearHelpers ();

            // Apply gravity to player
            if (player.controlMode == PlayerControlMode.NORMAL)
                player.velocity.y -= this.gravityAcceleration * deltaTime;

            // Update the player's physics for this timestep
            player.updatePhysics (this.timestep);

            if (player.controlMode != PlayerControlMode.NOCLIP)
                this.detectAndResolveCollisionsWithWorld (player, world);

            // Move to next timestep
            this.accumulatedDeltaTime -= this.timestep;
        }
    }

    // ===================================================================
    
    /**
     * Handles how the physics manager should react when the user
     * switches to or from this tab.
     * @param {*} event 
     */
    onVisibilitychange (event)
    {
        // when the user leaves the page, we want to suspend the physics
        // sim
        if (document.visibilityState === "hidden")
        {
            this.accumulatedDeltaTime = 0;
            console.log ("Physics sim paused");
            this.isPaused = true;
        }
        else
        {
            this.isPaused = false;
            this.skipCurrentFrame = true;
        }
    }

    // ===================================================================

    /**
     * Detects and Resolves collisions with the given player and the
     * world.
     * 
     * TODO: make this generalized so that this same algo can be applied
     * to any kind of entity (item entities, mobs, players, etc.).
     * @param {THREE.Object3D} player - the entity that could be colliding
     * with the world.
     * @param {World} world - the world that the player can collide with.
     */
    detectAndResolveCollisionsWithWorld (player, world)
    {
        // Initially assume that the player is not on the ground
        // and collision detection will correct this.
        player.isOnGround = false;

        // Broad Phase
        // the world has a lot things to potentially collide with
        // so we need to initially reduce the search space as much as
        // possible for performance.
        // We can achieve this by only checking block positions around
        // the player's position.
        let candidates = this.getBlockCollisionCandidates (player, world);

        // Narrow Phase
        // need to check if we are actually colliding with any of the
        // surrounding blocks.
        let collisions = this.determineCollisionsWithCandidates (
            candidates,
            player
        );

        // Resolve Collisions
        // We need to correct the player's position until the player is no
        // longer colliding with any blocks.
        if (collisions.length > 0)
        {
            this.resolveCollisions (collisions, player);
        }
    }

    // ===================================================================

    /**
     * Returns blocks that immediately surround the given entity's
     * position. This is a broad phase of collision detection.
     * @param {THREE.Object3D} entity - the entity who is possibly
     * colliding with the world.
     * @param {World} world - the world that the player can collide with.
     */ 
    getBlockCollisionCandidates (entity, world)
    {
        // Calculate bounds of the entity
        // This is essentially an AABB
        // which doesnt account for cylindrical collision boxes,
        // but is at least fine for the broad phase.
        let bounds = {
            x: {
                min: Math.floor (entity.position.x - entity.width * 0.5),
                max: Math.ceil (entity.position.x + entity.width * 0.5)
            },
            y: {
                min: Math.floor (entity.position.y),
                max: Math.ceil (entity.position.y + entity.height)
            },
            z: {
                min: Math.floor (entity.position.z - entity.width * 0.5),
                max: Math.ceil (entity.position.z + entity.width * 0.5)
            }
        };

        // Find all blocks within the entity's bounds
        let candidates = [];
        for (let x = bounds.x.min; x < bounds.x.max; ++x)
        {
            for (let y = bounds.y.min; y < bounds.y.max; ++y)
            {
                for (let z = bounds.z.min; z < bounds.z.max; ++z)
                {
                    const block = world.getBlockId (x, y, z);
                    // Ensure there is a block there
                    if (!block || block == BlockId.Air)
                        continue;
                    const blockPosition = new THREE.Vector3 (x, y, z);
                    candidates.push (blockPosition);
                    this.addCollisionCandidateHelper (blockPosition);
                }
            }
        }

        return candidates;
    }

    // ===================================================================

    /**
     * Returns a list of collisions between the given player and
     * candidate blocks.
     * @param {Array} candidates - the objects that the player is possibly
     * colliding with.
     * @param {Player} player - the player to check for collisions
     */
    determineCollisionsWithCandidates (candidates, player)
    {
        let collisions = [];

        for (let candidateBlockPosition of candidates)
        {
            // Find point on block that is closest to the center of the
            // player's bounding cylinder.
            // This point can tell us if there is actually a collision,
            // and by how much.
            let blockSize = 1.0;
            let blockXMin = candidateBlockPosition.x;
            let blockXMax = candidateBlockPosition.x + blockSize;
            let blockYMin = candidateBlockPosition.y;
            let blockYMax = candidateBlockPosition.y + blockSize;
            let blockZMin = candidateBlockPosition.z;
            let blockZMax = candidateBlockPosition.z + blockSize;
            let playerCenterX = player.position.x;
            let playerCenterY = player.position.y + player.height / 2;
            let playerCenterZ = player.position.z;
            let closestPoint = new THREE.Vector3 (
                Math.max (blockXMin, Math.min (playerCenterX, blockXMax)),
                Math.max (blockYMin, Math.min (playerCenterY, blockYMax)),
                Math.max (blockZMin, Math.min (playerCenterZ, blockZMax)),
            );

            // Reject point if it is not within the player's bounding
            // cylinder.
            if (!this.isPointWithinBoundingCylinder (closestPoint, player))
                continue;
            
            // Compute the overlap between the point and the player's
            // bounding cylinder. Essentially how far the player moved
            // past the block's collision mesh.
            let dx = closestPoint.x - playerCenterX;
            let dy = closestPoint.y - playerCenterY;
            let dz = closestPoint.z - playerCenterZ;
            let playerRadius = player.width * 0.5;
            let overlapXZ = playerRadius - Math.sqrt (dx * dx + dz * dz);
            let overlapY = player.height / 2 - Math.abs (dy);

            // Compute the normal of the collision. From the collision
            // point towards the player. Essentially the direction of
            // the collision.
            let normalXZ = new THREE.Vector3 (-dx, 0, -dz).normalize ();
            let normalY = new THREE.Vector3 (0, -Math.sign (dy), 0);

            // Only use the normal and overlap of the smaller change.
            // Smaller changes will be less jarring of a correction.
            let normal, overlap;
            if (overlapXZ < overlapY)
            {
                normal = normalXZ;
                overlap = overlapXZ;
            }
            else
            {
                normal = normalY;
                overlap = overlapY;
                player.isOnGround = true;
            }

            // Save the collision
            collisions.push ({
                candidateBlockPosition,
                contactPoint: closestPoint,
                normal,
                overlap
            });
            this.addCollisionPointHelper (closestPoint);
        }

        return collisions;
    }

    // ===================================================================

    resolveCollisions (collisions, player)
    {
        // Sort collisions - small to largest overlap
        // This is helps reduce jerky movement
        collisions.sort ((a, b) => a.overlap < b.overlap);
        
        // resolve all collisions
        for (const collision of collisions)
        {
            // Since we are moving the player's position,
            // we need to ensure that collisions still exist.
            if (!this.isPointWithinBoundingCylinder (
                collision.contactPoint,
                player
            ))
                continue;

            // adjust player position to remove overlap/collision
            let deltaPosition = collision.normal.clone ();
            deltaPosition.multiplyScalar (collision.overlap);
            player.position.add (deltaPosition);
            // Negate player's velocity alone the normal
            let magnitude = player.getWorldVelocity ()
                .dot (collision.normal);
            let velocityAdjustment = collision.normal
                .clone ()
                .multiplyScalar (magnitude)
                .negate ();
            player.applyWorldVelocity (velocityAdjustment);
        }
    }

    // ===================================================================

    /**
     * Returns true if the given point is within the bounding cylinder
     * of the given entity, otherwise false.
     * @TODO this logic should be implemented on the player's/entity's
     * class so that this can be generic (i.e. bounding cylinder vs box).
     * @param {THREE.Vector3} point - point to check
     * @param {Player} player - entity with the bounding cylinder
     * @returns
     */
    isPointWithinBoundingCylinder (point, player)
    {
        let dx = point.x - player.position.x;
        let dy = point.y - (player.position.y + player.height / 2);
        let dz = point.z - player.position.z;
        let radius = player.width * 0.5;

        // TODO: sqrt is slow, we can factor this out and compare against
        // radius squared 
        let distanceXZ = Math.sqrt (dx * dx + dz * dz);

        let withinXZ = Math.abs (distanceXZ) < radius;
        let withinY = Math.abs (dy) < (player.height / 2);
        
        return withinXZ && withinY;
    }

    // ===================================================================
    // Debug helpers
    // ===================================================================

    /**
     * Adds a helper to highlight the given block
     * @param {THREE.Vector3} blockPosition
     */
    addCollisionCandidateHelper (blockPosition)
    {
        // Ensure that we should be drawing helpers
        if (!this.shouldShowHelpers)
            return;

        const helperMesh = new THREE.Mesh (
            collisionCandidateHighlightGeometry,
            collisionCandidateHighlightMaterial
        );
        // Blocks are drawn from their center,
        // need to offset to match grid
        let blockOffset = 0.5;
        helperMesh.position.set (
            blockPosition.x + blockOffset,
            blockPosition.y + blockOffset,
            blockPosition.z + blockOffset
        );
        this.collisionCandidateHelpers.add (helperMesh);
    }

    // ===================================================================

    /**
     * Adds a helper to show the point of a collision
     * @param {THREE.Vector3} collisionPoint
     */
    addCollisionPointHelper (collisionPoint)
    {
        // Ensure that we should be drawing helpers
        if (!this.shouldShowHelpers)
            return;

        const helperMesh = new THREE.Mesh (
            collisionPointGeometry,
            collisionPointMaterial
        );
        helperMesh.position.set (
            collisionPoint.x,
            collisionPoint.y,
            collisionPoint.z
        );
        this.collisionPointHelpers.add (helperMesh);
    }

    // ===================================================================

    /**
     * Removes all helpers and ensures that their GPU resources are
     * disposed to avoid memory leaks.
     */
    clearHelpers ()
    {
        this.collisionCandidateHelpers.traverse ((obj) => {
            if (obj.dispose)
                obj.dispose ();
        });
        this.collisionCandidateHelpers.clear ();
        this.collisionPointHelpers.traverse ((obj) => {
            if (obj.dispose)
                obj.dispose ();
        });
        this.collisionPointHelpers.clear ();
    }
}