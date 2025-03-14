import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@pages": resolve(__dirname, "./src/pages"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@contexts": resolve(__dirname, "./src/contexts"),
      "@services": resolve(__dirname, "./src/services"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@types": resolve(__dirname, "./src/types"),
      "@assets": resolve(__dirname, "./src/assets"),
      "@styles": resolve(__dirname, "./src/styles"),
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          clerk: ["@clerk/clerk-react"],
          supabase: ["@supabase/supabase-js"],
          mantine: ["@mantine/core", "@mantine/hooks"],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
});
