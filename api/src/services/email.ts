import nodemailer, { Transporter } from "nodemailer";
import Log from "../libs/logger";
import configService from "./config";
import { IShift, ShiftModel } from "../models/shift";

const log = new Log("EmailService");

let cachedTransporter: Transporter | null = null;
let cachedKey = "";

// Lee un valor de configuración sin lanzar: si no existe devuelve "".
const cfg = async (
  code: string,
  companyCode: string,
): Promise<string> => {
  try {
    const value = await configService.getValue(code, companyCode);
    const str = value == null ? "" : String(value).trim();
    // "-" es el placeholder de "sin configurar" en las configs de compañía.
    return str === "-" ? "" : str;
  } catch {
    return "";
  }
};

// Construye (y cachea) el transporter de nodemailer a partir de la
// configuración SMTP de la compañía. Devuelve null si no está configurado,
// para que el flujo de pago no falle por falta de email.
const getTransporter = async (
  companyCode: string,
): Promise<Transporter | null> => {
  const host = await cfg("smtpHost", companyCode);
  const port = await cfg("smtpPort", companyCode);
  const secure = await cfg("smtpSecure", companyCode);
  const user = await cfg("smtpUser", companyCode);
  const pass = await cfg("smtpPass", companyCode);

  if (!host || !user || !pass) {
    log.warn(`SMTP no configurado para ${companyCode}: se omite el email`);
    return null;
  }

  const key = `${host}|${port}|${secure}|${user}|${pass}`;
  if (cachedTransporter && cachedKey === key) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port) || 587,
    secure: String(secure).toLowerCase() === "true",
    auth: { user, pass },
  });
  cachedKey = key;
  return cachedTransporter;
};

/**
 * dd/MM/yyyy de la fecha de una reserva. Las reservas se guardan como
 * medianoche UTC, así que se formatea con los componentes UTC: usar la zona
 * horaria del proceso correría el día si `TZ` no fuese UTC.
 */
const formatDate = (raw?: Date | string): string => {
  if (!raw) return "";
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};

// Detalle discriminado por tipo (ej. "1 adulto + 2 niños + 1 bebé"). Los bebés
// no suman al total de personas, por eso se listan como una categoría más. Si
// el turno no trae el desglose, se cae al total de personas.
const buildPeopleDetail = (shift: IShift): string => {
  const parts: string[] = [];
  const push = (qty: number | undefined, singular: string, plural: string) => {
    if (qty && qty > 0) parts.push(`${qty} ${qty === 1 ? singular : plural}`);
  };
  push(shift.adultsQty, "adulto", "adultos");
  push(shift.childrenQty, "niño", "niños");
  push(shift.babiesQty, "bebé", "bebés");
  if (parts.length) return parts.join(" + ");
  const total = shift.peopleQty || 0;
  return `${total} ${total === 1 ? "persona" : "personas"}`;
};

// Mensaje prearmado para mandar el comprobante por WhatsApp. Es el mismo que
// arma la pantalla de resultado de pago (PaymentResult), así el negocio recibe
// siempre el mismo formato con los datos de la reserva ya cargados.
const buildReceiptWhatsAppText = (shift: IShift, reservaTag: string): string => {
  const lines = [
    `Hola! Envío el comprobante de pago de mi reserva${reservaTag ? ` #${reservaTag}` : ""}:`,
    "",
    `Nombre: ${shift.client || ""}`,
    `Fecha: ${formatDate(shift.date)}`,
    `Horario: ${shift.timeStart || ""} hs`,
    `Asistentes: ${buildPeopleDetail(shift)}`,
  ];
  if (shift.price && shift.price > 0) {
    lines.push(`Seña abonada: $${shift.price.toLocaleString("es-AR")}`);
  }
  lines.push("", "(adjunto el comprobante de Mercado Pago)");
  return lines.join("\n");
};

const buildConfirmationHtml = (
  shift: IShift,
  companyName: string,
  whatsappNumber: string,
): string => {
  const reservaTag = String(shift._id || "").slice(-8).toUpperCase();
  const waMessage = encodeURIComponent(
    `Hola! Necesito modificar mi reserva${reservaTag ? ` #${reservaTag}` : ""}.`,
  );
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${waMessage}`
    : "";
  const receiptLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        buildReceiptWhatsAppText(shift, reservaTag),
      )}`
    : "";
  const modifyText = waLink
    ? `Si necesitás modificar tu reserva, <a href="${waLink}" style="color:#16a34a;font-weight:600;text-decoration:none;">contactanos por WhatsApp</a>.`
    : "Si necesitás modificar tu reserva, contactanos por WhatsApp.";
  // Bloque para pedir el comprobante: el link ya lleva el mensaje armado con
  // los datos de la reserva, el cliente solo adjunta la captura del pago.
  const receiptBlock = receiptLink
    ? `<div style="margin:20px 0 0;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#166534;">📱 Enviános el comprobante</p>
        <p style="margin:0 0 14px;font-size:13px;color:#15803d;">Mandanos el comprobante de Mercado Pago por WhatsApp y dejamos tu reserva lista. El mensaje ya va con los datos cargados: solo adjuntá la captura del pago.</p>
        <a href="${receiptLink}" style="display:inline-block;background:#22c55e;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;">Enviar comprobante por WhatsApp</a>
      </div>`
    : `<p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Por favor enviános el comprobante de Mercado Pago por WhatsApp para dejar tu reserva lista.</p>`;
  const peopleDetail = buildPeopleDetail(shift);
  const priceRow =
    shift.price && shift.price > 0
      ? `<tr><td style="padding:6px 0;color:#6b7280;">Pagado</td><td style="padding:6px 0;font-weight:600;text-align:right;">$${shift.price.toFixed(2)}</td></tr>`
      : "";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#d1fae5,#ecfdf5);padding:32px;text-align:center;">
      <h1 style="margin:0;font-size:22px;color:#111827;">¡Pago confirmado!</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#4b5563;">Tu reserva fue confirmada.</p>
      ${reservaTag ? `<p style="margin:12px 0 0;font-size:12px;color:#9ca3af;font-family:monospace;">Reserva #${reservaTag}</p>` : ""}
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
        ${shift.client ? `<tr><td colspan="2" style="padding:6px 0;font-weight:700;color:#111827;">${shift.client}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#6b7280;">Fecha</td><td style="padding:6px 0;text-align:right;">${formatDate(shift.date)}${shift.timeStart ? ` · ${shift.timeStart} hs` : ""}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Personas</td><td style="padding:6px 0;text-align:right;">${peopleDetail}</td></tr>
        ${priceRow}
      </table>
      ${receiptBlock}
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">¡Te esperamos! ${modifyText}</p>
    </div>
    ${companyName ? `<div style="padding:16px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;">${companyName}</div>` : ""}
  </div>`;
};

// Envía el email de confirmación de reserva al cliente. No lanza: si algo
// falla solo lo registra, para no romper la reconciliación del pago.
export const sendShiftConfirmationEmail = async (
  shift: IShift,
): Promise<boolean> => {
  try {
    if (!shift?.email) {
      log.warn(`Shift ${shift?._id} sin email: no se envía confirmación`);
      return false;
    }

    const companyCode = shift.companyCode;
    const transporter = await getTransporter(companyCode);
    if (!transporter) return false;

    const from =
      (await cfg("emailFrom", companyCode)) ||
      (await cfg("smtpUser", companyCode));
    const companyName = await cfg("companyName", companyCode);
    const whatsappNumber = await cfg("whatsappNumber", companyCode);

    await transporter.sendMail({
      from,
      to: shift.email,
      subject: `Confirmación de tu reserva${companyName ? ` · ${companyName}` : ""}`,
      html: buildConfirmationHtml(shift, companyName, whatsappNumber),
    });

    log.info(`Email de confirmación enviado a ${shift.email}`);
    return true;
  } catch (e) {
    log.error(e as Error, "Error enviando email de confirmación");
    return false;
  }
};

// Envía la confirmación una sola vez por reserva aprobada. Idempotente:
// usa confirmationEmailSentAt como guarda para evitar reenvíos cuando el
// webhook y el polling reconcilian el mismo pago. Llamar tras marcar paid.
export const sendShiftConfirmationEmailOnce = async (
  shiftId: string,
): Promise<void> => {
  try {
    const shift = (await ShiftModel.findById(shiftId).lean()) as IShift | null;
    if (!shift) return;
    if (shift.paymentStatus !== "approved" && shift.status !== "paid") return;
    if (shift.confirmationEmailSentAt) return;

    const sent = await sendShiftConfirmationEmail(shift);
    if (sent) {
      await ShiftModel.updateOne(
        { _id: shiftId },
        { confirmationEmailSentAt: new Date().toISOString() },
      );
    }
  } catch (e) {
    log.error(e as Error, `Error en envío único de confirmación ${shiftId}`);
  }
};
