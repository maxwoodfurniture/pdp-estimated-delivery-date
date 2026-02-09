import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Shopify CLI workaround:
 * Replace HOST with SHOPIFY_APP_URL if needed.
 */
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const isProd = process.env.NODE_ENV === "production";

/**
 * In production (Render), we must always bind to 0.0.0.0.
 * In development, derive the host from SHOPIFY_APP_URL or localhost.
 */
const devHost = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

/**
 * HMR should ONLY run in development.
 * In production, it must be disabled.
 */
const hmrConfig = !isProd
  ? devHost === "localhost"
    ? {
        protocol: "ws",
        host: "localhost",
        port: 64999,
        clientPort: 64999,
      }
    : {
        protocol: "wss",
        host: devHost,
        port: Number(process.env.FRONTEND_PORT) || 8002,
        clientPort: 443,
      }
  : false;

export default defineConfig({
  server: {
    host: "0.0.0.0", // REQUIRED for Render
    port: Number(process.env.PORT || 3000),

    /**
     * Render requires open host binding.
     * Restrict hosts only during local development.
     */
    allowedHosts: isProd ? "all" : [devHost],

    cors: {
      preflightContinue: true,
    },

    hmr: hmrConfig,

    fs: {
      allow: ["app", "node_modules"],
    },
  },

  plugins: [reactRouter(), tsconfigPaths()],

  build: {
    assetsInlineLimit: 0,
  },

  optimizeDeps: {
    include: ["@shopify/app-bridge-react"],
  },
});
