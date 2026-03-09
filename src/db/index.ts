import { createDatabase } from "@kilocode/app-builder-db";
import "@/lib/env";
import * as schema from "./schema";

export const db = createDatabase(schema);
