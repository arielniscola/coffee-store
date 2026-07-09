export interface ScheduleTextGroup {
  label: string;
  hours: string[];
}

/** Una línea "abre" una card si empieza con un día de la semana. */
const WEEKDAY_START =
  /^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?)\b/i;

/**
 * Convierte el texto libre de horarios en cards { label, hours[] } para
 * mostrarlas por día en la landing / modal.
 *
 * Convención:
 *  - Una línea que EMPIEZA con un día de la semana abre una card nueva; toda
 *    esa línea es el título (ej.: "Lunes a domingo", "Sábados y Domingos").
 *  - Las líneas siguientes que NO empiezan con un día son franjas horarias de
 *    esa card (ej.: "10 a 12", "18:15 a 20:15"), cada una como un chip.
 *  - También se admite el formato en una sola línea "Días: horario"; lo que
 *    va después del ":" (que no forme parte de una hora) se toma como franja.
 *
 * Ejemplo:
 *   Lunes a domingo        -> card "Lunes a domingo"
 *   10 a 12                    con franjas [10 a 12, 13 a 15, 16 a 18,
 *   13 a 15                                 18:15 a 20:15]
 *   16 a 18
 *   18:15 a 20:15
 */
export function parseScheduleText(text: string): ScheduleTextGroup[] {
  const groups: ScheduleTextGroup[] = [];
  let current: ScheduleTextGroup | null = null;

  const lines = (text || "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    if (WEEKDAY_START.test(line)) {
      // Nueva card. Si la línea trae horario tras ":" (no seguido de dígito,
      // para no confundir con "18:15"), lo tomamos como primera franja.
      const sep = line.match(/:(?!\d)/);
      if (sep && sep.index !== undefined) {
        const label = line.slice(0, sep.index).trim();
        const rest = line.slice(sep.index + 1).trim();
        current = { label, hours: rest ? [rest] : [] };
      } else {
        current = { label: line, hours: [] };
      }
      groups.push(current);
    } else {
      // Franja sin card previa: se muestra en una card sin título.
      if (!current) {
        current = { label: "", hours: [] };
        groups.push(current);
      }
      current.hours.push(line);
    }
  }

  return groups;
}
