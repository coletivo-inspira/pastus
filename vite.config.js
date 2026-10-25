import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // Caminhos relativos funcionam tanto em domínio próprio quanto em
  // /pastus/ no GitHub Pages sem produzir 404.
  base: "./",
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
