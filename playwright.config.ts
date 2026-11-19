import { defineConfig, devices } from "@playwright/test";

// Pruebas en navegador real contra la app ya corriendo (`npm run build && npm start`) y Supabase
// local. No levanta el servidor: lo hace CI o la persona que las corre.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "es-CL",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
