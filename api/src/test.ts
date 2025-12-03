import { Coffeshop, defineOptions } from ".";
import dotenv from "dotenv";
import routes from "./routes";

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
})();
