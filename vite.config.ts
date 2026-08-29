import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/kobo-api": {
        target: "https://kobo.unocha.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kobo-api/, ""),
      },
    },
  },
  plugins: [
    react(),
    {
      name: "clean-urls",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/consolidado" || req.url === "/consolidado/") {
            req.url = "/consolidado.html";
          }
          if (req.url === "/admin" || req.url === "/admin/") {
            req.url = "/admin.html";
          }
          if (req.url === "/login" || req.url === "/login/") {
            req.url = "/login.html";
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        consolidado: resolve(import.meta.dirname, "consolidado.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
        login: resolve(import.meta.dirname, "login.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@arcgis")) return "arcgis";
          if (id.includes("node_modules/@supabase") || id.includes("node_modules/@supabase-js")) return "supabase";
          if (id.includes("node_modules/rxdb") || id.includes("node_modules/rxjs")) return "rxdb";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/scheduler")) return "react-vendor";
        },
      },
    },
  },
});
