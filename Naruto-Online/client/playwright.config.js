import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.js",
  timeout: 120000,
  workers: 1,
  use: {
    baseURL: process.env.NARUTO_WEB_URL ?? "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
  },
  reporter: "line",
});
