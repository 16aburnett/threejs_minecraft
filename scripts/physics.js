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
import { BlockId } from "./blockId.js";
import { PlayerControlMode } from './player.js';
import { CHUNK_SIZE } from './chunk.js';
import { distanceSquared } from './utils.js';
import { ItemEntity } from './itemEntity.js';

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
        this.skipCurrentFrame = true;

        // TODO: This value should probably be defined in the world class
        // as different worlds could have different gravity - i.e. Moon.
        this.gravityAcceleration = 9.8; // meters/sec/sec

        // Debug helpers
        this.shouldShowHelpers = false;
        this.collisionCandidateHelpers = new THREE.Group ();
        scene.add (this.collisionCandidateHelpers);
        this.collisionPointHelpers = new THREE.Group ();
        scene.add (this.collisionPointHelpers);
    }
    
    // ===================================================================

    /**
     * Updates the physics simulation of the world by the given deltaTime.
     * @param {number} deltaTime - the amount of time (seconds) that has
     * passed since the last frame.
     * @param {Player} player - the player in the world.
     * @param {World} world - the world.
     * @param {any[]} entities - a list of physics compatable entities
     * that need their physics updated.
     */
    update (deltaTime, player, world, entities)
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

            // Apply gravity to entities
            if (player.controlMode == PlayerControlMode.NORMAL)
                player.velocity.y -= this.gravityAcceleration * deltaTime;
            for (const entity of entities)
                if (entity.isPhysicsEntity)
                    entity.velocity.y -= this.gravityAcceleration * deltaTime;

            // Update each entity's physics for this timestep
            player.updatePhysics (this.timestep);
            for (const entity of entities)
                if (entity.isPhysicsEntity)
                    entity.updatePhysics (this.timestep);

            // Resolve collisions
            if (player.controlMode != PlayerControlMode.NOCLIP)
                this.detectAndResolveCollisionsWithWorld (player, world);
            for (const entity of entities)
                if (entity.isPhysicsEntity)
                    this.detectAndResolveCollisionsWithWorld (entity, world);

            // Player should collect any item entities that they
            // collide with.
            this.collectCollidedItemEntities (player, world);

            // Move to next timestep
            this.accumulatedDeltaTime -= this.timestep;
        }
    }

    // ===================================================================

    /**
     * Pauses the physics simulation
     */
    pause ()
    {
        console.log ("Physics sim paused");
        this.accumulatedDeltaTime = 0;
        this.isPaused = true;
    }

    // ===================================================================

    /**
     * Resumes the physics simulation
     */
    resume ()
    {
        this.isPaused = false;
        this.skipCurrentFrame = true;
    }

    // ===================================================================

    /**
     * Detects and Resolves collisions with the given entity and the
     * world.
     * @param {THREE.Object3D} entity - the entity that could be colliding
     * with the world.
     * @param {World} world - the world that the entity can collide with.
     */
    detectAndResolveCollisionsWithWorld (entity, world)
    {
        // Initially assume that the entity is not on the ground
        // and collision detection will correct this.
        entity.isOnGround = false;

        // Broad Phase
        // the world has a lot things to potentially collide with
        // so we need to initially reduce the search space as much as
        // possible for performance.
        // We can achieve this by only checking block positions around
        // the entity's position.
        let candidates = this.getBlockCollisionCandidates (entity, world);

        // Narrow Phase
        // need to check if we are actually colliding with any of the
        // surrounding blocks.
        let collisions = this.determineCollisionsWithCandidates (
            candidates,
            entity
        );

        // Resolve Collisions
        // We need to correct the entity's position until the entity is no
        // longer colliding with any blocks.
        if (collisions.length > 0)
        {
            this.resolveCollisions (collisions, entity);
        }
    }

    // ===================================================================

    /**
     * Returns blocks that immediately surround the given entity's
     * position. This is a broad phase of collision detection.
     * @param {THREE.Object3D} entity - the entity who is possibly
     * colliding with the world.
     * @param {World} world - the world that the entity can collide with.
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
                    // Ensure that the block is collidable
                    if (block == BlockId.Air || block == BlockId.Water)
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
     * Returns a list of collisions between the given entity and
     * candidate blocks.
     * @param {Array} candidates - the objects that the entity is possibly
     * colliding with.
     * @param {any} entity - the entity to check for collisions
     */
    determineCollisionsWithCandidates (candidates, entity)
    {
        let collisions = [];

        for (let candidateBlockPosition of candidates)
        {
            // Find point on block that is closest to the center of the
            // entity's bounding cylinder.
            // This point can tell us if there is actually a collision,
            // and by how much.
            let blockSize = 1.0;
            let blockXMin = candidateBlockPosition.x;
            let blockXMax = candidateBlockPosition.x + blockSize;
            let blockYMin = candidateBlockPosition.y;
            let blockYMax = candidateBlockPosition.y + blockSize;
            let blockZMin = candidateBlockPosition.z;
            let blockZMax = candidateBlockPosition.z + blockSize;
            let entityCenterX = entity.position.x;
            let entityCenterY = entity.position.y + entity.height / 2;
            let entityCenterZ = entity.position.z;
            let closestPoint = new THREE.Vector3 (
                Math.max (blockXMin, Math.min (entityCenterX, blockXMax)),
                Math.max (blockYMin, Math.min (entityCenterY, blockYMax)),
                Math.max (blockZMin, Math.min (entityCenterZ, blockZMax)),
            );

            // Reject point if it is not within the entity's bounds
            if (!entity.isPointWithinCollisionMesh (closestPoint))
                continue;
            
            const [normal, overlap] = entity.calculateCollisionVector (
                closestPoint
            );

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

    resolveCollisions (collisions, entity)
    {
        // Sort collisions - small to largest overlap
        // This is helps reduce jerky movement
        collisions.sort ((a, b) => a.overlap < b.overlap);
        
        // resolve all collisions
        for (const collision of collisions)
        {
            // Since we are moving the entity's position,
            // we need to ensure that collisions still exist.
            if (!entity.isPointWithinCollisionMesh (
                collision.contactPoint
            ))
                continue;

            // adjust entity position to remove overlap/collision
            let deltaPosition = collision.normal.clone ();
            deltaPosition.multiplyScalar (collision.overlap);
            entity.position.add (deltaPosition);
            // Negate entity's velocity along the normal
            let magnitude = entity.getWorldVelocity ()
                .dot (collision.normal);
            let velocityAdjustment = collision.normal
                .clone ()
                .multiplyScalar (magnitude)
                .negate ();
            entity.applyWorldVelocity (velocityAdjustment);
        }
    }

    // ===================================================================

    collectCollidedItemEntities (player, world)
    {
        // Broad phase
        // determine collision candidates within a radius of player
        const candidates = this.getCloseItemEntities (player, world);

        // Narrowing phase
        // filter out candidates that are not colliding with player
        const collisions = this.determineCollisionsWithEntityCandidates (
            player,
            candidates
        );

        // Collect collided entities
        for (const collision of collisions)
        {
            if (collision.entity instanceof ItemEntity)
                player.collectItemEntity (collision.entity);
        }

    }

    // ===================================================================

    /**
     * Returns a list of entities from the world that are close to the
     * player.
     * @param {*} player 
     * @param {*} world 
     */
    getCloseItemEntities (player, world)
    {
        const playerCenterX = player.position.x;
        const playerCenterY = player.position.y + player.height * 0.5;
        const playerCenterZ = player.position.z;
        const entities = [];
        const closenessRadius = 3; // in blocks
        const closenessRadiusSquared = closenessRadius * closenessRadius;
        // determine containing chunk
        const chunkIndexX = Math.floor (player.position.x / CHUNK_SIZE);
        const chunkIndexZ = Math.floor (player.position.z / CHUNK_SIZE);
        // check 3x3 region of chunks
        // in case player is close to a chunk boundary
        for (let cx = chunkIndexX-1; cx <= chunkIndexX+1; ++cx)
        {
            for (let cz = chunkIndexZ-1; cz <= chunkIndexZ+1; ++cz)
            {
                const chunk = world.loadedChunks.get (`${cx},${cz}`);
                // Ensure chunk exists
                if (chunk == undefined)
                    continue;
                for (const entity of chunk.entities)
                {
                    const dx = entity.position.x - playerCenterX;
                    const dy = entity.position.y - playerCenterY;
                    const dz = entity.position.z - playerCenterZ;
                    const distSquared = dx * dx + dy * dy + dz * dz;
                    // Ensure entity is within radius
                    if (distSquared >= closenessRadiusSquared)
                        continue;
                    // Entity is within distance so save it as a candidate
                    entities.push (entity);
                }
            }
        }
        return entities;
    }

    // ===================================================================

    determineCollisionsWithEntityCandidates (player, candidates)
    {
        const collisions = [];
        for (const entity of candidates)
        {
            const halfWidth = entity.width * 0.5;
            // Find point on entity's mesh that is closest to the center
            // of the player's bounding cylinder.
            // This point can tell us if there is actually a collision
            const entityXMin = entity.position.x - halfWidth;
            const entityXMax = entity.position.x + halfWidth;
            const entityYMin = entity.position.y;
            const entityYMax = entity.position.y + entity.height;
            const entityZMin = entity.position.z - halfWidth;
            const entityZMax = entity.position.z + halfWidth;
            const playerCenterX = player.position.x;
            const playerCenterY = player.position.y + player.height * 0.5;
            const playerCenterZ = player.position.z;
            const closestPoint = new THREE.Vector3 (
                Math.max (entityXMin, Math.min (playerCenterX, entityXMax)),
                Math.max (entityYMin, Math.min (playerCenterY, entityYMax)),
                Math.max (entityZMin, Math.min (playerCenterZ, entityZMax)),
            );

            // Reject point if it is not within the player's bounds
            if (!player.isPointWithinCollisionMesh (closestPoint))
                continue;
            
            const [normal, overlap] = player.calculateCollisionVector (
                closestPoint
            );

            // Save the collision
            collisions.push ({
                entity,
                contactPoint: closestPoint,
                normal,
                overlap
            });
            this.addCollisionPointHelper (closestPoint);
        }
        return collisions;
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