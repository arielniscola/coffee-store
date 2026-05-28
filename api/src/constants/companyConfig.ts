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
    code: "mpAccessToken",
    type: "company",
    dataType: "string",
    name: "Mercado Pago - Access Token",
    value: "-",
    description:
      "Access token de Mercado Pago (TEST-... para pruebas, APP_USR-... para producción).",
  },
  {
    code: "publicBaseUrl",
    type: "company",
    dataType: "string",
    name: "URL pública del sitio",
    value: "http://localhost:5173",
    description:
      "URL base de la landing, se usa para los redirects de Mercado Pago.",
  },
  {
    code: "priceAdult",
    type: "company",
    dataType: "number",
    name: "Precio por adulto",
    value: 0,
    description:
      "Precio de la reserva por cada adulto. Se muestra al cliente al reservar y se guarda como total en la reserva.",
  },
  {
    code: "priceChild",
    type: "company",
    dataType: "number",
    name: "Precio por niño",
    value: 0,
    description:
      "Precio de la reserva por cada niño. Se suma al total al momento de reservar.",
  },
  {
    code: "whatsappNumber",
    type: "company",
    dataType: "string",
    name: "Número de WhatsApp del negocio",
    value: "",
    description:
      "Número en formato internacional sin + ni espacios (ej. 5492611234567). Se usa para los links wa.me en los mensajes de reserva.",
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
