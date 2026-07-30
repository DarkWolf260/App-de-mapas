import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "clean-urls",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/consolidado" || req.url === "/consolidado/") {
            req.url = "/consolidado.html";
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        consolidado: resolve(__dirname, "consolidado.html"),
      },
    },
  },
});
