import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { DB } from "../libs/db";
import { ensureDefaultConfigs } from "../services/configBootstrap";

/**
 * Script one-off: crea en la BD los configs de DEFAULT_COMPANY_SETTINGS
 * que falten para cada compañía. No sobrescribe valores existentes.
 *
 * Uso: npx ts-node src/scripts/ensureConfigs.ts
 */
(async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/coffeshop";
  await DB.connect(uri);
  await ensureDefaultConfigs();
  await mongoose.disconnect();
  console.log("Bootstrap de configs finalizado.");
  process.exit(0);
})().catch((err) => {
  console.error("Error ejecutando bootstrap de configs:", err);
  process.exit(1);
});
