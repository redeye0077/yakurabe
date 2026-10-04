import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // デフォルトはnode（Zodスキーマ・Service層用）
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    testTimeout: 10000,
    server: {
      deps: {
        // next-auth は拡張子なしで next/server を import するため、Node の ESM 解決ではなく Vite に通す
        inline: ["next-auth"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test/server-only-stub.ts"),
    },
  },
});
