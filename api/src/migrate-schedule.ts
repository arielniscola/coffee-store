/**
 * Migración idempotente de horarios:
 *  - E: convierte los 7 configs string `scheduleDay{Día}` en un documento
 *       `weeklySchedule` estructurado por compañía.
 *  - D: convierte las fechas del config `closedDates` en excepciones de horario
 *       "close" de día completo (allDay).
 *
 * No pisa datos ya migrados: si la compañía ya tiene weeklySchedule, lo saltea;
 * si una fecha cerrada ya tiene su excepción, no la duplica. Los configs viejos
 * se dejan intactos (siguen sirviendo de fallback).
 *
 * Uso:  MONGO_URI="mongodb+srv://..." npx ts-node src/migrate-schedule.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import moment from "moment";
import { CompanyModel } from "./models/company";
import { ConfigModel } from "./models/config";
import { WEEKDAY_KEYS } from "./models/weeklySchedule";
import { weeklyScheduleService } from "./services/weeklySchedule";
import { scheduleExceptionService } from "./services/scheduleException";
import {
  parseScheduleRanges,
  minutesToTime,
} from "./services/scheduleException";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coffeshop";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

async function migrateWeeklySchedule(companyCode: string): Promise<boolean> {
  const existing = await weeklyScheduleService.getForCompany(companyCode);
  if (existing) return false; // ya migrado

  const schedule: any = {};
  for (const key of WEEKDAY_KEYS) {
    const cfg = await ConfigModel.findOne({
      code: `scheduleDay${capitalize(key)}`,
      companyCode,
    }).lean();
    const raw = (cfg?.value as string) || "";
    schedule[key] = parseScheduleRanges(raw).map((r) => ({
      start: minutesToTime(r.start),
      end: minutesToTime(r.end),
    }));
  }
  await weeklyScheduleService.upsert(companyCode, schedule);
  return true;
}

async function migrateClosedDates(companyCode: string): Promise<number> {
  const cfg = await ConfigModel.findOne({
    code: "closedDates",
    companyCode,
  }).lean();
  const raw = (cfg?.value as string) || "";
  const dates = String(raw)
    .split(",")
    .map((d) => d.trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

  let created = 0;
  for (const date of dates) {
    const day = moment(date, "YYYY-MM-DD").utc(true).startOf("day").toDate();
    const already = await scheduleExceptionService.exists({
      companyCode,
      type: "close",
      allDay: true,
      dateFrom: day,
    });
    if (already) continue;
    await scheduleExceptionService.insertOne({
      companyCode,
      type: "close",
      allDay: true,
      timeStart: "00:00",
      timeEnd: "23:59",
      dateFrom: day,
      dateTo: day,
    });
    created++;
  }
  return created;
}

async function run() {
  await mongoose.connect(MONGO_URI, { ignoreUndefined: true });
  console.log("Conectado a", MONGO_URI);

  const companies = await CompanyModel.find({}).lean();
  console.log(`Compañías encontradas: ${companies.length}`);

  for (const company of companies) {
    const code = company.code;
    if (!code) continue;
    const migratedSchedule = await migrateWeeklySchedule(code);
    const closedCreated = await migrateClosedDates(code);
    console.log(
      `· ${code}: horario ${
        migratedSchedule ? "migrado" : "ya existía"
      }, ${closedCreated} día(s) cerrado(s) migrado(s).`,
    );
  }

  await mongoose.disconnect();
  console.log("Migración finalizada.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
