set shell := ["bash", "-euo", "pipefail", "-c"]

# Check for required tools
_ := require("npm")

[private]
default:
    @just --list

# Run the development server with hot reload
[group('development')]
run:
    npm start

# Install dependencies
[group('development')]
install:
    npm ci

# Install dependencies (allow updates within semver ranges)
[group('development')]
install-update:
    npm install

# Check for outdated dependencies
[group('development')]
deps-outdated:
    npm outdated || true

# Update all dependencies to latest within semver ranges
[group('development')]
deps-update:
    npm update

# Build library for npm distribution
[group('build')]
build:
    npm run build:lib

# Build web component (standalone custom element)
[group('build')]
build-wc:
    npm run build:wc

# Build web component and copy to pretalx repository
[group('build')]
build-pretalx:
    npm run build:wc
    cp dist/pretalx-schedule.umd.cjs ../pretalx/src/pretalx/static/agenda/js/pretalx-schedule.min.js

# Build both library and web component
[group('build')]
build-all: build build-wc

# Run linter
[group('linting')]
lint:
    npm run lint

# Analyze bundle size (opens visualizer)
[group('build')]
analyze:
    npm run analyze

# Remove build artifacts and Vite cache
[group('development')]
@clean:
    -rm -rf dist node_modules/.vite
