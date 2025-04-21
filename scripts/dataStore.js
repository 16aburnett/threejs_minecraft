// Minecraft clone made with THREE.js
// Data Store class - Used for persisting changes to the world as chunks
// are loaded/unloaded.
// By Amy Burnett
// =======================================================================

export class DataStore {
    constructor ()
    {
        // (chunkKey) => {
        //    (chunkBlockKey) => blockId
        //  }
        this.chunkData = new Map ();
        // (chunkKey) => entities[]
        this.chunkEntities = new Map ();
    }

    // ===================================================================

    set (chunkX, chunkZ, chunkBlockX, chunkBlockY, chunkBlockZ, blockId)
    {
        const chunkKey = `${chunkX},${chunkZ}`;
        let chunkMap = this.chunkData.get (chunkKey);
        // Ensure chunk map exists
        if (chunkMap === undefined)
        {
            chunkMap = new Map ();
            this.chunkData.set (chunkKey, chunkMap);
        }
        // Set the data
        const blockKey = `${chunkBlockX},${chunkBlockY},${chunkBlockZ}`;
        chunkMap.set (blockKey, blockId);
    }

    // ===================================================================

    /**
     * 
     * @param {*} chunkX chunk X index
     * @param {*} chunkZ chunk Z index
     * @returns a Map of chunk block positions to their stored blockIds.
     * Returns undefined if no data is stored for the given chunk.
     */
    getAllChangesForChunk (chunkX, chunkZ)
    {
        const chunkKey = `${chunkX},${chunkZ}`;
        return this.chunkData.get (chunkKey);
    }

    // ===================================================================

    /**
     * Stores the given entity list for the given chunk.
     * This overrides the previously stored entity list
     * @param {*} chunkX 
     * @param {*} chunkZ 
     * @param {*} entityList 
     */
    setEntities (chunkX, chunkZ, entityList)
    {
        const chunkKey = `${chunkX},${chunkZ}`;
        // Need to copy to avoid caller changing what entities are stored
        const entityListCopy = [...entityList];
        this.chunkEntities.set (chunkKey, entityListCopy);
    }

    // ===================================================================

    /**
     * Stores the given entity for the given chunk.
     * This preserves previously stored entities, if any.
     * @param {*} chunkX chunk index X to store the entity with
     * @param {*} chunkZ chunk index Z to store the entity with
     * @param {*} entity entity to add to the data store
     */
    addEntity (chunkX, chunkZ, entity)
    {
        const chunkKey = `${chunkX},${chunkZ}`;
        // Ensure entity list exists for chunk
        if (!this.chunkEntities.has (chunkKey))
            this.chunkEntities.set (chunkKey, []);
        // Add entity
        this.chunkEntities.get (chunkKey).push (entity);
    }

    // ===================================================================

    /**
     * Returns the entity list stored for the given chunk.
     * Returns undefined if there were no entities stored for the given chunk.
     * @param {*} chunkX 
     * @param {*} chunkZ 
     */
    getEntities (chunkX, chunkZ)
    {
        const chunkKey = `${chunkX},${chunkZ}`;
        return this.chunkEntities.get (chunkKey);
    }
}