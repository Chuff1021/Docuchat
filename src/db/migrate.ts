import { runMigrations } from "@kilocode/app-builder-db";
import { db } from "@/db";

await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
