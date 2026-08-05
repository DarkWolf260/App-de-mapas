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
        main: resolve(__dirname, "index.html"),
        consolidado: resolve(__dirname, "consolidado.html"),
        admin: resolve(__dirname, "admin.html"),
        login: resolve(__dirname, "login.html"),
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
