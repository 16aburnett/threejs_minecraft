

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
