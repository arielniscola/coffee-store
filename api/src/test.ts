import { Coffeshop, defineOptions } from ".";
import dotenv from "dotenv";
import routes from "./routes";
import { paymentReconciler } from "./services/paymentReconciler";
import { ensureDefaultConfigs } from "./services/configBootstrap";

dotenv.config();

const CONFIGS = defineOptions({
  server: {
    port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000,
    secret: "secret",
  },
  db: {
    uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coffeshop",
  },
  logs: {
    path: process.env.LOGS_PATH || "logs",
    prefix: "coffeshop",
    frequency: "1m",
  },
  bootstrapScripts: [],
  routes,
});

(async () => {
  const coffeeshop = new Coffeshop(CONFIGS);
  await coffeeshop.init();
  // Crear configs faltantes en cada deploy (idempotente).
  await ensureDefaultConfigs();
  // Red de seguridad por si falla el webhook de Mercado Pago.
  const reconcileMs = process.env.MP_RECONCILE_INTERVAL_MS
    ? parseInt(process.env.MP_RECONCILE_INTERVAL_MS)
    : 5 * 60 * 1000;
  paymentReconciler.start(reconcileMs);
})();
