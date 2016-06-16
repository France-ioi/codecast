
# Recipes

## Building the audio worker

    jspm bundle-sfx frontend/audio_worker/index.js assets/audio_worker.js

## Building partial bundles for development

    jspm bundle --minify 'frontend/**/*' - '[frontend/**/*]' - persistent-c assets/dependency-bundle.js
    jspm bundle --minify babel assets/babel-bundle.js

## Building self-executable bundles for production

    jspm bundle-sfx frontend/recorder/index.js assets/recorder.js
    jspm bundle-sfx frontend/player/index.js assets/player.js

## I upgraded react and I get an error 'Invariant Violation: addComponentAsRefTo...'

Either delete assets/dependency-bundle.js, or regenerate it with the command
given above.
