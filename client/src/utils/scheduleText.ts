export interface ScheduleTextGroup {
  label: string;
  hours: string;
}

/**
 * Convierte el texto libre de horarios en grupos { label, hours } para poder
 * mostrarlos en cards por día, igual que el horario configurado.
 *
 * Convención: una entrada por línea con formato "Días: horario".
 *   Martes a Viernes: 17:00 - 21:00
 *   Sábados y Domingos: 15:00 - 20:00
 *
 * El separador es el primer ":" que NO forma parte de una hora (no está
 * seguido de un dígito), así "17:00" no se confunde con el separador. Si una
 * línea no tiene separador, se muestra completa como etiqueta (sin horario).
 */
export function parseScheduleText(text: string): ScheduleTextGroup[] {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(/:(?!\d)/);
      if (match && match.index !== undefined) {
        return {
          label: line.slice(0, match.index).trim(),
          hours: line.slice(match.index + 1).trim(),
        };
      }
      return { label: line, hours: "" };
    });
}
