#!/bin/bash
set -e

export NODE_OPTIONS=--openssl-legacy-provider
npm run build:wc

# Strip sourcemaps, as pretalx build tools are unhappy
for f in dist/*.js; do
    mv "$f" "$f".bak
    # Only strip lines starting with //# sourceMappingURL
    # We need to do this due to popper.js referencing (but not linking in) their sourcemap.
    # We strip this out in the build step for .min.js, but this seems the only way to remove it from the non-minified version.
    sed '/^\/\/# sourceMappingURL/d' "$f".bak > "$f"
    rm "$f".bak
done

cp dist/*.js* ../pretalx/src/pretalx/static/agenda/js/
