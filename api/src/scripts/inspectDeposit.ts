import dotenv from "dotenv";
dotenv.config();

import moment from "moment";
import mongoose from "mongoose";
import { DB } from "../libs/db";
import { ISlot } from "../models/slot";
import slotService from "../services/slot";
import workshopService from "../services/workshop";
import configService from "../services/config";
import {
  weeklyScheduleService,
} from "../services/weeklySchedule";
import scheduleExceptionService, {
  minutesToTime,
  timeToMinutes,
} from "../services/scheduleException";

/**
 * Script de sólo lectura: reproduce, para una fecha y horario concretos, la
 * misma decisión que toma `ShiftController.checkout` al calcular si la reserva
 * lleva seña. No escribe nada.
 *
 * Sirve para cortar la especulación: dice si hay slot generado, qué
 * `requiresDeposit` tiene, si hay taller activo, qué ve el horario semanal y
 * cuál es el precio que saldría.
 *
 * Uso:
 *   npx ts-node src/scripts/inspectDeposit.ts --date=2026-09-24 --time=09:00
 *   npx ts-node src/scripts/inspectDeposit.ts --date=... --time=... --company=wichiwi --children=2
 *   npx ts-node src/scripts/inspectDeposit.ts --date=... --time=... --unit=cafeteria
 */

const arg = (name: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : undefined;
};

(async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/coffeshop";
  await DB.connect(uri);

  // Sin esto es imposible saber si se está mirando la base correcta: el .env
  // local apunta a localhost y el problema puede estar en producción.
  const conn = mongoose.connection;
  console.log(`Base: ${conn.host}:${conn.port}/${conn.name}\n`);

  const companyCode = arg("company") || "wichiwi";
  const dateStr = arg("date") || moment().format("YYYY-MM-DD");
  const timeStart = arg("time") || "";
  const childrenQty = Number(arg("children") || 1);
  const adultsQty = Number(arg("adults") || 0);
  // La unidad de negocio que manda el formulario de reserva. Es la que usa
  // `checkout` para buscar el slot, y la que el listado de disponibilidad NO
  // manda: ahí estaba la divergencia entre "Reservar" y el cobro.
  const unitBusiness = arg("unit") || "";

  if (!timeStart) {
    console.log("Falta --time=HH:mm (el horario de la reserva).");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(
    `Consulta: ${companyCode} · ${dateStr} ${timeStart} · ${adultsQty} adultos, ` +
      `${childrenQty} niños · unitBusiness="${unitBusiness}"\n`,
  );

  // 1. ¿El día está cerrado?
  const closed = await scheduleExceptionService.isDateClosed(
    companyCode,
    dateStr,
  );
  console.log(`1. Día cerrado: ${closed ? "SÍ" : "no"}`);

  // 2. ¿Hay slot generado para ese día y horario?
  const dayStart = moment(dateStr, "YYYY-MM-DD").utc(true).startOf("day");
  const dayEnd = moment(dateStr, "YYYY-MM-DD").utc(true).endOf("day");
  const slots: ISlot[] = (await slotService.find(
    {
      companyCode,
      date: { $gte: dayStart.toDate(), $lte: dayEnd.toDate() },
    },
    {},
    {},
  )) as ISlot[];
  console.log(`\n2. Disponibilidades generadas ese día: ${slots.length}`);
  for (const s of slots) {
    const mark = s.timeStart === timeStart ? " <-- el consultado" : "";
    console.log(
      `   ${s.timeStart}-${s.timeEnd} | requiresDeposit=${s.requiresDeposit} | ` +
        `depositAmount=${s.depositAmount || 0} | kind=${s.kind} | ` +
        `source=${s.source} | status=${s.status} | ` +
        `unitBusiness="${s.unitBusiness ?? ""}"${mark}`,
    );
  }
  // Lo mismo que hace `ShiftController.findSlot`, con la unidad del formulario.
  const forCheckout = await slotService.findByDate(
    companyCode,
    dateStr,
    unitBusiness || undefined,
  );
  const slot =
    (forCheckout.find((s) => s.timeStart === timeStart) as ISlot | undefined) ||
    null;
  console.log(
    `\n2b. Búsqueda del checkout con unitBusiness="${unitBusiness}": ` +
      `${forCheckout.length} slots visibles, ` +
      `${slot ? "ENCUENTRA el del horario" : "NO encuentra el del horario"}`,
  );
  if (!slot) {
    console.log(
      `   Sin slot, el checkout cae al horario semanal para decidir la seña.`,
    );
  }

  // 3. Taller activo ese día.
  const workshop = await workshopService.findActiveByDate(companyCode, dateStr);
  console.log(
    `\n3. Taller activo: ${
      workshop
        ? `SÍ · "${workshop.title}" · priceChild=${workshop.priceChild} · requiresDeposit=${workshop.requiresDeposit}`
        : "no"
    }`,
  );

  // 4. Horario semanal: rangos del día y cuáles están marcados sin seña.
  let dayName = moment(dateStr, "YYYY-MM-DD").locale("en").format("dddd");
  dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const doc = await weeklyScheduleService.getForCompany(companyCode);
  const ranges = await weeklyScheduleService.getRangesForDay(
    companyCode,
    dayName,
  );
  console.log(
    `\n4. Horario semanal (${dayName}) · doc weeklySchedule ${
      doc ? "EXISTE" : "NO EXISTE (se usa el fallback a configs viejos)"
    }`,
  );
  if (!ranges.length) console.log("   (sin rangos configurados para ese día)");
  for (const r of ranges) {
    console.log(
      `   ${minutesToTime(r.start)}-${minutesToTime(r.end)} | free=${!!r.free}`,
    );
  }

  const minutes = timeToMinutes(timeStart);
  const freeInSchedule = ranges.some(
    (r) => r.free && minutes >= r.start && minutes < r.end,
  );
  console.log(`   El horario ${timeStart} cae en franja sin seña: ${freeInSchedule}`);

  // 5. La misma cuenta que hace el checkout.
  const priceChildConfig = await configService.findOne({
    code: "priceChild",
    companyCode,
  });
  const priceAdultConfig = await configService.findOne({
    code: "priceAdult",
    companyCode,
  });
  const priceChild = workshop
    ? workshop.priceChild
    : slot?.depositAmount
      ? slot.depositAmount
      : Number(priceChildConfig?.value) || 0;
  const priceAdult = Number(priceAdultConfig?.value) || 0;

  const freeSlot = slot ? !slot.requiresDeposit : !workshop && freeInSchedule;
  const totalPrice = freeSlot
    ? 0
    : childrenQty > 0
      ? childrenQty * priceChild
      : adultsQty * priceAdult;

  console.log(
    `\n5. Resultado del checkout` +
      `\n   priceChild=${priceChild} · priceAdult=${priceAdult}` +
      `\n   freeSlot=${freeSlot}  (${
        slot
          ? "lo decidió el slot: !slot.requiresDeposit"
          : "no hay slot: lo decidió el horario semanal"
      })` +
      `\n   totalPrice=${totalPrice}` +
      `\n   -> ${totalPrice > 0 ? "VA A MERCADO PAGO" : "sin seña, queda toConfirm"}`,
  );

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error("Error inspeccionando:", err);
  process.exit(1);
});
