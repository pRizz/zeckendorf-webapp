#!/usr/bin/env bash

# Build the Zeckendorf Rust library for WebAssembly
# This script should be run from the root of the project.
# Run with:
# `./scripts/build-zeckendorf-rs-wasm.sh`

which wasm-pack > /dev/null || {
    echo "wasm-pack is not installed. Please install it using the following command:"
    echo "cargo install wasm-pack"
    exit 1
}

# Build the Zeckendorf Rust library for WebAssembly
cd vendor/zeckendorf
wasm-pack build --out-dir ../../zeckendorf_rs_wasm
