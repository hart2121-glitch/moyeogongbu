import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        characterPreview: fileURLToPath(
          new URL("./character-preview.html", import.meta.url),
        ),
      },
    },
  },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
});
