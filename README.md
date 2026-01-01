# Zeckendorf Webapp - Browser-Based File Compression

A free, open-source web application for compressing and decompressing files directly in your web browser using the Zeckendorf representation algorithm. All processing happens locally in your browser—no data is uploaded to any server. This compression tool uses Rust based WebAssembly for high-performance, client-side file compression and decompression.

## Overview

The Zeckendorf algorithm represents numbers as a sum of non-consecutive Fibonacci numbers. This webapp interprets your file data as a big integer (either big-endian or little-endian), converts it to its Zeckendorf representation, and can achieve compression for certain types of data. The application automatically tries both endian interpretations and selects the one that produces the best compression.

**Note**: Compression is not guaranteed—the algorithm may result in a larger representation depending on the input data. The effectiveness varies by input type and size.

## Features

- **Browser-Based Compression**: All processing happens locally in your browser using WebAssembly
- **No Data Upload**: Your files never leave your device
- **Multiple Endian Interpretations**: Automatically tries both big-endian and little-endian interpretations
- **Automatic Best Compression**: Selects the best compression result automatically
- **Progressive Web App (PWA)**: Works offline and can be installed on your device
- **Modern UI**: Built with React and Tailwind CSS

## How It Works

### Zeckendorf Representation

Every positive integer can be uniquely represented as a sum of non-consecutive Fibonacci numbers. For example:
- 12 = 8 + 3 + 1 = F(6) + F(4) + F(2)

### Compression Process

1. Your file data is interpreted as either a big-endian or little-endian integer
2. The integer is converted to its Zeckendorf representation (list of Fibonacci indices)
3. The representation is encoded as bits (use/skip bits)
4. Bits are packed into bytes

The webapp automatically tries both endian interpretations and selects the one that produces the smallest output.

## Technologies

This project is built with:

- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn-ui** - UI components
- **Tailwind CSS** - Styling
- **WebAssembly (WASM)** - High-performance compression engine
- **Zeckendorf Rust Library** - Core compression algorithm (compiled to WASM)

The compression engine is powered by the [Zeckendorf Rust library](https://github.com/pRizz/zeckendorf), compiled to WebAssembly for browser execution.

## Development Setup

### Prerequisites

- **Node.js** (v20 or higher) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **pnpm** (v9.12.0) - Package manager
- **Rust** - For building the WebAssembly module
- **wasm-pack** - For compiling Rust to WebAssembly

### Installation

```sh
# Step 1: Clone the repository
git clone git@github.com:pRizz/zeckendorf-webapp.git
cd zeckendorf-webapp

# Step 2: Initialize git submodules (required for the Zeckendorf library)
git submodule update --init --recursive

# Step 3: Install dependencies
pnpm install

# Step 4: Build the WebAssembly module
pnpm run build-zeckendorf-rs-wasm

# Step 5: Start the development server
pnpm run dev
```

The development server will start at `http://localhost:8080`

### Available Scripts

- `pnpm run dev` - Start development server (builds WASM first)
- `pnpm run build` - Build for production
- `pnpm run build-zeckendorf-rs-wasm` - Build the WebAssembly module
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues

## Deployment

### GitHub Pages

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch. The deployment workflow:

1. Builds the Rust WebAssembly module
2. Builds the Vite application
3. Deploys to GitHub Pages

To enable GitHub Pages:
1. Go to your repository Settings → Pages
2. Select "GitHub Actions" as the source
3. The workflow will automatically deploy on pushes to `main`

The app is configured with the base path `/zeckendorf-webapp/` for GitHub Pages deployment.

## Limitations

- **Compression Not Guaranteed**: Some inputs may result in larger output
- **Compression Effectiveness**: Decreases as input size increases
- **Browser Support**: Requires a modern browser with WebAssembly support

## License

This project is open source and free to use. The Zeckendorf compression library is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## References

- [Zeckendorf's Theorem](https://en.wikipedia.org/wiki/Zeckendorf%27s_theorem) - Every positive integer has a unique representation as a sum of non-consecutive Fibonacci numbers
- [Zeckendorf Rust Library](https://github.com/pRizz/zeckendorf) - The underlying compression library
