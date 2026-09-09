import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import configService from "./config";
import Log from "../libs/logger";

const log = new Log("MercadoPagoService");

// MP acepta hasta 100 resultados por página en /v1/payments/search.
const PAGE_SIZE = 100;
// Tope duro para no encadenar llamadas indefinidamente contra la API de MP.
const MAX_PAYMENTS = 1000;

async function getClient(companyCode: string): Promise<MercadoPagoConfig | null> {
  const tokenConfig = await configService.findOne({
    code: "mpAccessToken",
    companyCode,
  });
  const accessToken = (tokenConfig?.value as string) || "";
  if (!accessToken) {
    log.error(null, `Mercado Pago access token no configurado para ${companyCode}`);
    return null;
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
}

async function getBaseUrl(companyCode: string): Promise<string> {
  const cfg = await configService.findOne({
    code: "publicBaseUrl",
    companyCode,
  });
  return ((cfg?.value as string) || "http://localhost:5173").replace(/\/$/, "");
}

async function getApiBaseUrl(companyCode: string): Promise<string | null> {
  const cfg = await configService.findOne({
    code: "publicApiBaseUrl",
    companyCode,
  });
  const raw = (cfg?.value as string) || process.env.PUBLIC_API_BASE_URL || "";
  if (!raw) return null;
  const trimmed = raw.replace(/\/$/, "");
  // MP solo acepta notification_url públicas HTTPS.
  if (!/^https:\/\//i.test(trimmed)) return null;
  if (/localhost|127\.0\.0\.1/i.test(trimmed)) return null;
  return trimmed;
}

/** Separador del external_reference legible. Ver `buildExternalReference`. */
const REF_SEP = " | ";

/**
 * Arma el external_reference que viaja a Mercado Pago. Antes era el id pelado
 * de la reserva, así que el comprobante que nos reenvía el cliente no decía
 * nada útil: ahora lleva además la fecha y el horario en formato legible.
 *
 * El número de reserva va SIEMPRE primero y separado por `REF_SEP`, porque
 * todo lo que consume la referencia (webhook, listado de pagos, reconciliador)
 * la parsea con `parseShiftIdFromReference`.
 */
export function buildExternalReference(input: {
  /** Id de la reserva. Va primero: es lo que se parsea de vuelta. */
  shiftId: string;
  /** Código corto de reserva, el mismo que sale en el comprobante. */
  shiftCode: string;
  /** Fecha de la reserva, ya formateada. */
  date: string;
  /** Horario de la reserva (HH:mm). */
  timeStart: string;
}): string {
  // MP corta external_reference en 256 caracteres.
  return [input.shiftId, input.shiftCode, input.date, input.timeStart]
    .join(REF_SEP)
    .slice(0, 256);
}

/**
 * Extrae el id de reserva de un external_reference. Tolera el formato viejo
 * (el id pelado) para que los pagos previos al cambio se sigan vinculando.
 */
export function parseShiftIdFromReference(ref?: string | null): string {
  if (!ref) return "";
  return String(ref).split("|")[0].trim();
}

/**
 * Título del ítem de la preferencia.
 *
 * Es el ÚNICO campo que Mercado Pago imprime en el comprobante de pago que
 * después nos reenvía el cliente ("Comprobante de <título>"): ni la
 * `description` ni el `external_reference` aparecen ahí. Por eso el número de
 * reserva, la fecha y el horario tienen que ir todos en el título.
 *
 * MP además sanea el texto y se come las barras: un `24/09/2026` llegaba como
 * `24092026`. La fecha se arma con `buildTitleDate`, sin barras.
 */
export function buildPaymentTitle(input: {
  /** Código corto de reserva (ver `buildShiftCode`). */
  shiftCode: string;
  /** Fecha ya formateada sin barras (ver `buildTitleDate`). */
  date: string;
  /** Horario de la reserva (HH:mm). */
  timeStart: string;
  /** Título del taller, si la reserva corresponde a uno. */
  workshopTitle?: string;
}): string {
  const que = input.workshopTitle
    ? `Taller ${input.workshopTitle}`
    : "Reserva";
  return `${que} ${input.date} ${input.timeStart} hs - Nro ${input.shiftCode}`.slice(
    0,
    250,
  );
}

/**
 * Detalle del ítem de la preferencia. No sale en el comprobante, pero sí en la
 * pantalla de checkout, así que ahí va el dato en prosa y con el cliente.
 */
export function buildPaymentDescription(input: {
  shiftCode: string;
  date: string;
  timeStart: string;
  client?: string;
}): string {
  const parts = [
    `Reserva Nro ${input.shiftCode}`,
    `${input.date} a las ${input.timeStart}`,
  ];
  if (input.client) parts.push(input.client);
  return parts.join(" - ");
}

export interface PreferenceInput {
  shiftId: string;
  companyCode: string;
  title: string;
  unitPrice: number;
  quantity: number;
  payerEmail?: string;
  /** ISO date string. Si está presente, MP marca expirada la preferencia. */
  expirationDate?: string;
  /**
   * Referencia legible ya armada (ver `buildExternalReference`). Si no viene,
   * se usa el id de la reserva pelado.
   */
  externalReference?: string;
  /** Detalle del ítem: se ve en el comprobante de pago de MP. */
  description?: string;
}

export interface PreferenceOutput {
  preferenceId: string;
  initPoint: string;
}

export const mercadoPagoService = {
  async createPreference(input: PreferenceInput): Promise<PreferenceOutput | null> {
    const client = await getClient(input.companyCode);
    if (!client) return null;

    const baseUrl = await getBaseUrl(input.companyCode);
    const apiBaseUrl = await getApiBaseUrl(input.companyCode);
    const preferenceClient = new Preference(client);

    const isPublicUrl = /^https:\/\//i.test(baseUrl) && !/localhost|127\.0\.0\.1/i.test(baseUrl);

    const notificationUrl = apiBaseUrl
      ? `${apiBaseUrl}/payments/mercadopago/webhook?company=${encodeURIComponent(
          input.companyCode,
        )}`
      : undefined;

    try {
      const result = await preferenceClient.create({
      body: {
        items: [
          {
            id: input.shiftId,
            title: input.title,
            ...(input.description ? { description: input.description } : {}),
            quantity: input.quantity,
            unit_price: input.unitPrice,
            currency_id: "ARS",
          },
        ],
        external_reference: input.externalReference || input.shiftId,
        payer: input.payerEmail ? { email: input.payerEmail } : undefined,
        back_urls: {
          success: `${baseUrl}/payment-result?shiftId=${input.shiftId}`,
          pending: `${baseUrl}/payment-result?shiftId=${input.shiftId}`,
          failure: `${baseUrl}/payment-result?shiftId=${input.shiftId}`,
        },
        ...(isPublicUrl ? { auto_return: "approved" } : {}),
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
        ...(input.expirationDate
          ? {
              expires: true,
              expiration_date_to: input.expirationDate,
            }
          : {}),
        // Solo medios de pago instantáneos. La reserva aparta el lugar 15
        // minutos y la preferencia vence en ese mismo plazo, así que un cupón
        // de efectivo (Pago Fácil / Rapipago) o un pago por cajero no pueden
        // acreditarse a tiempo: el cliente se iba con el cupón, el pago
        // quedaba "pending" y la reserva se cancelaba sola.
        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
        },
        binary_mode: true,
      },
    });

      if (!result.id || !result.init_point) {
        log.error(null, "Mercado Pago no devolvió init_point");
        return null;
      }
      return { preferenceId: result.id, initPoint: result.init_point };
    } catch (e: any) {
      const detail = e?.cause ?? e?.response?.data ?? e?.message;
      log.error(e, `Error creando preferencia MP: ${JSON.stringify(detail)}`);
      return null;
    }
  },

  async getPayment(companyCode: string, paymentId: string) {
    const client = await getClient(companyCode);
    if (!client) return null;
    const payment = new Payment(client);
    try {
      return await payment.get({ id: paymentId });
    } catch (e) {
      log.error(e, `Error consultando pago ${paymentId}`);
      return null;
    }
  },

  /**
   * Lista pagos de la cuenta MP de la compañía en un rango de fechas.
   *
   * Pagina sobre /v1/payments/search hasta cubrir todo el rango (o el tope
   * pedido): antes traíamos una sola página de 100 y los filtros y totales
   * del front se calculaban sobre una muestra incompleta.
   */
  async searchPayments(
    companyCode: string,
    options: { from?: string; to?: string; limit?: number } = {},
  ) {
    const client = await getClient(companyCode);
    if (!client) return [];
    const payment = new Payment(client);

    // Las fechas vienen como "YYYY-MM-DD" desde el front, en hora local del
    // negocio (Argentina, UTC-3). Si las convertimos a UTC midnight, los
    // pagos hechos por la tarde-noche caen fuera del rango. Forzamos offset
    // AR para que el rango cubra el día completo del negocio.
    const AR_OFFSET = "-03:00";
    const beginIso = options.from
      ? `${options.from}T00:00:00.000${AR_OFFSET}`
      : undefined;
    const endIso = options.to
      ? `${options.to}T23:59:59.999${AR_OFFSET}`
      : undefined;

    // MP exige que begin_date y end_date viajen juntos cuando hay range.
    // Si solo nos pasaron una de las dos, completamos con extremos amplios.
    const hasAnyDate = !!(beginIso || endIso);
    const finalBegin =
      beginIso || (hasAnyDate ? "2000-01-01T00:00:00.000-03:00" : undefined);
    const finalEnd =
      endIso ||
      (hasAnyDate ? new Date().toISOString() : undefined);

    const beginMs = finalBegin ? new Date(finalBegin).getTime() : -Infinity;
    const endMs = finalEnd ? new Date(finalEnd).getTime() : Infinity;

    const max = Math.min(options.limit ?? MAX_PAYMENTS, MAX_PAYMENTS);
    const collected: any[] = [];

    try {
      for (let offset = 0; offset < max; offset += PAGE_SIZE) {
        const search = await payment.search({
          options: {
            sort: "date_created",
            criteria: "desc",
            limit: PAGE_SIZE,
            offset,
            ...(hasAnyDate
              ? {
                  range: "date_created",
                  begin_date: finalBegin,
                  end_date: finalEnd,
                }
              : {}),
          },
        });

        const results = (search as any)?.results;
        const page = Array.isArray(results) ? results : [];
        if (!page.length) break;

        // Filtro defensivo: el endpoint /v1/payments/search a veces ignora
        // begin_date/end_date y devuelve todo. Filtramos por date_created
        // contra el rango pedido (en hora AR) para garantizar que el filtro
        // del front realmente funcione.
        for (const p of page) {
          if (!hasAnyDate) {
            collected.push(p);
            continue;
          }
          const created = p?.date_created
            ? new Date(p.date_created).getTime()
            : NaN;
          if (!isNaN(created) && created >= beginMs && created <= endMs) {
            collected.push(p);
          }
        }

        if (collected.length >= max) break;
        // Última página según MP.
        const total = (search as any)?.paging?.total;
        if (typeof total === "number" && offset + page.length >= total) break;
        if (page.length < PAGE_SIZE) break;

        // Viene ordenado desc por date_created: si el último de la página ya
        // es anterior al inicio del rango, las siguientes también lo son.
        if (hasAnyDate) {
          const last = page[page.length - 1]?.date_created;
          if (last && new Date(last).getTime() < beginMs) break;
        }
      }

      return collected.slice(0, max);
    } catch (e: any) {
      const detail = e?.cause ?? e?.response?.data ?? e?.message;
      log.error(
        e,
        `Error listando pagos de la compañía ${companyCode}: ${JSON.stringify(detail)}`,
      );
      // Si falló una página intermedia, devolvemos lo que sí trajimos.
      return collected;
    }
  },

  /**
   * Busca el último pago vinculado a una reserva (por external_reference).
   *
   * MP solo matchea external_reference exacto, así que hay que buscar con la
   * misma cadena que se mandó al crear la preferencia: por eso se guarda en el
   * shift. Las reservas anteriores al cambio no la tienen y se buscan por id.
   */
  async findLastPaymentByShift(
    companyCode: string,
    shiftId: string,
    externalReference?: string,
  ) {
    const client = await getClient(companyCode);
    if (!client) return null;
    const payment = new Payment(client);
    const refs = [externalReference, shiftId].filter(
      (r, i, arr): r is string => !!r && arr.indexOf(r) === i,
    );
    try {
      for (const ref of refs) {
        const search = await payment.search({
          options: { external_reference: ref, sort: "date_created", criteria: "desc" },
        });
        const results = (search as any)?.results;
        if (Array.isArray(results) && results.length) return results[0];
      }
      return null;
    } catch (e) {
      log.error(e, `Error buscando pagos de la reserva ${shiftId}`);
      return null;
    }
  },
};
