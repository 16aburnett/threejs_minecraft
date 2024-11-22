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

// const blockTextureAtlas = new THREE.TextureLoader ()
//     .load ("assets/block_texture_atlas.png");
// blockTextureAtlas.wrapS = THREE.RepeatWrapping;
// blockTextureAtlas.wrapT = THREE.RepeatWrapping;
// // Using nearest filter for crisp, non-blurry textures
// blockTextureAtlas.magFilter = THREE.NearestFilter;
// // We need to set this, otherwise the textures look washed out
// blockTextureAtlas.colorSpace = THREE.SRGBColorSpace;
// // blockTextureAtlas.repeat.set (0.5, 0.5);
// let faceGeometry  = new THREE.PlaneGeometry (1, 1, 1);
// // Adjust Plane UVs to represent the size of a texture
// // We will pass texture offsets to the shader to pick which texture to use
// // V component seems weird, might be subtractive?
// // so V starts at 1.0 to 0.95 for the top row of textures
// faceGeometry.attributes.uv.array[0] = 0.00;
// faceGeometry.attributes.uv.array[1] = 1.00;
// faceGeometry.attributes.uv.array[2] = 0.10;
// faceGeometry.attributes.uv.array[3] = 1.00;
// faceGeometry.attributes.uv.array[4] = 0.00;
// faceGeometry.attributes.uv.array[5] = 0.95;
// faceGeometry.attributes.uv.array[6] = 0.10;
// faceGeometry.attributes.uv.array[7] = 0.95;
// // let faceGeometry  = new THREE.BufferGeometry ();
// // let blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff});
// // blockMaterial.side = THREE.DoubleSide; // for Debug, disable backface culling
// let blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff, map: blockTextureAtlas});
// blockMaterial.onBeforeCompile = function (shader)
// {
//     shader.vertexShader=shader.vertexShader.replace (
//       "void main() {",
  
//       "attribute vec2 myOffset;\n"+
//       "void main() {"
//     );
  
//     shader.vertexShader=shader.vertexShader.replace (
//       "#include <uv_vertex>",
  
//       "#include <uv_vertex>\n"+
//       "vMapUv = vMapUv+myOffset;"
//     );
  
//     // document.body.innerText=shader.fragmentShader;
//     // document.body.innerText=shader.vertexShader;
// }

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
        // Ex: {id, instanceId}
        // indexed by block position
        this.data = [];
        this.initialize ();
        // By default, chunks contain no blocks
        this.needsTerrainGeneration = true;

        // Debug chunk wireframe border
        this.debugWireframe = new THREE.LineSegments (
            new THREE.WireframeGeometry (
                new THREE.BoxGeometry (CHUNK_SIZE, WORLD_HEIGHT, CHUNK_SIZE)
            )
        );
        // box is draw from the center
        // so we need to shift it to match 0,0,0 being the
        // left,bottom,back position
        this.debugWireframe.position.set (CHUNK_SIZE/2, WORLD_HEIGHT/2, CHUNK_SIZE/2);
        // this.debugWireframe.material.depthTest = false;
        this.debugWireframe.material.opacity = 0.75;
        this.debugWireframe.material.transparent = true;
        this.shouldShowChunkBoundaries = shouldShowChunkBoundaries;
        if (this.shouldShowChunkBoundaries)
            this.add(this.debugWireframe);
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
                            instanceId: null
                        }
                    );
                }
            }
        }
    }
    
    // ===================================================================

    generateMeshes ()
    {
        const blockTextureAtlas = new THREE.TextureLoader ()
            .load ("assets/block_texture_atlas.png");
        blockTextureAtlas.wrapS = THREE.RepeatWrapping;
        blockTextureAtlas.wrapT = THREE.RepeatWrapping;
        // Using nearest filter for crisp, non-blurry textures
        blockTextureAtlas.magFilter = THREE.NearestFilter;
        // We need to set this, otherwise the textures look washed out
        blockTextureAtlas.colorSpace = THREE.SRGBColorSpace;
        // blockTextureAtlas.repeat.set (0.5, 0.5);
        let faceGeometry  = new THREE.PlaneGeometry (1, 1, 1);
        // Adjust Plane UVs to represent the size of a texture
        // We will pass texture offsets to the shader to pick which texture to use
        // V component seems weird, might be subtractive?
        // so V starts at 1.0 to 0.95 for the top row of textures
        faceGeometry.attributes.uv.array[0] = 0.00;
        faceGeometry.attributes.uv.array[1] = 1.00;
        faceGeometry.attributes.uv.array[2] = 0.10;
        faceGeometry.attributes.uv.array[3] = 1.00;
        faceGeometry.attributes.uv.array[4] = 0.00;
        faceGeometry.attributes.uv.array[5] = 0.95;
        faceGeometry.attributes.uv.array[6] = 0.10;
        faceGeometry.attributes.uv.array[7] = 0.95;
        // let faceGeometry  = new THREE.BufferGeometry ();
        // let blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff});
        // blockMaterial.side = THREE.DoubleSide; // for Debug, disable backface culling
        let blockMaterial = new THREE.MeshStandardMaterial ({color: 0xffffff, map: blockTextureAtlas});
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

        // console.log (faceGeometry);
        // Need to clear the Mesh Group
        this.clear ();
        // Need to gather UVs
        // var myOffset = new Float32Array( [
        //     0.0,0.0, // x,y texture offset for first instance. 1.0 unit is the full width
        //     0.2,0.2 // x,y texture offset for second instance etc.
        //   ] );
        //   geometry.setAttribute( 'myOffset', new THREE.InstancedBufferAttribute( myOffset, 2 ) );
        // InstancedMesh needs to know the max number of meshes
        let maxCount = this.size*WORLD_HEIGHT*this.size*6;
        const mesh = new THREE.InstancedMesh (faceGeometry, blockMaterial, maxCount);
        let textureUVs = new Float32Array (maxCount*2);
        mesh.count = 0;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        let matrix = new THREE.Matrix4 ();
        // Rotation matrices for rotating faces the correct way
        let rotationMatrixX = new THREE.Matrix4 ();
        rotationMatrixX.makeRotationX (Math.PI / 2);
        let rotationMatrixXNeg = new THREE.Matrix4 ();
        rotationMatrixXNeg.makeRotationX (-Math.PI / 2);
        let rotationMatrixY = new THREE.Matrix4 ();
        rotationMatrixY.makeRotationY (Math.PI / 2);
        let rotationMatrixYNeg = new THREE.Matrix4 ();
        rotationMatrixYNeg.makeRotationY (-Math.PI / 2);
        let rotationMatrixBack = new THREE.Matrix4 ();
        rotationMatrixBack.makeRotationY (Math.PI);
        for (let chunkLocalx = 0; chunkLocalx < this.size; ++chunkLocalx)
        {
            for (let chunkLocaly = 0; chunkLocaly < WORLD_HEIGHT; ++chunkLocaly)
            {
                for (let chunkLocalz = 0; chunkLocalz < this.size; ++chunkLocalz)
                {
                    const blockId = this.data[chunkLocalx][chunkLocaly][chunkLocalz].id;
                    // Ensure there is a block at that position
                    if (blockId == BlockId.Air)
                        continue;
                    // Ensure block is not obscured
                    if (this.isBlockObscured (chunkLocalx, chunkLocaly, chunkLocalz))
                        continue;
                    
                    // Planes are drawn from the center
                    // so offset to draw from corner
                    // This will align blocks to Minecraft Coords
                    const worldPosX = chunkLocalx;
                    const worldPosY = chunkLocaly;
                    const worldPosZ = chunkLocalz;
                    let halfBlockSize = 0.5;
                    let blockCornerX = worldPosX + halfBlockSize;
                    let blockCornerY = worldPosY + halfBlockSize;
                    let blockCornerZ = worldPosZ + halfBlockSize;
                    // Up face
                    let shouldAddFace = !this.isBlockSolid (chunkLocalx, chunkLocaly+1, chunkLocalz);
                    if (shouldAddFace)
                    {
                        const instanceId = mesh.count;
                        matrix.identity ();
                        matrix.multiply (rotationMatrixXNeg);
                        matrix.setPosition (blockCornerX, blockCornerY + halfBlockSize, blockCornerZ);
                        mesh.setMatrixAt (instanceId, matrix);
                        // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
                        this.setBlockInstanceId (chunkLocalx, chunkLocaly, chunkLocalz, instanceId);
                        textureUVs[mesh.count * 2 + 0] = blockData[blockId].textureUVs[0];
                        textureUVs[mesh.count * 2 + 1] = blockData[blockId].textureUVs[1];
                        mesh.count += 1;
                    }
                    // Down face
                    shouldAddFace = !this.isBlockSolid (chunkLocalx, chunkLocaly-1, chunkLocalz);
                    if (shouldAddFace)
                    {
                        const instanceId = mesh.count;
                        matrix.identity ();
                        matrix.multiply (rotationMatrixX);
                        matrix.setPosition (blockCornerX, blockCornerY - halfBlockSize, blockCornerZ);
                        mesh.setMatrixAt (instanceId, matrix);
                        // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
                        this.setBlockInstanceId (chunkLocalx, chunkLocaly, chunkLocalz, instanceId);
                        textureUVs[mesh.count * 2 + 0] = blockData[blockId].textureUVs[4];
                        textureUVs[mesh.count * 2 + 1] = blockData[blockId].textureUVs[5];
                        mesh.count += 1;
                    }
                    // Left face
                    shouldAddFace = !this.isBlockSolid (chunkLocalx-1, chunkLocaly, chunkLocalz);
                    if (shouldAddFace)
                    {
                        const instanceId = mesh.count;
                        matrix.identity ();
                        matrix.multiply (rotationMatrixYNeg);
                        matrix.setPosition (blockCornerX - halfBlockSize, blockCornerY, blockCornerZ);
                        mesh.setMatrixAt (instanceId, matrix);
                        // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
                        this.setBlockInstanceId (chunkLocalx, chunkLocaly, chunkLocalz, instanceId);
                        textureUVs[mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
                        textureUVs[mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
                        mesh.count += 1;
                    }
                    // Right face
                    shouldAddFace = !this.isBlockSolid (chunkLocalx+1, chunkLocaly, chunkLocalz);
                    if (shouldAddFace)
                    {
                        const instanceId = mesh.count;
                        matrix.identity ();
                        matrix.multiply (rotationMatrixY);
                        matrix.setPosition (blockCornerX + halfBlockSize, blockCornerY, blockCornerZ);
                        mesh.setMatrixAt (instanceId, matrix);
                        // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
                        this.setBlockInstanceId (chunkLocalx, chunkLocaly, chunkLocalz, instanceId);
                        textureUVs[mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
                        textureUVs[mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
                        mesh.count += 1;
                    }
                    // Front face
                    shouldAddFace = !this.isBlockSolid (chunkLocalx, chunkLocaly, chunkLocalz+1);
                    if (shouldAddFace)
                    {
                        const instanceId = mesh.count;
                        matrix.identity ();
                        // No Rotation needed
                        matrix.setPosition (blockCornerX, blockCornerY, blockCornerZ + halfBlockSize);
                        mesh.setMatrixAt (instanceId, matrix);
                        // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
                        this.setBlockInstanceId (chunkLocalx, chunkLocaly, chunkLocalz, instanceId);
                        textureUVs[mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
                        textureUVs[mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
                        mesh.count += 1;
                    }
                    // Back face
                    shouldAddFace = !this.isBlockSolid (chunkLocalx, chunkLocaly, chunkLocalz-1);
                    if (shouldAddFace)
                    {
                        const instanceId = mesh.count;
                        matrix.identity ();
                        matrix.multiply (rotationMatrixBack);
                        matrix.setPosition (blockCornerX, blockCornerY, blockCornerZ - halfBlockSize);
                        mesh.setMatrixAt (instanceId, matrix);
                        // mesh.setColorAt (instanceId, new THREE.Color (blockData[blockId].color));
                        this.setBlockInstanceId (chunkLocalx, chunkLocaly, chunkLocalz, instanceId);
                        textureUVs[mesh.count * 2 + 0] = blockData[blockId].textureUVs[2];
                        textureUVs[mesh.count * 2 + 1] = blockData[blockId].textureUVs[3];
                        mesh.count += 1;
                    }
                }
            }
        }

        faceGeometry.setAttribute ('myOffset', new THREE.InstancedBufferAttribute (textureUVs, 2));

        this.add (mesh);

        // Debug wireframe
        if (this.shouldShowChunkBoundaries)
            this.add (this.debugWireframe);
    }

    // ===================================================================

    toggleChunkBoundaries ()
    {
        if (this.shouldShowChunkBoundaries)
        {
            this.shouldShowChunkBoundaries = false;
            this.remove (this.debugWireframe);
        }
        else
        {
            this.shouldShowChunkBoundaries = true;
            this.add (this.debugWireframe);
        }
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
        if (this.isInBounds (x, y, z))
            this.data[x][y][z].id = id;
    }

    // ===================================================================

    // Returns the instance id of the given block
    getBlockInstanceId (x, y, z)
    {
        if (this.isInBounds (x, y, z))
            return this.data[x][y][z].instanceId;
    }

    // ===================================================================

    // Sets the given block to the given instance id
    setBlockInstanceId (x, y, z, instanceId)
    {
        if (this.isInBounds (x, y, z))
            this.data[x][y][z].instanceId = instanceId;
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