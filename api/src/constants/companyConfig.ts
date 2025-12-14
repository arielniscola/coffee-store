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
    type: "company",
    dataType: "number",
    name: "Tiempo duracion de turno",
    value: 60,
    description: "Tiempo de duracion de los turnos expresado en minutos",
  },
  {
    code: "daysWeek",
    type: "company",
    dataType: "string",
    name: "Dias de la semana laborables",
    value: "Lunes, Martes, Miercoles, Jueves, Viernes",
    description:
      "Dias de la semana aplicables a turnos, se expresa nombre del dia seguido de coma",
  },
  {
    code: "scheduleDayMonday",
    type: "company",
    dataType: "string",
    name: "Horarios dia Lunes",
    value: "09:00-18:00",
    description: "Horarios para dia Lunes. Ej. 14:00-18:00, 20:00-23:00",
  },
  {
    code: "scheduleDayTuesday",
    type: "company",
    dataType: "string",
    name: "Horarios dia Martes",
    value: "18:00-23:00",
    description: "Horarios para dia Martes. Ej. 14:00-18:00, 20:00-23:00",
  },
  {
    code: "scheduleDayWednesday",
    type: "company",
    dataType: "string",
    name: "Horarios dia Miercoles",
    value: "09:00-18:00",
    description: "Horarios para dia Miercoles. Ej. 14:00-18:00, 20:00-23:00",
  },
  {
    code: "scheduleDayThursday",
    type: "company",
    dataType: "string",
    name: "Horarios dia Jueves",
    value: "18:00-23:00",
    description: "Horarios para dia Jueves. Ej. 14:00-18:00, 20:00-23:00",
  },
  {
    code: "scheduleDayFriday",
    type: "company",
    dataType: "string",
    name: "Horarios dia Viernes",
    value: "09:00",
    description: "Horarios para dia Viernes. Ej. 14:00-18:00, 20:00-23:00",
  },
  {
    code: "scheduleDaySaturday",
    type: "company",
    dataType: "string",
    name: "Horarios dia Sabado",
    value: "18:00-23:00",
    description: "Horarios para dia Sabados. Ej. 14:00-18:00, 20:00-23:00",
  },
  {
    code: "scheduleDaySunday",
    type: "company",
    dataType: "string",
    name: "Horarios dia Domingo",
    value: "09:00-12:00",
    description: "Horarios para dia Domingos. Ej. 14:00-18:00, 20:00-23:00",
  },
];
