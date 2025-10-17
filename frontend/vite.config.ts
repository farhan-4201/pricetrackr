import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    cors: {
      origin: [
        "https://www.smartpricetracker.me",
        "https://smartpricetracker.me",
      ],
      credentials: true,
    },
  },
  preview: {
    cors: {
      origin: [
        "https://www.smartpricetracker.me",
        "https://smartpricetracker.me",
      ],
      credentials: true,
    },
  },
});
