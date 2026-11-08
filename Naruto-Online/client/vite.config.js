import { defineConfig } from "vite";
export default defineConfig({
  publicDir: false,
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/v1": {
        target: process.env.NARUTO_API_URL ?? "http://127.0.0.1:8080",
        ws: true,
        changeOrigin: false,
      },
      "/assets": {
        target: process.env.NARUTO_API_URL ?? "http://127.0.0.1:8080",
      },
      "/healthz": "http://127.0.0.1:8080",
    },
  },
  build: {
    target: "es2022",
    assetsDir: "client-static",
    rollupOptions: {
      output: {
        manualChunks: { phaser: ["phaser"], voice: ["livekit-client"] },
      },
    },
  },
});
