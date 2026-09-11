import { defineConfig } from "drizzle-kit";

// Generare migrari SQLite din schema (driver-agnostic).
// Aplicarea pe D1 se face cu: wrangler d1 execute tevreauinapoi-db --remote --file drizzle/d1/<migrare>.sql
export default defineConfig({
  dialect: "sqlite",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/d1",
});
