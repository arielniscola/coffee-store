import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { CompanyModel } from "./models/company";
import { UserModel } from "./models/user";
import { ConfigModel } from "./models/config";
import { DEFAULT_COMPANY_SETTINGS } from "./constants/companyConfig";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coffeshop";

const COMPANY = {
  code: "wichiwi",
  companyName: "Wichi Wi Cafe Kids",
  address: "Mendoza, Argentina",
  email: "contacto@wichiwi.com",
  companyNumber: "20243145377",
  type: "cafe",
  cellphone: "5492614789647",
  active: true,
};

const USER = {
  username: "admin",
  password: "admin123",
  companyCode: COMPANY.code,
  name: "Administrador",
  active: true,
};

async function run() {
  await mongoose.connect(MONGO_URI, { ignoreUndefined: true });
  console.log("Conectado a", MONGO_URI);

  const existingCompany = await CompanyModel.findOne({ code: COMPANY.code });
  if (existingCompany) {
    console.log(`Compañia "${COMPANY.code}" ya existe, se omite.`);
  } else {
    await CompanyModel.create(COMPANY);
    console.log(`Compañia "${COMPANY.code}" creada.`);
  }

  const existingUser = await UserModel.findOne({
    companyCode: USER.companyCode,
    username: USER.username,
  });
  if (existingUser) {
    console.log(`Usuario "${USER.username}" ya existe, se omite.`);
  } else {
    const hash = await bcrypt.hash(USER.password, bcrypt.genSaltSync(10));
    await UserModel.create({ ...USER, password: hash });
    console.log(`Usuario "${USER.username}" creado.`);
  }

  let configsCreated = 0;
  for (const cfg of DEFAULT_COMPANY_SETTINGS) {
    const exists = await ConfigModel.findOne({
      code: cfg.code,
      companyCode: COMPANY.code,
    });
    if (!exists) {
      await ConfigModel.create({ ...cfg, companyCode: COMPANY.code });
      configsCreated++;
    }
  }
  console.log(
    `Configuraciones: ${configsCreated} creadas (${
      DEFAULT_COMPANY_SETTINGS.length - configsCreated
    } ya existían).`,
  );

  console.log("\nCredenciales de acceso:");
  console.log(`  Compañia: ${COMPANY.code}`);
  console.log(`  Usuario:  ${USER.username}`);
  console.log(`  Pass:     ${USER.password}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
