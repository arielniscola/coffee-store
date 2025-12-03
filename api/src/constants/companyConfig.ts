/**
 * Configuraciones por defecto a crear para una compania
 */
export const DEFAULT_COMPANY_SETTINGS = [
  {
    code: "sessionExpiresIn",
    type: "server",
    dataType: "number",
    name: "Tiempo de expiracion de sesion",
    value: 3600,
    description:
      "Tiempo de expiracion de la sesion de usuario (segundos). Por defecto en 3600 segundos (1 hora)",
  },
  {
    code: "durationShift",
    type: "server",
    dataType: "number",
    name: "Tiempo duracion de turno",
    value: 60,
    description: "Tiempo de duracion de los turnos expresado en minutos",
  },
  {
    code: "daysWeek",
    type: "server",
    dataType: "string",
    name: "Dias de la semana laborables",
    value: "Lunes, Martes",
    description:
      "Dias de la semana aplicables a turnos, se expresa nombre del dia seguido de coma",
  },
  {
    code: "timeStartDay",
    type: "server",
    dataType: "string",
    name: "Hora de inicio turno",
    value: "09:00",
    description: "Hora de inicio del dia laboral",
  },
  {
    code: "timeEndDay",
    type: "server",
    dataType: "string",
    name: "Tiempo duracion de turno en minutos",
    value: "18:00",
    description: "Hora de cierre del dia laboral",
  },
];
