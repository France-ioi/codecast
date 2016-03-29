
# Recipes

    jspm resolve --only npm:react@0.14.7
    jspm bundle frontend/**/* - [frontend/**/*] assets/dependency-bundle.js
    jspm bundle --minify frontend/**/* - [frontend/**/*] assets/dependency-bundle.js
    jspm bundle --minify babel assets/babel-bundle.js

    NODE_ENV=development nodemon --watch backend backend/server.js
