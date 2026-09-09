import dotenv from "dotenv";
dotenv.config();

import moment from "moment";
import mongoose from "mongoose";
import { DB } from "../libs/db";
import { ISlot } from "../models/slot";
import slotService from "../services/slot";
import { weeklyScheduleService } from "../services/weeklySchedule";
import { minutesToTime, timeToMinutes } from "../services/scheduleException";

/**
 * Script one-off: alinea el `requiresDeposit` de las disponibilidades ya
 * generadas con el flag `free` del horario semanal.
 *
 * Por qué hace falta: al cobrar, `ShiftController.checkout` mira el
 * `requiresDeposit` del slot y solo cae al horario semanal cuando no hay slot
 * generado. Las franjas se generaron con el default del formulario ("con
 * seña"), así que horarios marcados como libres en el horario semanal
 * igualmente mandaban al cliente a Mercado Pago.
 *
 * Qué NO toca:
 * - Talleres (`kind: "workshop"`): su seña la define el taller.
 * - Slots editados a mano (`source: "manual"`): son una decisión explícita.
 * - Fechas pasadas.
 *
 * Modo directo por horario (`--times`): cuando la compañía no usa las franjas
 * libres del horario semanal — que es lo normal si la disponibilidad se define
 * toda desde el generador de slots —, el modo de arriba no tiene de dónde
 * sacar la regla. Con `--times=09:00,10:00` se le dice explícitamente qué
 * horarios van sin seña y se aplica a todo el rango de fechas de una.
 *
 * Uso:
 *   npx ts-node src/scripts/syncSlotDeposits.ts --dry
 *   npx ts-node src/scripts/syncSlotDeposits.ts
 *   npx ts-node src/scripts/syncSlotDeposits.ts --company=wichiwi --to=2026-12-31
 *   npx ts-node src/scripts/syncSlotDeposits.ts --times=09:00 --dry
 *   npx ts-node src/scripts/syncSlotDeposits.ts --times=09:00,10:00
 *   npx ts-node src/scripts/syncSlotDeposits.ts --times=09:00 --with-deposit
 */

const arg = (name: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : undefined;
};

const DRY = process.argv.includes("--dry");
/** Con --with-deposit el modo por horario pone seña en vez de sacarla. */
const WITH_DEPOSIT = process.argv.includes("--with-deposit");

/** ¿El horario cae dentro de alguna franja libre de ese día de la semana? */
async function isFreeInWeeklySchedule(
  companyCode: string,
  date: Date,
  timeStart: string,
): Promise<boolean> {
  let day = moment(date).utc().locale("en").format("dddd");
  day = day.charAt(0).toUpperCase() + day.slice(1);
  const ranges = await weeklyScheduleService.getRangesForDay(companyCode, day);
  const minutes = timeToMinutes(timeStart);
  if (Number.isNaN(minutes)) return false;
  return ranges.some((r) => r.free && minutes >= r.start && minutes < r.end);
}

(async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/coffeshop";
  await DB.connect(uri);

  const from = arg("from") || moment().format("YYYY-MM-DD");
  const to = arg("to") || moment().add(1, "year").format("YYYY-MM-DD");
  const company = arg("company");

  const times = (arg("times") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const filter: any = {
    kind: "reservation",
    source: "generated",
    // En el modo por horario se buscan las que están en el estado contrario al
    // que se quiere dejar; en el modo horario semanal, siempre las que cobran.
    requiresDeposit: times.length ? !WITH_DEPOSIT : true,
    date: {
      $gte: moment(from, "YYYY-MM-DD").utc(true).startOf("day").toDate(),
      $lte: moment(to, "YYYY-MM-DD").utc(true).endOf("day").toDate(),
    },
  };
  if (company) filter.companyCode = company;
  if (times.length) filter.timeStart = { $in: times };

  const slots: ISlot[] = (await slotService.find(filter, {}, {})) as ISlot[];

  if (times.length) {
    const target = WITH_DEPOSIT;
    console.log(
      `Modo por horario: ${slots.length} disponibilidades en ${times.join(", ")} ` +
        `entre ${from} y ${to}` +
        (company ? ` (compañía ${company})` : " (todas las compañías)") +
        ` pasarían a ${target ? "CON seña" : "SIN seña"}.\n`,
    );
    if (!slots.length) {
      console.log("No hay ninguna en ese estado: no hay nada que hacer.");
      await mongoose.disconnect();
      process.exit(0);
    }
    for (const slot of slots) {
      console.log(
        `  ${moment(slot.date).utc().format("DD/MM/YYYY")} ` +
          `${slot.timeStart}-${slot.timeEnd} [${slot.companyCode}]`,
      );
    }
    if (DRY) {
      console.log(`\n--dry: no se escribió nada. ${slots.length} a cambiar.`);
      await mongoose.disconnect();
      process.exit(0);
    }
    for (const slot of slots) {
      await slotService.updateOne(
        { _id: slot._id },
        { requiresDeposit: target } as Partial<ISlot>,
      );
    }
    console.log(
      `\nListo: ${slots.length} disponibilidades pasadas a ` +
        `${target ? "con" : "sin"} seña.`,
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(
    `Revisando ${slots.length} disponibilidades con seña entre ${from} y ${to}` +
      (company ? ` (compañía ${company})` : " (todas las compañías)"),
  );

  // Diagnóstico: sin franjas `free` en el horario semanal no hay nada que
  // sincronizar, y la causa suele ser que la compañía todavía no tiene el
  // horario estructurado guardado (el fallback a los configs viejos no
  // soporta `free`). Sin esto el script decía "no hay nada para corregir" sin
  // distinguir "ya está todo bien" de "no puedo ver las franjas libres".
  const companies = Array.from(new Set(slots.map((s) => s.companyCode)));
  for (const code of companies) {
    let freeCount = 0;
    for (const name of [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]) {
      const ranges = await weeklyScheduleService.getRangesForDay(code, name);
      const free = ranges.filter((r) => r.free);
      if (free.length) {
        freeCount += free.length;
        console.log(
          `  [${code}] ${name}: sin seña ${free
            .map((r) => `${minutesToTime(r.start)}-${minutesToTime(r.end)}`)
            .join(", ")}`,
        );
      }
    }
    if (!freeCount) {
      console.log(
        `  [${code}] el horario semanal no tiene NINGUNA franja marcada sin seña.\n` +
          `      Revisá el editor de horario semanal (Empresa -> Configuración).\n` +
          `      Si la compañía nunca migró a la colección weeklySchedule, el\n` +
          `      fallback a los configs viejos no soporta 'free': correr antes\n` +
          `      npx ts-node src/migrate-schedule.ts`,
      );
    }
  }

  // El horario semanal es uno por compañía: se cachea para no releerlo por slot.
  const cache = new Map<string, boolean>();
  const toFix: ISlot[] = [];

  for (const slot of slots) {
    const key = `${slot.companyCode}|${moment(slot.date).utc().format("YYYY-MM-DD")}|${slot.timeStart}`;
    if (!cache.has(key)) {
      cache.set(
        key,
        await isFreeInWeeklySchedule(
          slot.companyCode,
          slot.date as Date,
          slot.timeStart,
        ),
      );
    }
    if (cache.get(key)) toFix.push(slot);
  }

  if (!toFix.length) {
    console.log(
      "\nNo hay nada para corregir: ninguna de esas disponibilidades cae " +
        "dentro de una franja sin seña del horario semanal.",
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  for (const slot of toFix) {
    console.log(
      `  ${moment(slot.date).utc().format("DD/MM/YYYY")} ${slot.timeStart}-${slot.timeEnd} ` +
        `[${slot.companyCode}] con seña -> sin seña`,
    );
  }

  if (DRY) {
    console.log(`\n--dry: no se escribió nada. ${toFix.length} a corregir.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  for (const slot of toFix) {
    // `source` se deja en "generated": esto es una corrección, no una edición
    // manual del usuario, y así una regeneración futura lo sigue tratando igual.
    await slotService.updateOne(
      { _id: slot._id },
      { requiresDeposit: false } as Partial<ISlot>,
    );
  }

  console.log(`\nListo: ${toFix.length} disponibilidades pasadas a sin seña.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error("Error sincronizando señas:", err);
  process.exit(1);
});
