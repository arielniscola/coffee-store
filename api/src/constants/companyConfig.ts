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
    code: "scheduleText",
    type: "company",
    dataType: "string",
    name: "Horarios de atención (texto)",
    value: "-",
    description:
      "Horarios de atención que se muestran en la landing y en el modal de reserva (solo informativo). Una línea que empieza con un día de la semana (ej.: «Lunes a domingo») abre una card, y las líneas siguientes son sus franjas horarias (ej.: «10 a 12», «18:15 a 20:15»), una por línea. Si se deja vacío, se usan los horarios del editor semanal.",
  },
  {
    code: "scheduleSubtitle",
    type: "company",
    dataType: "string",
    name: "Horarios de atención (subtítulo)",
    value: "-",
    description:
      "Subtítulo opcional que se muestra sobre las cards de horarios en la landing y el modal (ej.: «Horario especial de Invierno»). Si se deja vacío, no se muestra.",
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
    value: "09:00-18:00",
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
    code: "publicApiBaseUrl",
    type: "company",
    dataType: "string",
    name: "URL pública de la API",
    value: "-",
    description:
      "URL HTTPS pública del backend (ej. https://api.tudominio.com). Se usa como notification_url del webhook de Mercado Pago.",
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
    value: "-",
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
  {
    code: "closedDates",
    type: "company",
    dataType: "string",
    name: "Fechas cerradas",
    value: "-",
    description:
      "Fechas en las que el local permanece cerrado y no se pueden realizar reservas. Formato yyyy-MM-dd separadas por coma.",
  },
  {
    code: "reservationMaxDays",
    type: "company",
    dataType: "number",
    name: "Días máximos de anticipación para reservar",
    value: 0,
    description:
      "Cantidad máxima de días hacia adelante (desde hoy) en los que se puede reservar. Ej.: 30 permite reservar hasta 30 días después de hoy. 0 = sin límite.",
  },
  {
    code: "capacityMode",
    type: "company",
    dataType: "string",
    name: "Modo de capacidad",
    value: "tables",
    description:
      "Cómo se calcula la capacidad por turno: 'tables' suma la capacidad de las mesas activas; 'manual' usa los máximos de adultos y niños configurados abajo.",
  },
  {
    code: "maxAdults",
    type: "company",
    dataType: "number",
    name: "Máximo de adultos (modo manual)",
    value: 0,
    description:
      "Cantidad máxima de adultos por turno cuando el modo de capacidad es 'manual'.",
  },
  {
    code: "maxChildren",
    type: "company",
    dataType: "number",
    name: "Máximo de niños (modo manual)",
    value: 0,
    description:
      "Cantidad máxima de niños por turno cuando el modo de capacidad es 'manual'.",
  },
  {
    code: "smtpHost",
    type: "company",
    dataType: "string",
    name: "SMTP - Host",
    value: "-",
    description:
      "Host del servidor SMTP para el envío de emails de confirmación (ej. smtp.gmail.com).",
  },
  {
    code: "smtpPort",
    type: "company",
    dataType: "number",
    name: "SMTP - Puerto",
    value: 587,
    description: "Puerto del servidor SMTP. 587 para STARTTLS, 465 para SSL.",
  },
  {
    code: "smtpSecure",
    type: "company",
    dataType: "boolean",
    name: "SMTP - Conexión segura",
    value: false,
    description: "Usar SSL/TLS directo. true para el puerto 465, false para 587.",
  },
  {
    code: "smtpUser",
    type: "company",
    dataType: "string",
    name: "SMTP - Usuario",
    value: "-",
    description: "Usuario de autenticación del servidor SMTP.",
  },
  {
    code: "smtpPass",
    type: "company",
    dataType: "string",
    name: "SMTP - Contraseña",
    value: "-",
    description:
      "Contraseña o app password del servidor SMTP. Para Gmail usar una contraseña de aplicación.",
  },
  {
    code: "emailFrom",
    type: "company",
    dataType: "string",
    name: "Email - Remitente",
    value: "-",
    description:
      "Remitente de los emails de confirmación (ej. Reservas <reservas@tudominio.com>). Si queda vacío se usa el usuario SMTP.",
  },
];
