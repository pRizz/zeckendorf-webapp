import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import wasm from "vite-plugin-wasm";

// Read version from package.json
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));
const appVersion = packageJson.version;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log("mode:", mode);
  const isDev = mode === "development";
  // When deploying to GitHub Pages, use the repo name as the base path
  const base = isDev ? "/" : "/zeckendorf-webapp/";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    base,
    appType: "spa",
    plugins: [
      wasm(),
      react(),
      isDev && componentTagger(),
      // Plugin to inject version from package.json into HTML
      {
        name: "inject-version",
        transformIndexHtml(html: string) {
          return html.replace(/__APP_VERSION__/g, appVersion);
        },
      },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt"],
        manifest: {
          name: "Zeckendorf Webapp - Browser-Based Compression",
          short_name: "Zeckendorf",
          description: "Free, open-source file compression using the Zeckendorf algorithm. All processing happens locally in your browser. No uploads, works offline.",
          theme_color: "#0d1117",
          background_color: "#0d1117",
          display: "standalone",
          orientation: "portrait",
          scope: base,
          start_url: base,
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,wasm}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ].filter(Boolean),
    build: {
      target: "es2022", // Supports top-level await for the generated wasm code
    },
    worker: {
      plugins: () => [
        wasm(),
      ],
      format: "es", // Supports top-level await for the generated wasm code
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
