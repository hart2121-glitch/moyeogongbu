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
      // 라이브러리는 따로 묶어 앱만 바뀐 배포에서도 다시 받지 않게 한다.
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "vendor-supabase";
          if (/[\/]node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler|@tanstack)[\/]/.test(id)) return "vendor-react";
          return undefined;
        },
      },
    },
  },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
});
