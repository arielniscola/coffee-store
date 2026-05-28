import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import configService from "./config";
import Log from "../libs/logger";

const log = new Log("MercadoPagoService");

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

export interface PreferenceInput {
  shiftId: string;
  companyCode: string;
  title: string;
  unitPrice: number;
  quantity: number;
  payerEmail?: string;
  /** ISO date string. Si está presente, MP marca expirada la preferencia. */
  expirationDate?: string;
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
            quantity: input.quantity,
            unit_price: input.unitPrice,
            currency_id: "ARS",
          },
        ],
        external_reference: input.shiftId,
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

  /** Lista pagos de la cuenta MP de la compañía en un rango de fechas */
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

    try {
      // Pedimos a MP un rango más amplio que el límite del usuario para
      // poder cortar localmente sin perder pagos del borde. Si MP filtra
      // bien por fechas, mejor; si no, lo hacemos nosotros abajo.
      const search = await payment.search({
        options: {
          sort: "date_created",
          criteria: "desc",
          limit: Math.max(options.limit ?? 50, 100),
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
      const arr = Array.isArray(results) ? results : [];

      // Filtro defensivo: el endpoint /v1/payments/search a veces ignora
      // begin_date/end_date y devuelve todo. Filtramos por date_created
      // contra el rango pedido (en hora AR) para garantizar que el filtro
      // del front realmente funcione.
      if (hasAnyDate) {
        const beginMs = finalBegin
          ? new Date(finalBegin).getTime()
          : -Infinity;
        const endMs = finalEnd ? new Date(finalEnd).getTime() : Infinity;
        const filtered = arr.filter((p: any) => {
          const created = p?.date_created
            ? new Date(p.date_created).getTime()
            : NaN;
          if (isNaN(created)) return false;
          return created >= beginMs && created <= endMs;
        });
        return filtered.slice(0, options.limit ?? 50);
      }

      return arr.slice(0, options.limit ?? 50);
    } catch (e: any) {
      const detail = e?.cause ?? e?.response?.data ?? e?.message;
      log.error(
        e,
        `Error listando pagos de la compañía ${companyCode}: ${JSON.stringify(detail)}`,
      );
      return [];
    }
  },

  /** Busca el último pago vinculado a una reserva (por external_reference) */
  async findLastPaymentByShift(companyCode: string, shiftId: string) {
    const client = await getClient(companyCode);
    if (!client) return null;
    const payment = new Payment(client);
    try {
      const search = await payment.search({
        options: { external_reference: shiftId, sort: "date_created", criteria: "desc" },
      });
      const results = (search as any)?.results;
      return Array.isArray(results) && results.length ? results[0] : null;
    } catch (e) {
      log.error(e, `Error buscando pagos de la reserva ${shiftId}`);
      return null;
    }
  },
};
