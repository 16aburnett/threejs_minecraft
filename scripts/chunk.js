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
import { BlockId, blockData } from './blockData.js'

// =======================================================================
// Global variables

export const WORLD_HEIGHT = 128;
export const CHUNK_SIZE = 16;

const blockTextureAtlas = new THREE.TextureLoader ()
.load ("assets/block_texture_atlas.png");
blockTextureAtlas.wrapS = THREE.RepeatWrapping;
blockTextureAtlas.wrapT = THREE.RepeatWrapping;
// Using nearest filter for crisp, non-blurry textures
blockTextureAtlas.magFilter = THREE.NearestFilter;
// We need to set this, otherwise the textures look washed out
blockTextureAtlas.colorSpace = THREE.SRGBColorSpace;
// blockTextureAtlas.repeat.set (0.5, 0.5);
// const blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff});
const blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff, map: blockTextureAtlas});
// blockMaterial.side = THREE.DoubleSide; // for Debug, disable backface culling
blockMaterial.onBeforeCompile = function (shader)
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
}

// Rotation matrices for rotating faces the correct way
const rotationMatrixX = new THREE.Matrix4 ().makeRotationX (Math.PI / 2);
const rotationMatrixXNeg = new THREE.Matrix4 ().makeRotationX (-Math.PI / 2);
const rotationMatrixY = new THREE.Matrix4 ().makeRotationY (Math.PI / 2);
const rotationMatrixYNeg = new THREE.Matrix4 ().makeRotationY (-Math.PI / 2);
const rotationMatrixBack = new THREE.Matrix4 ().makeRotationY (Math.PI);

// =======================================================================

export class Chunk extends THREE.Group
{
    constructor (chunkIndexX, chunkIndexZ, shouldShowChunkBoundaries)
    {
        super ();

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
        // Ex: {id, faceInstanceIds: []}
        // indexed by block position
        this.data = [];
        this.initialize ();
        // This maps face instance ids to their cooresponding block
        // position.
        // [instance0: Vec3{x, y, z}, instance1: Vec3{x, y, z}]
        // Since instance ids are always 0 to NUM_INSTANCES, we can use
        // a list instead of a map
        this.mapInstanceToBlockLocalPosition = [];

        // By default, chunks contain no blocks
        this.needsTerrainGeneration = true;
        this.needsMeshGeneration = true;

        // Geometry
        this.faceGeometry  = new THREE.PlaneGeometry (1, 1, 1);
        // Adjust Plane UVs to represent the size of a texture
        // We will pass texture offsets to the shader to pick which texture to use
        // V component seems weird, might be subtractive?
        // so V starts at 1.0 to 0.95 for the top row of textures
        this.faceGeometry.attributes.uv.array[0] = 0.00;
        this.faceGeometry.attributes.uv.array[1] = 1.00;
        this.faceGeometry.attributes.uv.array[2] = 0.10;
        this.faceGeometry.attributes.uv.array[3] = 1.00;
        this.faceGeometry.attributes.uv.array[4] = 0.00;
        this.faceGeometry.attributes.uv.array[5] = 0.95;
        this.faceGeometry.attributes.uv.array[6] = 0.10;
        this.faceGeometry.attributes.uv.array[7] = 0.95;

        // InstancedMesh needs to know the max number of meshes
        const maxFacesPerBlock = 6;
        const maxCount = this.size*WORLD_HEIGHT*this.size*maxFacesPerBlock;
        this.mesh = new THREE.InstancedMesh (this.faceGeometry, blockMaterial, maxCount);
        this.mesh.count = 0;
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.textureUVs = new THREE.InstancedBufferAttribute (new Float32Array (maxCount*2), 2);
        this.faceGeometry.setAttribute ('myOffset', this.textureUVs);

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

    // disposes of the GPU related resources for this chunk to free memory
    disposeInstances ()
    {
        if (this.faceGeometry && this.faceGeometry.dispose)
            this.faceGeometry.dispose ();
        blockMaterial.dispose ();
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
        for (let blockPos of this.mapInstanceToBlockLocalPosition)
        {
            const block = this.getBlock (
                blockPos.x,
                blockPos.y,
                blockPos.z
            );
            block.faceInstanceIds = [];
        }
        this.mesh.count = 0;
        this.mapInstanceToBlockLocalPosition.length = 0;
    }

    // ===================================================================

    generateMeshes ()
    {
        // Need to clear the previous data
        this.disposeInstances ();
        this.mapInstanceToBlockLocalPosition = [];

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
        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.computeBoundingSphere ();
        this.textureUVs.needsUpdate = true;

        this.add (this.mesh);

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
            // To remove an instance from a mesh, we are only allowed to
            // decrement the number of meshes, so we can swap the
            // instance that we want to remove with the last instance
            // in the mesh, and then decrement the instance count.

            // Get this instance's info
            const thisInstanceId = block.faceInstanceIds[i];
            // We dont need to actually get the matrix
            // bc we are throwing it away
            // const thisInstanceMatrix = new THREE.Matrix4 ();
            // this.mesh.getMatrixAt (thisInstanceId, thisInstanceMatrix);

            // Get the last instance's info
            const lastInstanceId = this.mesh.count - 1;
            const lastInstanceMatrix = new THREE.Matrix4 ();
            this.mesh.getMatrixAt (lastInstanceId, lastInstanceMatrix);
            const lastInstancesBlock = this.mapInstanceToBlockLocalPosition[lastInstanceId].clone ();
            const lastBlockFaceInstanceIds = this.data[lastInstancesBlock.x][lastInstancesBlock.y][lastInstancesBlock.z].faceInstanceIds;
            const lastBlockTextureU = this.textureUVs.array[lastInstanceId * 2 + 0];
            const lastBlockTextureV = this.textureUVs.array[lastInstanceId * 2 + 1];

            // Replace this face instance with the last face instance
            // this face's matrix is now the last matrix
            this.mesh.setMatrixAt (thisInstanceId, lastInstanceMatrix);
            // this face's block is now the last
            this.mapInstanceToBlockLocalPosition[thisInstanceId] = lastInstancesBlock;
            // the last block gets this face's id
            for (let i = 0; i < lastBlockFaceInstanceIds.length; ++i)
                if (lastBlockFaceInstanceIds[i] == lastInstanceId)
                    lastBlockFaceInstanceIds[i] = thisInstanceId;
            // replace this instances texture coords with last
            this.textureUVs.array[thisInstanceId * 2 + 0] = lastBlockTextureU;
            this.textureUVs.array[thisInstanceId * 2 + 1] = lastBlockTextureV;
            this.textureUVs.needsUpdate = true;

            // Decrement instance count to remove the face instance
            this.mesh.count -= 1;
            this.mapInstanceToBlockLocalPosition.length -= 1;

            // Tell the mesh that it needs to update
            this.mesh.instanceMatrix.needsUpdate = true;
            this.mesh.computeBoundingSphere ();

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
        
        // Planes are drawn from the center
        // so offset to draw from corner
        // This will align blocks to Minecraft Coords
        const worldPosX = x;
        const worldPosY = y;
        const worldPosZ = z;
        const halfBlockSize = 0.5;
        const blockCornerX = worldPosX + halfBlockSize;
        const blockCornerY = worldPosY + halfBlockSize;
        const blockCornerZ = worldPosZ + halfBlockSize;

        // We want to avoid adding duplicate faces for if faces
        // already exist for this block so initially remove all faces.
        // this should essentially be a noop if there are no faces
        this.removeBlockFaceInstances (x, y, z);

        let matrix = new THREE.Matrix4 ();
        // Up face
        let shouldAddFace = !this.isBlockSolid (x, y+1, z);
        if (shouldAddFace)
        {
            const instanceId = this.mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixXNeg);
            matrix.setPosition (blockCornerX, blockCornerY + halfBlockSize, blockCornerZ);
            this.mesh.setMatrixAt (instanceId, matrix);
            // this.mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            this.mapInstanceToBlockLocalPosition.push (blockPosition);
            this.textureUVs.array[this.mesh.count * 2 + 0] = blockData[blockId].textureUVs[0];
            this.textureUVs.array[this.mesh.count * 2 + 1] = blockData[blockId].textureUVs[1];
            this.textureUVs.needsUpdate = true;
            this.mesh.count += 1;
        }
        // Down face
        shouldAddFace = !this.isBlockSolid (x, y-1, z);
        if (shouldAddFace)
        {
            const instanceId = this.mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixX);
            matrix.setPosition (blockCornerX, blockCornerY - halfBlockSize, blockCornerZ);
            this.mesh.setMatrixAt (instanceId, matrix);
            // this.mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            this.mapInstanceToBlockLocalPosition.push (blockPosition);
            this.textureUVs.array[this.mesh.count * 2 + 0] = blockData[blockId].textureUVs[4];
            this.textureUVs.array[this.mesh.count * 2 + 1] = blockData[blockId].textureUVs[5];
            this.textureUVs.needsUpdate = true;
            this.mesh.count += 1;
        }
        // Left face
        shouldAddFace = !this.isBlockSolid (x-1, y, z);
        if (shouldAddFace)
        {
            const instanceId = this.mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixYNeg);
            matrix.setPosition (blockCornerX - halfBlockSize, blockCornerY, blockCornerZ);
            this.mesh.setMatrixAt (instanceId, matrix);
            // this.mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            this.mapInstanceToBlockLocalPosition.push (blockPosition);
            this.textureUVs.array[this.mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
            this.textureUVs.array[this.mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
            this.textureUVs.needsUpdate = true;
            this.mesh.count += 1;
        }
        // Right face
        shouldAddFace = !this.isBlockSolid (x+1, y, z);
        if (shouldAddFace)
        {
            const instanceId = this.mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixY);
            matrix.setPosition (blockCornerX + halfBlockSize, blockCornerY, blockCornerZ);
            this.mesh.setMatrixAt (instanceId, matrix);
            // this.mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            this.mapInstanceToBlockLocalPosition.push (blockPosition);
            this.textureUVs.array[this.mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
            this.textureUVs.array[this.mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
            this.textureUVs.needsUpdate = true;
            this.mesh.count += 1;
        }
        // Front face
        shouldAddFace = !this.isBlockSolid (x, y, z+1);
        if (shouldAddFace)
        {
            const instanceId = this.mesh.count;
            matrix.identity ();
            // No Rotation needed
            matrix.setPosition (blockCornerX, blockCornerY, blockCornerZ + halfBlockSize);
            this.mesh.setMatrixAt (instanceId, matrix);
            // this.mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            this.mapInstanceToBlockLocalPosition.push (blockPosition);
            this.textureUVs.array[this.mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
            this.textureUVs.array[this.mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
            this.textureUVs.needsUpdate = true;
            this.mesh.count += 1;
        }
        // Back face
        shouldAddFace = !this.isBlockSolid (x, y, z-1);
        if (shouldAddFace)
        {
            const instanceId = this.mesh.count;
            matrix.identity ();
            matrix.multiply (rotationMatrixBack);
            matrix.setPosition (blockCornerX, blockCornerY, blockCornerZ - halfBlockSize);
            this.mesh.setMatrixAt (instanceId, matrix);
            // this.mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
            block.faceInstanceIds.push (instanceId);
            this.mapInstanceToBlockLocalPosition.push (blockPosition);
            this.textureUVs.array[this.mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
            this.textureUVs.array[this.mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
            this.textureUVs.needsUpdate = true;
            this.mesh.count += 1;
        }

        // Tell the mesh that it needs to update
        this.mesh.instanceMatrix.needsUpdate = true;
        // this.mesh.computeBoundingSphere ();

    }

    // ===================================================================
    // Helper functions
    // ===================================================================

    // Returns the block data of the block at the given position
    getBlock (x, y, z)
    {
        if (this.isInBounds (x, y, z))
            return this.data[x][y][z];
    }

    // ===================================================================

    // Returns the block id of the block at the given position
    getBlockId (x, y, z)
    {
        if (this.isInBounds (x, y, z))
            return this.data[x][y][z].id;
    }

    // ===================================================================

    // Sets the id of the block at the given position to the given
    // block id
    setBlockId (x, y, z, id)
    {
        if (!this.isInBounds (x, y, z))
            return
        this.data[x][y][z].id = id;
        // we changed a block in this chunk so we need to update the mesh
        // this.needsMeshGeneration = true;
    }

    // ===================================================================

    // Returns true if the given chunk local position is within the bounds
    // of this chunk, false otherwise.
    isInBounds (x, y, z)
    {
        return 0 <= x && x < this.size &&
               0 <= y && y < WORLD_HEIGHT &&
               0 <= z && z < this.size;
    }

    // ===================================================================

    // Returns true if the block at the given chunk local position is
    // surrounded by solid blocks, false otherwise
    isBlockObscured (x, y, z)
    {
        // TODO: Update to use isBlockSolid
        let blockIdUp    = this.getBlock (x  , y+1, z  )?.id ?? BlockId.Air;
        let blockIdDown  = this.getBlock (x  , y-1, z  )?.id ?? BlockId.Air;
        let blockIdLeft  = this.getBlock (x-1, y  , z  )?.id ?? BlockId.Air;
        let blockIdRight = this.getBlock (x+1, y  , z  )?.id ?? BlockId.Air;
        let blockIdFront = this.getBlock (x  , y  , z+1)?.id ?? BlockId.Air;
        let blockIdBack  = this.getBlock (x  , y  , z-1)?.id ?? BlockId.Air;
        return blockIdUp    !== BlockId.Air &&
               blockIdDown  !== BlockId.Air &&
               blockIdLeft  !== BlockId.Air &&
               blockIdRight !== BlockId.Air &&
               blockIdFront !== BlockId.Air &&
               blockIdBack  !== BlockId.Air;
    }

    // ===================================================================

    // Returns true if the block at the given position is solid,
    // otherwise false
    // If position is out-of-bounds, block is assumed to be air which is
    // not a Solid block
    isBlockSolid (x, y, z)
    {
        let blockId    = this.getBlock (x, y, z)?.id ?? BlockId.Air;
        return blockId !== BlockId.Air;
    }
}