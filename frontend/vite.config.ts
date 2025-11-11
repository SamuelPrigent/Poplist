import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    force: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer React et React DOM
          'react-vendor': ['react', 'react-dom'],
          // Séparer React Router
          'react-router': ['react-router-dom'],
          // Séparer les bibliothèques UI/Table
          'table-vendor': ['@tanstack/react-table', '@tanstack/react-virtual'],
          // Séparer les bibliothèques DnD
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Séparer Radix UI
          'radix-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          // Séparer les icônes (lucide est volumineux)
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    // Augmenter la limite d'avertissement à 1000 kB (optionnel)
    chunkSizeWarningLimit: 1000,
  },
});
