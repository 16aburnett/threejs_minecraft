

- [] Radiance cascades for beautiful looking graphics!!
    - i really hope that works

- [] experiment with writing my own shaders!

- [] save/load
    - can't really do this with javascript
    - but! we can save/load stuff with local storage
    and when quiting/loading a world, we can prompt the user to
    download/upload a world file!
    - Only issue is that local storage has a limit but you might
    be able to turn it to unlimited?

- [] copy minecraft terminology
    - chunk is 16x16xWORLD_HEIGHT
    - subchunk is 16x16x16

- [] distant horizons!
    - either use an existing version
    - or figure out how to make this myself
    - LOD
    - far away chunks could be painted on a skybox?

- [] use this for transparent blocks
    - https://threejs.org/docs/#api/en/materials/Material.transparent
    - water, glass
    - reflections/refraction??? pls


- [] top down view
- [] maybe try to use wave function collapse for something? could be neat
    - tiles are features like roads, bridges, buildings, etc
    - but seed it for reproducable world seeds

- [] better tree generation
    - [] add more randomness with trunk height and amount of leaves
    - [] need to fix trees being unfinished near chunk boundaries
        - might be able to achieve this with over loading chunks
        past the render distance

- [] debug UI similar to minecraft
    - [] player position (World, Chunk)
- [] weather
    - rain, snow, fog
- [] skybox
- [] day and night
    - time
    - sun light direction matching skybox's sun (sunsets, sunrises)

World generation
- [] chunk loading should start from the player's position and BFS outward
- [] chunk gen on a separate thread to not block user input
- [] unloaded chunks should only store so many chunks before writting to disk
- [] chunk data should be reduced as much as possible
    - so it takes up less mem which could translate to perf
    - less mem means we can store more chunks in unloaded list before needing to save to file
    - less mem also means that saving/loading from file could be faster
    - could use low-level bit representation.
- [] experiment with chunk size
    - a larger chunk size means less draw calls for the same total blocks
- [] maybe mess with physics for different worlds? a moon world that has lower gravity?
- [] it sucks needing to query the loaded and unloaded maps for chunks - maybe make a chunks map
    that allows generic lookup (more mem, but 1 lookup instead of 2, and the more mem is like 5x5 references)

Input handling
- refactor out of player class
    - I know it makes sense to be in the player class since the player is what the user is controlling
    - but it would just be easier and would avoid ad hoc things like needing the world in the player class for placing/breaking blocks
    - p5js had it in the main script

World updates
- in Minecraft, the world continuously updates to give more life to the world.
- grass grows and spreads, water flows, crops grow, sand falls, redstone signals propagate
- we need a system like this for our world
- unsure if this should be the same system that propagates light levels - prolly not.

Mobs
- Minecraft has hostile and friendly mobs
- Hostile mobs would introduce challenge to the game so there is something to fight
- friendly mobs give more life to the world and allow for farming and food

World realms
- Minecraft has the Overworld, Nether, and the End
- I should be able to create new worlds as well along with portals that allow you to traverse between the two
- Defo do the Aether - a floating island world in the clouds

Biomes
- Looking at the biome finder app for Minecraft, a good strategy might be to have 2 layers of noise:
    - [] elevation: deep ocean -> ocean -> beach -> plains/forests -> hills -> mountains
    - [] temperature: frozen(tundra,frozen ocean) -> cold(snowy plains) -> normal(plains/forests) -> warm(jungles) -> hot (deserts)
- and then an additional layer of noise to cut rivers into the world and another for small lakes
- [] create a 2D biome map to show what biomes would look like b4 actually implementing
    - similar to biome finder https://www.chunkbase.com/apps/biome-finder
- [] [long-term] Real minecraft also probably has noise generators for each type of biome and ways of blending between them but that might be p hard
- [] [long-term] vertical biomes for cave biomes

Clouds
- [] need working clouds
- they should not be blocks
- [] the clouds should move slowly across the world

UI
- [] hotbar
- [] minimap?
