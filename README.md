# pretalx-schedule

Commands are available via [just](https://github.com/casey/just). Run `just` to see all available commands.

## Project setup
```
just install
```

### Compiles and hot-reloads for development
```
just run
```

### Compiles and minifies for production
```
just build
```

### Build for pretalx (web component)

Make sure the `schedule` and `pretalx` repositories share a root directory, then run:

```
just build-pretalx
```

### Release library to npm

```sh
npm version minor|patch
npm publish --access=public
```

### Lints and fixes files
```
just lint
```
