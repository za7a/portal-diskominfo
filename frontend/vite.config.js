import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Saat dev, permintaan ke /api diteruskan ke backend FastAPI (tanpa masalah CORS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8000" } },
});
