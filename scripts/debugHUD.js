// Minecraft clone made with THREE.js
// Debug HUD for displaying useful debugging information
// By Amy Burnett
// =======================================================================
// Importing

import World, { blockToChunkBlockIndex, convertWorldPosToBlockIndex, convertWorldPosToChunkIndex } from './world.js';
import Player from './player.js';
import { BlockStrings } from './blockId.js';
import { BiomeStrings } from './biomeId.js';
import MobEntity from './mobEntity.js';
import { ItemEntity } from './itemEntity.js';
import { BlockEntity } from './blockEntity.js';

// =======================================================================
// Globals


// =======================================================================

export class DebugHUD
{
    constructor ()
    {
        this.isVisible = true;
    }

    // ===================================================================

    /**
     * Updates the Debug HUD
     * @param {Player} player
     * @param {World} world
     */
    update (player, world)
    {
        // Ensure the menu is opened
        if (this.isVisible == false)
            return;
        const x = player.position.x;
        const y = player.position.y;
        const z = player.position.z;
        const vx = player.velocity.x;
        const vy = player.velocity.y;
        const vz = player.velocity.z;
        const [blockIndexX, blockIndexY, blockIndexZ]
            = convertWorldPosToBlockIndex (x, y, z);
        const [chunkIndexX, chunkIndexY, chunkIndexZ]
            = convertWorldPosToChunkIndex (x, y, z);
        const [chunkBlockIndexX, chunkBlockIndexY, chunkBlockIndexZ]
            = blockToChunkBlockIndex (blockIndexX, blockIndexY, blockIndexZ);
        const biome = world.getBiome (x, y, z);
        const blockIdBelowPlayer = world.getBlockId (x, y-0.5, z);
        const targetedBlockPosition = player.selectedBlockPosition;
        const targetedBlockId = targetedBlockPosition ? world.getBlockId (targetedBlockPosition.x, targetedBlockPosition.y, targetedBlockPosition.z) : undefined;
        const entities = world.getEntities ();
        const numEntities = entities.length;
        const numMobEntities = entities.filter(entity => entity instanceof MobEntity).length;
        const numItemEntities = entities.filter(entity => entity instanceof ItemEntity).length;
        const numBlockEntities = entities.filter(entity => entity instanceof BlockEntity).length;
        const numChunksLoaded = world.loadedChunks.size;
        // Write everything to debug HUD
        document.getElementById ("debug-hud-contents").innerText
            = `Position:    ${x.toFixed (2)}, ${y.toFixed (2)}, ${z.toFixed (2)}\n`
            + `Velocity:    ${vx.toFixed (2)}, ${vy.toFixed (2)}, ${vz.toFixed (2)}\n`
            + `Block:       ${blockIndexX}, ${blockIndexY}, ${blockIndexZ}\n`
            + `Chunk:       ${chunkIndexX}, ${chunkIndexY}, ${chunkIndexZ}\n`
            + `ChunkBlock:  ${chunkBlockIndexX}, ${chunkBlockIndexY}, ${chunkBlockIndexZ}\n`
            + `Biome:       ${BiomeStrings[biome]}\n`
            + `BlockBelow:  ${BlockStrings[blockIdBelowPlayer]}\n`
            + `TargetBlock: ${BlockStrings[targetedBlockId]}\n`
            + `\n`
            + `Entities:     M:${numMobEntities}, I:${numItemEntities}, B:${numBlockEntities}, T:${numEntities}\n`
            + `LoadedChunks: ${numChunksLoaded}\n`
            + `\n`
            + `Press G to toggle this menu on/off\n`
        ;
    }

    // ===================================================================

    toggleDisplay ()
    {
        if (this.isVisible)
        {
            this.isVisible = false;
            document.getElementById ("debug-hud-contents").style.display = "none";
        }
        else
        {
            this.isVisible = true;
            document.getElementById ("debug-hud-contents").style.display = "flex";
        }
    }
}
