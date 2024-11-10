// Minecraft clone made with THREE.js
// By Amy Burnett
// September 20, 2024
// =======================================================================
// Importing


// =======================================================================
// Global variables

// Enum of block IDs
export const BlockId = {
    Air:   0,
    Grass: 1,
    Dirt:  2,
    Stone: 3,
    Sand:  4,
    Water: 5
};

const TEXUTRE_ATLAS_WIDTH  = 160;
const TEXTURE_ATLAS_HEIGHT = 320;
const TEXTURE_WIDTH  = 16;
const TEXTURE_HEIGHT = 16;
export const NORMALIZED_TEXTURE_WIDTH = TEXTURE_WIDTH / TEXUTRE_ATLAS_WIDTH;
export const NORMALIZED_TEXTURE_HEIGHT = TEXTURE_HEIGHT / TEXTURE_ATLAS_HEIGHT;

// Texture Coords need to be normalized from 0.0 to 1.0
// This returns normalized coords from given index coords
// Index coords represent which texture in the atlas to use
// Example: (1, 0) uses the second texture (0-based indexing)
function toNormalizedTexureUV (u, v)
{
    return [
        u * NORMALIZED_TEXTURE_WIDTH,
        v * NORMALIZED_TEXTURE_HEIGHT
    ];
}

// List for mapping BlockIds to static block data
export const blockData = [
    {
        id: BlockId.Air,
        name: "Air",
        color: 0xff00ff,
        textureUVs: null // Air does not have a texture
    },
    {
        id: BlockId.Grass,
        name: "Grass",
        color: 0x00ff00,
        textureUVs: [
            ...toNormalizedTexureUV (4.0, 0.0), // top
            ...toNormalizedTexureUV (3.0, 0.0), // sides
            ...toNormalizedTexureUV (2.0, 0.0)  // bottom
        ]
    },
    {
        id: BlockId.Dirt,
        name: "Dirt",
        color: 0x5C4033,
        textureUVs: [
            ...toNormalizedTexureUV (2.0, 0.0), // top
            ...toNormalizedTexureUV (2.0, 0.0), // sides
            ...toNormalizedTexureUV (2.0, 0.0)  // bottom
        ]
    },
    {
        id: BlockId.Stone,
        name: "Stone",
        color: 0xbbbbbb,
        textureUVs: [
            ...toNormalizedTexureUV (1.0, 0.0), // top
            ...toNormalizedTexureUV (1.0, 0.0), // sides
            ...toNormalizedTexureUV (1.0, 0.0)  // bottom
        ]
    },
    {
        id: BlockId.Sand,
        name: "Sand",
        color: 0xffffff,
        textureUVs: [
            ...toNormalizedTexureUV (5.0, 0.0), // top
            ...toNormalizedTexureUV (5.0, 0.0), // sides
            ...toNormalizedTexureUV (5.0, 0.0)  // bottom
        ]
    },
    {
        id: BlockId.Water,
        name: "Water",
        color: 0x0000ff,
        textureUVs: [
            ...toNormalizedTexureUV (6.0, 0.0), // top
            ...toNormalizedTexureUV (6.0, 0.0), // sides
            ...toNormalizedTexureUV (6.0, 0.0)  // bottom
        ]
    }
];