import { unauthorized } from ".";
import { URL_API } from "./constants";

export interface IMpPayment {
  id: string;
  status: string;
  statusDetail?: string;
  amount: number;
  netAmount?: number;
  currency: string;
  method?: string;
  type?: string;
  payerEmail?: string;
  dateCreated: string;
  dateApproved?: string;
  externalReference?: string;
  shift?: {
    _id: string;
    client?: string;
    date: string;
    timeStart: string;
    status: string;
    price?: number;
  } | null;
}

export interface IMpPaymentsSummary {
  total: number;
  byStatus: Record<string, number>;
  totalApproved: number;
}

export const listMpPayments = async (params: {
  from?: string;
  to?: string;
  limit?: number;
  /** Estados de MP a traer. Vacío o sin definir = todos. */
  status?: string[];
  /** Solo pagos originados por la app (con external_reference de reserva). */
  onlyReservations?: boolean;
}): Promise<{ payments: IMpPayment[]; summary: IMpPaymentsSummary }> => {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status?.length) qs.set("status", params.status.join(","));
  if (params.onlyReservations) qs.set("onlyReservations", "true");

  const res = await fetch(
    `${URL_API}/payments/mercadopago?${qs.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  if (res.status === 401) unauthorized();
  const json = await res.json();
  return {
    payments: (json.data || []) as IMpPayment[],
    summary: (json.summary || {
      total: 0,
      byStatus: {},
      totalApproved: 0,
    }) as IMpPaymentsSummary,
  };
};

export const linkPaymentToShift = async (
  shiftId: string,
  paymentId: string,
) => {
  const res = await fetch(`${URL_API}/shifts/${shiftId}/link-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ paymentId }),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};
