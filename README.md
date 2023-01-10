# pretalx-schedule

## Project setup
```
npm ci

# If using NPM >= 6
npm install --legacy-peer-deps
```

### Compiles and hot-reloads for development
```
npm start
```

### Compiles and minifies for production
```
npm run build
```

### Build for pretalx (web component)
```
npm run build:wc
```

Then copy ``dist/*js`` to ``src/pretalx/static/agenda/js/`` in pretalx.

### Release library to npm

```sh
npm version minor|patch
npm publish --access=public
```

### Lints and fixes files
```
npm run lint
```
