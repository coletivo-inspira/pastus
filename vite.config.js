import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

/** Serve /public/* in dev and keep public/ in dist for raw GitHub Pages paths. */
function publicPrefixPlugin() {
  return {
    name: "public-prefix",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith("/public/")) {
          req.url = req.url.slice("/public".length) || "/";
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith("/public/")) {
          req.url = req.url.slice("/public".length) || "/";
        }
        next();
      });
    },
    closeBundle() {
      cpSync(resolve(__dirname, "public"), resolve(__dirname, "dist/public"), {
        recursive: true,
      });
    },
  };
}

export default defineConfig({
  // Caminhos relativos funcionam tanto em domínio próprio quanto em
  // /pastus/ no GitHub Pages sem produzir 404.
  base: "./",
  plugins: [publicPrefixPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        eventos: resolve(__dirname, "eventos.html"),
        oRestaurante: resolve(__dirname, "o-restaurante.html"),
      },
    },
  },
});
