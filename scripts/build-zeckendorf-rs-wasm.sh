#!/usr/bin/env bash

# Build the Zeckendorf Rust library for WebAssembly
# This script should be run from the root of the project.
# Run with:
# `./scripts/build-zeckendorf-rs-wasm.sh`

cd vendor/zeckendorf
wasm-pack build --out-dir ../../zeckendorf_rs_wasm
