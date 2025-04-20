// THREE.js Minecraft - Feature Generation
// This contains functions for generating various features in the world (eg. trees)
// By Amy Burnett
// =======================================================================
// Importing

import { BlockId } from "./blockId.js";
import { distanceSquared, lerp } from "./utils.js";

// =======================================================================
// Global variables

const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;

// =======================================================================

export function generateOakTree (world, x, y, z, vegetationRNG)
{
    // Place trunk
    const trunkHeightMin = 2;
    const trunkHeightMax = 6;
    const trunkHeight = lerp (
        trunkHeightMin,
        trunkHeightMax,
        vegetationRNG.random ()
    );
    for (let i = 0; i < trunkHeight; ++i)
    {
        world.setBlockId (x, y+i, z, BlockId.Log);
    }

    // Place crown
    const crownHeightMin = 3;
    const crownHeightMax = 6;
    // offsetting coords so rand number is different from above
    const crownHeight = lerp (
        crownHeightMin,
        crownHeightMax,
        vegetationRNG.random ()
    );
    const crownRadiusBottom = 3;
    const crownRadiusTop = 2;
    for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
    {
        const crownY = y + trunkHeight + crownRow;
        // Place the part of the trunk that is in the crown
        if (crownRow < crownHeight - 1)
            world.setBlockId (x, crownY, z, BlockId.Log);

        // Lerp between bottom and top radii while moving up the crown
        const crownHeightRatio = crownRow / crownHeight;
        const crownRadius = lerp (
            crownRadiusBottom,
            crownRadiusTop,
            crownHeightRatio
        );
        for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
        {
            for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
            {
                // Ignore corners
                const isCornerX = crownX == x-crownRadius+1
                    || crownX == x+crownRadius-1;
                const isCornerZ = crownZ == z-crownRadius+1
                    || crownZ == z+crownRadius-1;
                if (isCornerX && isCornerZ)
                    continue;
                
                // Ensure we are not overwritting blocks
                const blockId = world.getBlockId (
                    crownX,
                    crownY,
                    crownZ
                );
                if (blockId != BlockId.Air)
                    continue;

                world.setBlockId (
                    crownX,
                    crownY,
                    crownZ,
                    BlockId.Leaves
                );
            }
        }
    }
}

// =======================================================================

export function generatePineTree (world, x, y, z, vegetationRNG)
{
    // Place trunk
    const trunkHeightMin = 2;
    const trunkHeightMax = 6;
    const trunkHeight = lerp (
        trunkHeightMin,
        trunkHeightMax,
        vegetationRNG.random ()
    );
    for (let i = 0; i < trunkHeight; ++i)
    {
        world.setBlockId (x, y+i, z, BlockId.PineLog);
    }

    // Place crown
    const crownHeightMin = 8;
    const crownHeightMax = 15;
    const crownHeight = lerp (
        crownHeightMin,
        crownHeightMax,
        vegetationRNG.random ()
    );
    const crownRadiusBottom = crownHeight / 3;
    const crownRadiusTop = 1;
    for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
    {
        const crownY = y + trunkHeight + crownRow;
        // Place the part of the trunk that is in the crown
        if (crownRow < crownHeight - 1)
            world.setBlockId (x, crownY, z, BlockId.PineLog);
        else
            world.setBlockId (x, crownY, z, BlockId.PineLeaves);

        // Lerp between bottom and top radii while moving up the crown
        const crownHeightRatio = crownRow / crownHeight;
        let crownRadius = lerp (
            crownRadiusBottom,
            crownRadiusTop,
            crownHeightRatio
        );
        // adjust so that alternating layers push in and out
        if (crownRow % 2 == 1)
            crownRadius -= 1;
        const crownRadiusSquared = crownRadius * crownRadius;
        for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
        {
            for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
            {
                // Ignore blocks outside of radius
                const distSquared = distanceSquared (
                    x,
                    z,
                    crownX,
                    crownZ
                );
                if (distSquared > crownRadiusSquared)
                    continue;
                
                // Ensure we are not overwritting blocks
                const blockId = world.getBlockId (
                    crownX,
                    crownY,
                    crownZ
                );
                if (blockId != BlockId.Air)
                    continue;

                world.setBlockId (
                    crownX,
                    crownY,
                    crownZ,
                    BlockId.PineLeaves
                );
            }
        }
    }
}

// =======================================================================

export function generateAcaciaTree (world, x, y, z, vegetationRNG)
{
    // Place trunk
    const trunkHeightMin = 1;
    const trunkHeightMax = 4;
    const trunkHeight = lerp (
        trunkHeightMin,
        trunkHeightMax,
        vegetationRNG.random ()
    );
    for (let i = 0; i < trunkHeight; ++i)
    {
        world.setBlockId (x, y+i, z, BlockId.AcaciaLog);
    }

    const dir = lerp (0, 3, vegetationRNG.random ());
    const height1 = lerp (3, 5, vegetationRNG.random ());
    placeAcaciaBranch (world, x, y+trunkHeight, z, dir, 0, height1);
    const oppositeDir = (dir + 2) % 4;
    const height2 = lerp (1, 3, vegetationRNG.random ());
    placeAcaciaBranch (
        world,
        x,
        y+trunkHeight,
        z,
        oppositeDir,
        0,
        height2
    );

}

// =======================================================================

export function placeAcaciaCanopy (world, x, y, z)
{
    // Place crown
    const crownHeight = 2
    const crownRadiusBottom = 4;
    const crownRadiusTop = 2;
    for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
    {
        const crownY = y + crownRow;

        // Lerp between bottom and top radii while moving up the crown
        const crownHeightRatio = crownRow / crownHeight;
        const crownRadius = lerp (
            crownRadiusBottom,
            crownRadiusTop,
            crownHeightRatio
        );
        const crownRadiusSquared = crownRadius * crownRadius;
        for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
        {
            for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
            {
                // Ignore blocks outside of radius
                const distSquared = distanceSquared (
                    x,
                    z,
                    crownX,
                    crownZ
                );
                if (distSquared > crownRadiusSquared)
                    continue;
                
                // Ensure we are not overwritting blocks
                const blockId = world.getBlockId (
                    crownX,
                    crownY,
                    crownZ
                );
                if (blockId != BlockId.Air)
                    continue;

                world.setBlockId (
                    crownX,
                    crownY,
                    crownZ,
                    BlockId.AcaciaLeaves
                );
            }
        }
    }
}

// =======================================================================

export function placeAcaciaBranch (world, x, y, z, dir, length, limit)
{
    if (length >= limit)
    {
        placeAcaciaCanopy (world, x, y, z);
        return;
    }
    if (dir == NORTH)
    {
        world.setBlockId (x, y, z, BlockId.AcaciaLog);
        world.setBlockId (x, y, z+1, BlockId.AcaciaLog);
        placeAcaciaBranch (world, x, y+1, z+1, dir, length+1, limit);
    }
    else if (dir == EAST)
    {
        world.setBlockId (x, y, z, BlockId.AcaciaLog);
        world.setBlockId (x+1, y, z, BlockId.AcaciaLog);
        placeAcaciaBranch (world, x+1, y+1, z, dir, length+1, limit);
    }
    else if (dir == SOUTH)
    {
        world.setBlockId (x, y, z, BlockId.AcaciaLog);
        world.setBlockId (x, y, z-1, BlockId.AcaciaLog);
        placeAcaciaBranch (world, x, y+1, z-1, dir, length+1, limit);
    }
    else if (dir == WEST)
    {
        world.setBlockId (x, y, z, BlockId.AcaciaLog);
        world.setBlockId (x-1, y, z, BlockId.AcaciaLog);
        placeAcaciaBranch (world, x-1, y+1, z, dir, length+1, limit);
    }
}

// =======================================================================

export function generateJungleTree (world, x, y, z, vegetationRNG)
{
    // Place trunk
    const trunkHeight = lerp (15, 25, vegetationRNG.random ());
    for (let i = 0; i < trunkHeight; ++i)
    {
        world.setBlockId (x, y+i, z, BlockId.JungleLog);
    }
    // place tree roots
    const rootOffset = lerp (0, 3, vegetationRNG.random ());
    placeJungleTrunkRoot (world, x, y+rootOffset, z, NORTH, 0, 4);
    placeJungleTrunkRoot (world, x, y+rootOffset, z, EAST , 0, 4);
    placeJungleTrunkRoot (world, x, y+rootOffset, z, SOUTH, 0, 4);
    placeJungleTrunkRoot (world, x, y+rootOffset, z, WEST , 0, 4);

    // Side branches
    const numBranches = lerp (1, 3, vegetationRNG.random ());
    for (let b = 0; b < numBranches; ++b)
    {
        const branchY = y + lerp (
            4,
            trunkHeight,
            vegetationRNG.random ()
        );
        const dir = lerp (0, 3, vegetationRNG.random ());
        const heightLimit = lerp (1, 4, vegetationRNG.random ());
        placeJungleBranch (world, x, branchY, z, dir, 0, heightLimit);
    }

    // Top branches
    const numTopBranches = lerp (0, 2, vegetationRNG.random ());
    for (let b = 0; b < numTopBranches; ++b)
    {
        const dir = lerp (0, 3, vegetationRNG.random ());
        const heightLimit = lerp (2, 5, vegetationRNG.random ());
        placeJungleBranch (
            world,
            x,
            y+trunkHeight,
            z,
            dir,
            0,
            heightLimit
        );
    }

    // Put a canopy topper at the top of the trunk
    placeJungleCanopy (world, x, y+trunkHeight, z);

}

// =======================================================================

export function placeJungleTrunkRoot (world, x, y, z, dir, length, limit)
{
    if (length >= limit)
    {
        world.setBlockId (world, x, y, z, BlockId.JungleLog);
        return;
    }
    if (dir == NORTH)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x, y, z+1, BlockId.JungleLog);
        placeJungleTrunkRoot (world, x, y-1, z+1, dir, length+1, limit);
    }
    else if (dir == EAST)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x+1, y, z, BlockId.JungleLog);
        placeJungleTrunkRoot (world, x+1, y-1, z, dir, length+1, limit);
    }
    else if (dir == SOUTH)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x, y, z-1, BlockId.JungleLog);
        placeJungleTrunkRoot (world, x, y-1, z-1, dir, length+1, limit);
    }
    else if (dir == WEST)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x-1, y, z, BlockId.JungleLog);
        placeJungleTrunkRoot (world, x-1, y-1, z, dir, length+1, limit);
    }
}

// =======================================================================

export function placeJungleCanopy (world, x, y, z)
{
    // Place crown
    const crownHeight = 2
    const crownRadiusBottom = 4;
    const crownRadiusTop = 2;
    for (let crownRow = 0; crownRow < crownHeight; ++crownRow)
    {
        const crownY = y + crownRow;

        // Lerp between bottom and top radii while moving up the crown
        const crownHeightRatio = crownRow / crownHeight;
        const crownRadius = lerp (
            crownRadiusBottom,
            crownRadiusTop,
            crownHeightRatio
        );
        const crownRadiusSquared = crownRadius * crownRadius;
        for (let crownX = x-crownRadius+1; crownX < x+crownRadius; ++crownX)
        {
            for (let crownZ = z-crownRadius+1; crownZ < z+crownRadius; ++crownZ)
            {
                // Ignore blocks outside of radius
                const distSquared = distanceSquared (
                    x,
                    z,
                    crownX,
                    crownZ
                );
                if (distSquared > crownRadiusSquared)
                    continue;
                
                // Ensure we are not overwritting blocks
                const blockId = world.getBlockId (
                    crownX,
                    crownY,
                    crownZ
                );
                if (blockId != BlockId.Air)
                    continue;

                // Place the block
                world.setBlockId (
                    crownX,
                    crownY,
                    crownZ,
                    BlockId.JungleLeaves
                );
            }
        }
    }
}

// =======================================================================

export function placeJungleBranch (world, x, y, z, dir, length, limit)
{
    if (length >= limit)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        placeJungleCanopy (world, x, y, z);
        return;
    }
    if (dir == NORTH)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x, y, z+1, BlockId.JungleLog);
        placeJungleBranch (world, x, y+1, z+1, dir, length+1, limit);
    }
    else if (dir == EAST)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x+1, y, z, BlockId.JungleLog);
        placeJungleBranch (world, x+1, y+1, z, dir, length+1, limit);
    }
    else if (dir == SOUTH)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x, y, z-1, BlockId.JungleLog);
        placeJungleBranch (world, x, y+1, z-1, dir, length+1, limit);
    }
    else if (dir == WEST)
    {
        world.setBlockId (x, y, z, BlockId.JungleLog);
        world.setBlockId (x-1, y, z, BlockId.JungleLog);
        placeJungleBranch (world, x-1, y+1, z, dir, length+1, limit);
    }
}

// =======================================================================

export function generateCactus (world, x, y, z, vegetationRNG)
{
    const cactusHeight = lerp (1, 4, vegetationRNG.random ());
    for (let yoff = 0; yoff < cactusHeight; ++yoff)
    {
        world.setBlockId (x, y + yoff, z, BlockId.Cactus);
    }
}
