import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      clientPort: 443
    },
    allowedHosts: [
    'mack-pretimely-cindi.ngrok-free.dev',
    '.ngrok-free.dev',
    '.ngrok.io']

  },
  plugins: [
  react()],


  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },

  // Optimize build for better performance
  build: {
    outDir: 'dist', // Temporarily use dist to avoid build directory lock
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react']
        }
      }
    }
  }
}));