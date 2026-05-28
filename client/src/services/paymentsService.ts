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

export const listMpPayments = async (params: {
  from?: string;
  to?: string;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.limit) qs.set("limit", String(params.limit));

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
  return (json.data || []) as IMpPayment[];
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
