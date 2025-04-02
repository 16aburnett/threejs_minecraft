# THREE.js Minecraft

This is my attempt at making Minecraft with THREE.js.

I originally made this project using P5.js, but P5.js did not seem to have all the features that I needed so I am trying out THREE.js. This is also an excuse to learn more about THREE.js so that I can use it for new projects.

I followed the following YouTube tutorial by Dan Greenheck to learn more about THREE.js for making a Minecraft clone:

https://www.youtube.com/watch?v=tsOTCn0nROI&list=PLtzt35QOXmkKALLv9RzT8oGwN5qwmRjTo&index=1&pp=iAQB

# Accessing the game

The game is hosted by GitHub Pages here:
https://16aburnett.github.io/threejs_minecraft/

# Deploying locally

You can deploy the website locally with a simple Python http server like this:
```bash
python3 -m http.server 8081
```

Then go to `http://localhost:8081/` in your browser to play the game.

Note: You may run into CORS issues with localhost.
