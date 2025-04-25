// THREE.js Minecraft - Chunk
// The Minecraft world is divided up into chunks
// Chunks are NxNxWORLD_HEIGHT columns of blocks
// Chunks are further divided up by subchunks which are
//    NxNxN cubes of blocks.
// Chunking exists to allow for easier rendering, generating, and 
//    loading/unloading of parts of the seemingly infinite world.
// By Amy Burnett
// September 30, 2024
// =======================================================================
// Importing

import * as THREE from 'three';
import { BlockId, BlockStrings } from "./blockId.js";
import { blockData } from './blockData.js'
import { Layers } from './layers.js';
import { biomeStaticData } from './biomeData.js';
import { BiomeStrings } from './biomeId.js';
import MobEntity from './mobEntity.js';

// =======================================================================
// Global variables

export const WORLD_HEIGHT = 128;
export const CHUNK_SIZE = 16;

// Texture Atlas
const blockTextureAtlas = new THREE.TextureLoader ()
.load ("assets/block_texture_atlas.png");
blockTextureAtlas.wrapS = THREE.RepeatWrapping;
blockTextureAtlas.wrapT = THREE.RepeatWrapping;
// Using nearest filter for crisp, non-blurry textures
blockTextureAtlas.magFilter = THREE.NearestFilter;
// We need to set this, otherwise the textures look washed out
blockTextureAtlas.colorSpace = THREE.SRGBColorSpace;
// blockTextureAtlas.repeat.set (0.5, 0.5);

// const solidBlockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff});
const solidBlockMaterial = new THREE.MeshStandardMaterial ({
    color: 0xffffff,
    map: blockTextureAtlas
});
solidBlockMaterial.onBeforeCompile = function (shader)
{
    shader.vertexShader=shader.vertexShader.replace (
        "void main() {",

        "attribute vec2 myOffset;\n"+
        "void main() {"
    );
    shader.vertexShader=shader.vertexShader.replace (
        "#include <uv_vertex>",

        "#include <uv_vertex>\n"+
        "vMapUv = vMapUv+myOffset;"
    );
    // document.body.innerText=shader.fragmentShader;
    // document.body.innerText=shader.vertexShader;
};

const waterBlockMaterial = new THREE.MeshStandardMaterial ({
    color: 0xccddff,
    map: blockTextureAtlas,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
});
waterBlockMaterial.onBeforeCompile = function (shader)
{
    shader.vertexShader=shader.vertexShader.replace (
      "void main() {",
  
      "attribute vec2 myOffset;\n"+
      "void main() {"
    );
    shader.vertexShader=shader.vertexShader.replace (
      "#include <uv_vertex>",
  
      "#include <uv_vertex>\n"+
      "vMapUv = vMapUv+myOffset;"
    );
    // document.body.innerText=shader.fragmentShader;
    // document.body.innerText=shader.vertexShader;
};

// Rotation matrices for rotating faces the correct way
const rotationMatrixX = new THREE.Matrix4 ().makeRotationX (Math.PI / 2);
const rotationMatrixXNeg = new THREE.Matrix4 ().makeRotationX (-Math.PI / 2);
const rotationMatrixY = new THREE.Matrix4 ().makeRotationY (Math.PI / 2);
const rotationMatrixYNeg = new THREE.Matrix4 ().makeRotationY (-Math.PI / 2);
const rotationMatrixBack = new THREE.Matrix4 ().makeRotationY (Math.PI);

// =======================================================================

export class Chunk extends THREE.Group
{
    constructor (chunkIndexX, chunkIndexZ, shouldShowChunkBoundaries, world)
    {
        super ();

        // save a reference to the parent world
        // for being able to check blocks outside this chunk.
        // Note: this feels very ad hoc. Maybe the solution is to put
        // these methods on the world class and only use the chunk
        // classes as shells?
        this.world = world;

        // Chunk size for X,Z directions
        this.size = CHUNK_SIZE;

        // The chunk index
        this.chunkIndexX = chunkIndexX;
        this.chunkIndexZ = chunkIndexZ;
        this.chunkPosX = this.chunkIndexX * this.size;
        this.chunkPosY = 0;
        this.chunkPosZ = this.chunkIndexZ * this.size;
        this.position.set (this.chunkPosX, this.chunkPosY, this.chunkPosZ);
        
        // stores block information
        // Ex: {id, faceInstanceIds: [], blockEntity?: undefined}
        // indexed by block position
        this.data = [];
        this.initialize ();

        // Chunks keep track of the entities within them
        this.entities = [];

        // By default, chunks contain no blocks
        this.needsTerrainGeneration = true;
        this.needsMeshGeneration = true;

        // Solid Block Geometry
        // Note: We need a new geometry for each chunk
        // since we set textureUVs for each chunk
        const solidBlockFaceGeometry = new THREE.PlaneGeometry (1, 1, 1);
        // Adjust Plane UVs to represent the size of a texture
        // We will pass texture offsets to the shader to pick which texture to use
        // V component seems weird, might be subtractive?
        // so V starts at 1.0 to 0.95 for the top row of textures
        solidBlockFaceGeometry.attributes.uv.array[0] = 0.00;
        solidBlockFaceGeometry.attributes.uv.array[1] = 1.00;
        solidBlockFaceGeometry.attributes.uv.array[2] = 0.10;
        solidBlockFaceGeometry.attributes.uv.array[3] = 1.00;
        solidBlockFaceGeometry.attributes.uv.array[4] = 0.00;
        solidBlockFaceGeometry.attributes.uv.array[5] = 0.95;
        solidBlockFaceGeometry.attributes.uv.array[6] = 0.10;
        solidBlockFaceGeometry.attributes.uv.array[7] = 0.95;
        // InstancedMesh needs to know the max number of meshes
        const maxFacesPerBlock = 6;
        const maxCount = this.size*WORLD_HEIGHT*this.size*maxFacesPerBlock;
        this.solidBlockMesh = new THREE.InstancedMesh (
            solidBlockFaceGeometry,
            solidBlockMaterial,
            maxCount
        );
        this.solidBlockMesh.count = 0;
        this.solidBlockMesh.receiveShadow = true;
        this.solidBlockMesh.castShadow = true;
        // Adding textureUVs array to the mesh for better organization
        this.solidBlockMesh.userData.textureUVs = new THREE.InstancedBufferAttribute (new Float32Array (maxCount*2), 2);
        solidBlockFaceGeometry.setAttribute ('myOffset', this.solidBlockMesh.userData.textureUVs);
        // This maps face instance ids to their cooresponding block
        // position.
        // [instance0: Vec3{x, y, z}, instance1: Vec3{x, y, z}]
        // Since instance ids are always 0 to NUM_INSTANCES, we can use
        // a list instead of a map
        this.solidBlockMesh.userData.getBlockPos = [];

        // Water Block Geometry
        // Note: We need a new geometry for each chunk
        // since we set textureUVs for each chunk
        const waterBlockFaceGeometry = new THREE.PlaneGeometry (1, 1, 1);
        // Adjust Plane UVs to represent the size of a texture
        // We will pass texture offsets to the shader to pick which texture to use
        // V component seems weird, might be subtractive?
        // so V starts at 1.0 to 0.95 for the top row of textures
        waterBlockFaceGeometry.attributes.uv.array[0] = 0.00;
        waterBlockFaceGeometry.attributes.uv.array[1] = 1.00;
        waterBlockFaceGeometry.attributes.uv.array[2] = 0.10;
        waterBlockFaceGeometry.attributes.uv.array[3] = 1.00;
        waterBlockFaceGeometry.attributes.uv.array[4] = 0.00;
        waterBlockFaceGeometry.attributes.uv.array[5] = 0.95;
        waterBlockFaceGeometry.attributes.uv.array[6] = 0.10;
        waterBlockFaceGeometry.attributes.uv.array[7] = 0.95;
        this.waterBlockMesh = new THREE.InstancedMesh (
            waterBlockFaceGeometry,
            waterBlockMaterial,
            maxCount
        );
        this.waterBlockMesh.count = 0;
        // we need to disable shodows bc it looks strange
        // this.waterBlockMesh.receiveShadow = true;
        this.waterBlockMesh.castShadow = true;
        // Adding textureUVs array to the mesh for better organization
        this.waterBlockMesh.userData.textureUVs = new THREE.InstancedBufferAttribute (new Float32Array (maxCount*2), 2);
        waterBlockFaceGeometry.setAttribute ('myOffset', this.waterBlockMesh.userData.textureUVs);
        // This maps face instance ids to their cooresponding block
        // position.
        // [instance0: Vec3{x, y, z}, instance1: Vec3{x, y, z}]
        // Since instance ids are always 0 to NUM_INSTANCES, we can use
        // a list instead of a map
        this.waterBlockMesh.userData.getBlockPos = [];

        // Debug chunk wireframe border
        this.shouldShowChunkBoundaries = shouldShowChunkBoundaries;
        this.debugWireframe = null;
    }
    
    // ===================================================================

    initialize ()
    {
        this.data = [];
        for (let x = 0; x < this.size; ++x)
        {
            this.data.push ([]);
            for (let y = 0; y < WORLD_HEIGHT; ++y)
            {
                this.data[x].push ([]);
                for (let z = 0; z < this.size; ++z)
                {
                    // We dont yet have mesh instances so set to null
                    // for now.
                    this.data[x][y].push (
                        {
                            id: BlockId.Air,
                            faceInstanceIds: []
                        }
                    );
                }
            }
        }
    }

    // ===================================================================

    update ()
    {
        for (const mesh of [this.solidBlockMesh, this.waterBlockMesh])
        {
            // This logic exists in the update loop so that we only
            // compute the bounding sphere once per frame instead of
            // once per update to the mesh which would tank performance.
            if (mesh.userData.needsBoundingSphereUpdate)
            {
                mesh.computeBoundingSphere ();
                mesh.userData.needsBoundingSphereUpdate = false;
            }
        }
    }

    // ===================================================================

    spawnMob ()
    {
        // Ensure chunk's terrain was generated for mob to spawn
        if (this.needsMeshGeneration || this.needsTerrainGeneration)
            return;

        // Try to spawn mob in a random location
        const randomIndexX = Math.floor (Math.random () * CHUNK_SIZE);
        const randomIndexZ = Math.floor (Math.random () * CHUNK_SIZE);
        const randomX = this.chunkPosX + randomIndexX;
        const randomZ = this.chunkPosZ + randomIndexZ;

        const biome = this.world.getBiome (randomX, 0, randomZ);

        // Ensure there are mobs to spawn
        if (biomeStaticData[biome].spawnableMobs.length == 0)
            return;

        // Determine what mob we should spawn
        const randomI = Math.floor (Math.random () * biomeStaticData[biome].spawnableMobs.length);
        const mobId = biomeStaticData[biome].spawnableMobs[randomI];

        // Determine where the surface is so we know where to
        // spawn the mob
        // Note: this method of finding the surface is not
        // performant.
        // Also this might not be a true assumption
        let y = 0;
        for ( ; y < WORLD_HEIGHT; ++y)
        {
            const blockId = this.world.getBlockId (randomX, y, randomZ);
            if (blockId == biomeStaticData[biome].surfaceBlock)
                break;
        }
        // Ensure that we found the surface
        if (y >= WORLD_HEIGHT)
        {
            // no surface so just dont spawn a mob here
            console.log ("nowhere to spawn mob at", randomX, y, randomZ);
            return;
        }
        const surfaceHeight = y;

        // Spawn mob
        console.log ("spawning mob at", randomX, surfaceHeight, randomZ);
        const mob = new MobEntity (mobId, this.world);
        mob.position.set (randomX, surfaceHeight + 0.5, randomZ);
        this.world.addEntity (mob);
    }

    // ===================================================================

    // disposes of the GPU related resources for this chunk to free memory
    disposeInstances ()
    {
        for (const mesh of [this.solidBlockMesh, this.waterBlockMesh])
        {
            mesh.geometry.dispose ();
            mesh.material.dispose ();
            this.traverse ((obj) => {
                // Note that if you console log the obj here, then
                // the memory is not released? not sure why
                if (obj.dispose)
                {
                    obj.dispose ();
                }
            });
            this.clear ();
            // remove all instances from block data
            // we dont want to loop through all blocks as that would
            // be very slow so use the instance:block lookup
            for (let blockPos of mesh.userData.getBlockPos)
            {
                const block = this.getBlock (
                    blockPos.x,
                    blockPos.y,
                    blockPos.z
                );
                block.faceInstanceIds = [];
            }
            mesh.count = 0;
            mesh.userData.getBlockPos.length = 0;
        }
    }

    // ===================================================================

    generateMeshes ()
    {
        // Need to clear the previous data
        this.disposeInstances ();

        // Generate instances for each block in this chunk
        for (let chunkLocalx = 0; chunkLocalx < this.size; ++chunkLocalx)
        {
            for (let chunkLocaly = 0; chunkLocaly < WORLD_HEIGHT; ++chunkLocaly)
            {
                for (let chunkLocalz = 0; chunkLocalz < this.size; ++chunkLocalz)
                {
                    this.addBlockFaceInstances (chunkLocalx, chunkLocaly, chunkLocalz);
                }
            }
        }

        // Tell the mesh that it needs to update
        for (const mesh of [this.solidBlockMesh, this.waterBlockMesh])
        {
            mesh.instanceMatrix.needsUpdate = true;
            // mesh.computeBoundingSphere ();
            mesh.userData.textureUVs.needsUpdate = true;
            mesh.userData.needsBoundingSphereUpdate = true;

            this.add (mesh);
        }

        // Debug wireframe
        if (this.shouldShowChunkBoundaries)
        {
            this.addDebugWireframe ();
        }

        this.needsMeshGeneration = false;
    }

    // ===================================================================

    addDebugWireframe ()
    {
        if (this.debugWireframe == null)
            this.debugWireframe = new THREE.LineSegments (
                new THREE.WireframeGeometry (
                    new THREE.BoxGeometry (CHUNK_SIZE, WORLD_HEIGHT, CHUNK_SIZE)
                )
            );
        // box is drawn from the center
        // so we need to shift it to match 0,0,0 being the
        // left,bottom,back position
        this.debugWireframe.position.set (CHUNK_SIZE/2, WORLD_HEIGHT/2, CHUNK_SIZE/2);
        this.debugWireframe.material.opacity = 0.75;
        this.debugWireframe.material.transparent = true;
        this.debugWireframe.layers.set (Layers.Debug);
        this.add(this.debugWireframe);
    }

    // ===================================================================

    removeDebugWireframe ()
    {
        if (this.debugWireframe && this.debugWireframe.dispose)
            this.debugWireframe.dispose ();
        this.remove (this.debugWireframe);
    }

    // ===================================================================

    toggleChunkBoundaries ()
    {
        if (this.shouldShowChunkBoundaries)
        {
            this.shouldShowChunkBoundaries = false;
            this.removeDebugWireframe ();
        }
        else
        {
            this.shouldShowChunkBoundaries = true;
            this.addDebugWireframe ();
        }
    }

    // ===================================================================

    /**
     * Removes the block at the given position from the chunk
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    removeBlock (x, y, z)
    {
        const block = this.getBlock (x, y, z);
        if (block && block.id !== BlockId.Air)
        {
            // Remove block faces from mesh
            this.removeBlockFaceInstances (x, y, z);
            // Remove from data structure
            this.setBlockId (x, y, z, BlockId.Air);
        }
    }

    // ===================================================================

    /**
     * Adds the block with the given block id at the given position
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @param {*} blockId
     */
    addBlock (x, y, z, blockId)
    {
        const block = this.getBlock (x, y, z);
        if (block && block.id === BlockId.Air)
        {
            this.setBlockId (x, y, z, blockId);
            this.addBlockFaceInstances (x, y, z);
        }
    }

    // ===================================================================

    /**
     * Removes the face instances for the block at the given position.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    removeBlockFaceInstances (x, y, z)
    {
        const block = this.getBlock (x, y, z);
        if (!block) return;

        // Remove each face of the block from the mesh
        for (let i = block.faceInstanceIds.length - 1; i >= 0; --i)
        {
            let mesh = this.solidBlockMesh;
            if (block.id == BlockId.Water)
                mesh = this.waterBlockMesh;

            // To remove an instance from a mesh, we are only allowed to
            // decrement the number of meshes, so we can swap the
            // instance that we want to remove with the last instance
            // in the mesh, and then decrement the instance count.

            // Get this instance's info
            const thisInstanceId = block.faceInstanceIds[i];
            // We dont need to actually get the matrix
            // bc we are throwing it away
            // const thisInstanceMatrix = new THREE.Matrix4 ();
            // mesh.getMatrixAt (thisInstanceId, thisInstanceMatrix);

            // Get the last instance's info
            const lastInstanceId = mesh.count - 1;
            const lastInstanceMatrix = new THREE.Matrix4 ();
            mesh.getMatrixAt (lastInstanceId, lastInstanceMatrix);
            const lastInstancesBlock = mesh.userData.getBlockPos[lastInstanceId].clone ();
            const lastBlockFaceInstanceIds = this.data[lastInstancesBlock.x][lastInstancesBlock.y][lastInstancesBlock.z].faceInstanceIds;
            const lastBlockTextureU = mesh.userData.textureUVs.array[lastInstanceId * 2 + 0];
            const lastBlockTextureV = mesh.userData.textureUVs.array[lastInstanceId * 2 + 1];

            // Replace this face instance with the last face instance
            // this face's matrix is now the last matrix
            mesh.setMatrixAt (thisInstanceId, lastInstanceMatrix);
            // this face's block is now the last
            mesh.userData.getBlockPos[thisInstanceId] = lastInstancesBlock;
            // the last block gets this face's id
            for (let i = 0; i < lastBlockFaceInstanceIds.length; ++i)
                if (lastBlockFaceInstanceIds[i] == lastInstanceId)
                    lastBlockFaceInstanceIds[i] = thisInstanceId;
            // replace this instances texture coords with last
            mesh.userData.textureUVs.array[thisInstanceId * 2 + 0] = lastBlockTextureU;
            mesh.userData.textureUVs.array[thisInstanceId * 2 + 1] = lastBlockTextureV;
            mesh.userData.textureUVs.needsUpdate = true;

            // Decrement instance count to remove the face instance
            mesh.count -= 1;
            mesh.userData.getBlockPos.length -= 1;

            // Tell the mesh that it needs to update
            mesh.instanceMatrix.needsUpdate = true;
            // mesh.computeBoundingSphere ();
            mesh.userData.needsBoundingSphereUpdate = true;

            // Remove face from block
            block.faceInstanceIds.splice (i, 1);
        }
        // block.faceInstanceIds should now be empty
    }

    // ===================================================================

    /**
     * Adds face instances for the block at the given position.
     * @param {*} x - the chunk local x position of the block
     * @param {*} y - the chunk local y position of the block
     * @param {*} z - the chunk local z position of the block
     */
    addBlockFaceInstances (x, y, z)
    {
        const block = this.getBlock (x, y, z);
        const blockPosition = new THREE.Vector3 (x, y, z);
        // Ensure it was a valid block
        if (!block)
            return;
        // Ensure there is a block there to show
        const blockId = block.id;
        if (blockId == BlockId.Air)
            return;
        // Ensure block is not obscured
        if (this.isBlockObscured (x, y, z))
            return;

        // Determine what mesh this instance belongs to
        let mesh = this.solidBlockMesh;
        if (blockId == BlockId.Water)
            mesh = this.waterBlockMesh;

        const isBlockTransparent = blockData[blockId].isTransparent;

        // Planes are drawn from the center
        // so offset to draw from corner
        // This will align blocks to Minecraft Coords
        const halfBlockSize = 0.5;
        const blockCornerX = x + halfBlockSize;
        const blockCornerY = y + halfBlockSize;
        const blockCornerZ = z + halfBlockSize;
        const worldX = this.position.x + x;
        const worldY = this.position.y + y;
        const worldZ = this.position.z + z;

        // We want to avoid adding duplicate faces for if faces
        // already exist for this block so initially remove all faces.
        // this should essentially be a noop if there are no faces
        this.removeBlockFaceInstances (x, y, z);

        let matrix = new THREE.Matrix4 ();
        // Up face
        let neighborId = this.world.getBlockId (worldX, worldY+1, worldZ);
        let isNeighborTransparent = blockData[neighborId].isTransparent;
        let isNeighborAir = neighborId == BlockId.Air;
        let shouldAddFace = (isBlockTransparent && isNeighborAir) || (!isBlockTransparent && isNeighborTransparent);
        if (shouldAddFace)
        {
            const instanceId = mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixXNeg);
            matrix.setPosition (blockCornerX, blockCornerY + halfBlockSize, blockCornerZ);
            mesh.setMatrixAt (instanceId, matrix);
            // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            mesh.userData.getBlockPos.push (blockPosition);
            mesh.userData.textureUVs.array[mesh.count * 2 + 0] = blockData[blockId].textureUVs.top[0];
            mesh.userData.textureUVs.array[mesh.count * 2 + 1] = blockData[blockId].textureUVs.top[1];
            mesh.userData.textureUVs.needsUpdate = true;
            mesh.count += 1;
        }
        // Down face
        neighborId = this.world.getBlockId (worldX, worldY-1, worldZ);
        isNeighborTransparent = blockData[neighborId].isTransparent;
        isNeighborAir = neighborId == BlockId.Air;
        // ensure we dont render faces under the map that wont be seen
        let isBottomBlock = worldY == 0;
        shouldAddFace = (isBlockTransparent && isNeighborAir) || (!isBlockTransparent && isNeighborTransparent);
        if (shouldAddFace && !isBottomBlock)
        {
            const instanceId = mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixX);
            matrix.setPosition (blockCornerX, blockCornerY - halfBlockSize, blockCornerZ);
            mesh.setMatrixAt (instanceId, matrix);
            // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            mesh.userData.getBlockPos.push (blockPosition);
            mesh.userData.textureUVs.array[mesh.count * 2 + 0] = blockData[blockId].textureUVs.bottom[0];
            mesh.userData.textureUVs.array[mesh.count * 2 + 1] = blockData[blockId].textureUVs.bottom[1];
            mesh.userData.textureUVs.needsUpdate = true;
            mesh.count += 1;
        }
        // Left face
        neighborId = this.world.getBlockId (worldX-1, worldY, worldZ);
        isNeighborTransparent = blockData[neighborId].isTransparent;
        isNeighborAir = neighborId == BlockId.Air;
        shouldAddFace = (isBlockTransparent && isNeighborAir) || (!isBlockTransparent && isNeighborTransparent);
        if (shouldAddFace)
        {
            const instanceId = mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixYNeg);
            matrix.setPosition (blockCornerX - halfBlockSize, blockCornerY, blockCornerZ);
            mesh.setMatrixAt (instanceId, matrix);
            // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            mesh.userData.getBlockPos.push (blockPosition);
            mesh.userData.textureUVs.array[mesh.count * 2 + 0] = blockData[blockId].textureUVs.left[0];
            mesh.userData.textureUVs.array[mesh.count * 2 + 1] = blockData[blockId].textureUVs.left[1];
            mesh.userData.textureUVs.needsUpdate = true;
            mesh.count += 1;
        }
        // Right face
        neighborId = this.world.getBlockId (worldX+1, worldY, worldZ);
        isNeighborTransparent = blockData[neighborId].isTransparent;
        isNeighborAir = neighborId == BlockId.Air;
        shouldAddFace = (isBlockTransparent && isNeighborAir) || (!isBlockTransparent && isNeighborTransparent);
        if (shouldAddFace)
        {
            const instanceId = mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixY);
            matrix.setPosition (blockCornerX + halfBlockSize, blockCornerY, blockCornerZ);
            mesh.setMatrixAt (instanceId, matrix);
            // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            mesh.userData.getBlockPos.push (blockPosition);
            mesh.userData.textureUVs.array[mesh.count * 2 + 0] = blockData[blockId].textureUVs.right[0];
            mesh.userData.textureUVs.array[mesh.count * 2 + 1] = blockData[blockId].textureUVs.right[1];
            mesh.userData.textureUVs.needsUpdate = true;
            mesh.count += 1;
        }
        // Front face
        neighborId = this.world.getBlockId (worldX, worldY, worldZ+1);
        isNeighborTransparent = blockData[neighborId].isTransparent;
        isNeighborAir = neighborId == BlockId.Air;
        shouldAddFace = (isBlockTransparent && isNeighborAir) || (!isBlockTransparent && isNeighborTransparent);
        if (shouldAddFace)
        {
            const instanceId = mesh.count;
            matrix.identity ();
            // No Rotation needed
            matrix.setPosition (blockCornerX, blockCornerY, blockCornerZ + halfBlockSize);
            mesh.setMatrixAt (instanceId, matrix);
            // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            mesh.userData.getBlockPos.push (blockPosition);
            mesh.userData.textureUVs.array[mesh.count * 2 + 0] = blockData[blockId].textureUVs.front[0];
            mesh.userData.textureUVs.array[mesh.count * 2 + 1] = blockData[blockId].textureUVs.front[1];
            mesh.userData.textureUVs.needsUpdate = true;
            mesh.count += 1;
        }
        // Back face
        neighborId = this.world.getBlockId (worldX, worldY, worldZ-1);
        isNeighborTransparent = blockData[neighborId].isTransparent;
        isNeighborAir = neighborId == BlockId.Air;
        shouldAddFace = (isBlockTransparent && isNeighborAir) || (!isBlockTransparent && isNeighborTransparent);
        if (shouldAddFace)
        {
            const instanceId = mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixBack);
            matrix.setPosition (blockCornerX, blockCornerY, blockCornerZ - halfBlockSize);
            mesh.setMatrixAt (instanceId, matrix);
            // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            mesh.userData.getBlockPos.push (blockPosition);
            mesh.userData.textureUVs.array[mesh.count * 2 + 0] = blockData[blockId].textureUVs.back[0];
            mesh.userData.textureUVs.array[mesh.count * 2 + 1] = blockData[blockId].textureUVs.back[1];
            mesh.userData.textureUVs.needsUpdate = true;
            mesh.count += 1;
        }

        // Tell the mesh that it needs to update
        mesh.instanceMatrix.needsUpdate = true;
        // Cannot call this here bc it is very expensive
        // mesh.computeBoundingSphere ();
        mesh.userData.needsBoundingSphereUpdate = true;

    }

    // ===================================================================

    /**
     * Removes the given entity from this chunk
     * @param {*} entity the entity to remove
     */
    removeEntity (entity)
    {
        const index = this.entities.indexOf (entity);
        // Ensure entity exists
        if (index === -1)
        {
            console.log ("Could not find entity in this chunk");
            return;
        }
        this.entities.splice (index, 1);
    }

    // ===================================================================

    /**
     * Adds the given entity to this chunk
     * @param {*} entity the entity to add
     */
    addEntity (entity)
    {
        this.entities.push (entity);
    }

    // ===================================================================
    // Helper functions
    // ===================================================================

    /**
     * Returns the block data of the block at the given position.
     * Returns null if given position is out of bounds
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    getBlock (x, y, z)
    {
        if (this.isInBounds (x, y, z))
            return this.data[x][y][z];
        return null;
    }

    // ===================================================================

    /**
     * Returns the block id of the block at the given position.
     * Returns Air if position is out of bounds
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    getBlockId (x, y, z)
    {
        if (this.isInBounds (x, y, z))
            return this.data[x][y][z].id;
        return BlockId.Air;
    }

    // ===================================================================

    /**
     * Sets the id of the block at the given position to the given
     * block id.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @param {*} id 
     * @returns 
     */
    setBlockId (x, y, z, id)
    {
        if (!this.isInBounds (x, y, z))
            return
        // Ensure previous block's entity is removed if it had one
        const previousEntity = this.data[x][y][z].blockEntity;
        if (previousEntity != undefined)
        {
            console.log ("Destroying associated BlockEntity");
            // Remove block entity from the list
            this.removeEntity (previousEntity);
            previousEntity.removeFromParent ();
            this.data[x][y][z].blockEntity = undefined;
        }
        this.data[x][y][z].id = id;
        // we changed a block in this chunk so we need to update the mesh
        // commenting this out as rebuilding the whole chunk for a single
        // block would be very slow
        // this.needsMeshGeneration = true;
        // Check if block needs an associated entity
        const needsEntity = blockData[id].getBlockEntity != undefined;
        if (needsEntity)
        {
            const blockEntity = blockData[id].getBlockEntity ();
            // Need to make sure blockentity has the correct location
            // since position dictates which chunk the entity is saved with
            blockEntity.position.set (this.chunkPosX + x, this.chunkPosY + y, this.chunkPosZ + z);
            console.log ("Adding block entity", blockEntity);
            this.data[x][y][z].blockEntity = blockEntity;
            this.world.addEntity (blockEntity);
        }
    }

    // ===================================================================

    /**
     * Returns true if the given chunk local position is within the bounds
     * of this chunk, false otherwise.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    isInBounds (x, y, z)
    {
        return 0 <= x && x < this.size &&
               0 <= y && y < WORLD_HEIGHT &&
               0 <= z && z < this.size;
    }

    // ===================================================================

    /**
     * Returns true if the block at the given chunk local position is
     * obscured, false otherwise.
     * A solid block is obscured if all surrounding blocks are solid.
     * A transparent block is fully obscured if all surrounding blocks are
     * not air. Transparent blocks can obscure transparent blocks.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    isBlockObscured (x, y, z)
    {
        let blockId      = this.getBlock (x  , y  , z  )?.id ?? BlockId.Air;
        let blockIdUp    = this.getBlock (x  , y+1, z  )?.id ?? BlockId.Air;
        let blockIdDown  = this.getBlock (x  , y-1, z  )?.id ?? BlockId.Air;
        let blockIdLeft  = this.getBlock (x-1, y  , z  )?.id ?? BlockId.Air;
        let blockIdRight = this.getBlock (x+1, y  , z  )?.id ?? BlockId.Air;
        let blockIdFront = this.getBlock (x  , y  , z+1)?.id ?? BlockId.Air;
        let blockIdBack  = this.getBlock (x  , y  , z-1)?.id ?? BlockId.Air;
        // Transparent blocks can be obscured by other transparent blocks
        if (blockData[blockId].isTransparent == true)
        {
            return blockIdUp    !== BlockId.Air &&
                   blockIdDown  !== BlockId.Air &&
                   blockIdLeft  !== BlockId.Air &&
                   blockIdRight !== BlockId.Air &&
                   blockIdFront !== BlockId.Air &&
                   blockIdBack  !== BlockId.Air;
        }
        // Solid blocks can be obscured by non-transparent blocks
        return blockData[blockIdUp   ].isTransparent === false &&
               blockData[blockIdDown ].isTransparent === false &&
               blockData[blockIdLeft ].isTransparent === false &&
               blockData[blockIdRight].isTransparent === false &&
               blockData[blockIdFront].isTransparent === false &&
               blockData[blockIdBack ].isTransparent === false;
    }

    // ===================================================================

    /**
     * Returns true if the block at the given position is solid,
     * otherwise false.
     * If the given position is out-of-bounds, then the block is assumed
     * to be Air which is not a solid block.
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    isBlockSolid (x, y, z)
    {
        let blockId = this.getBlock (x, y, z)?.id ?? BlockId.Air;
        return blockData[blockId].isTransparent == false;
    }
}