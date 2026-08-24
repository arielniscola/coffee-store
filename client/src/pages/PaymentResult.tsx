import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Home,
  RefreshCw,
  CreditCard,
  Calendar,
  Users,
  MessageCircle,
} from "lucide-react";
import {
  getShiftPaymentStatus,
  retryShiftPayment,
  ShiftPaymentSummary,
} from "../services/shiftService";
import { getConfigs } from "../services/config";
import { IConfig } from "../interfaces/config";
import { formatShortDate } from "../utils/dates";

type State = "loading" | "approved" | "pending" | "rejected" | "unknown";

// Backoff exponencial (segundos) para el polling. Después del último el botón
// "Actualizar estado" queda como única opción.
const POLL_DELAYS_SEC = [3, 5, 8, 13, 21, 30, 30, 30, 30, 30];

export default function PaymentResult() {
  const [params] = useSearchParams();
  const shiftId = params.get("shiftId") || "";
  const mpStatusParam = params.get("status") || "";
  const paymentIdParam =
    params.get("payment_id") || params.get("collection_id") || "";

  const [state, setState] = useState<State>("loading");
  const [summary, setSummary] = useState<ShiftPaymentSummary | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const configs = (await getConfigs()) as IConfig[];
        const num = String(
          configs?.find((c) => c.code === "whatsappNumber")?.value || "",
        ).replace(/[^\d]/g, "");
        setWhatsappNumber(num);
      } catch {
        /* opcional, si falla no mostramos el botón */
      }
    })();
  }, []);

  const triesRef = useRef(0);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Una sola "ronda" de consulta. Devuelve true si llegó a estado final.
  const fetchOnce = useCallback(async (): Promise<boolean> => {
    try {
      const res = await getShiftPaymentStatus(shiftId, paymentIdParam);
      if (cancelledRef.current) return true;
      if (res.shift) setSummary(res.shift);
      const ps = res.paymentStatus;
      if (ps === "approved" || res.status === "paid") {
        setState("approved");
        return true;
      }
      if (ps === "rejected" || res.status === "cancelled") {
        setState("rejected");
        return true;
      }
      setState("pending");
      return false;
    } catch {
      if (!cancelledRef.current) setState("unknown");
      return true;
    }
  }, [shiftId, paymentIdParam]);

  useEffect(() => {
    if (!shiftId) {
      setState("unknown");
      return;
    }
    cancelledRef.current = false;
    triesRef.current = 0;

    const loop = async () => {
      const done = await fetchOnce();
      if (cancelledRef.current) return;
      // Seguimos puliendo solo si MP redirigió como approved pero aún no llegó
      // la confirmación, o si el estado quedó pending.
      const shouldKeepPolling =
        !done &&
        (mpStatusParam === "approved" || mpStatusParam === "" || mpStatusParam === "pending") &&
        triesRef.current < POLL_DELAYS_SEC.length;
      if (!shouldKeepPolling) return;
      const delay = POLL_DELAYS_SEC[triesRef.current] * 1000;
      triesRef.current += 1;
      timeoutRef.current = setTimeout(loop, delay);
    };

    loop();

    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [shiftId, mpStatusParam, fetchOnce]);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchOnce();
    setRefreshing(false);
  };

  // El link de pago guardado ya no sirve: la preferencia de Mercado Pago vence
  // a los 15 minutos y la reserva quedó cancelada. Se pide un checkout nuevo,
  // que además vuelve a chequear que el horario siga teniendo lugar.
  const handleRetryPayment = async () => {
    if (retrying) return;
    setRetrying(true);
    setRetryError("");
    try {
      const res = await retryShiftPayment(shiftId);
      if (res.ack === 0 && res.paymentLink) {
        window.location.href = res.paymentLink;
        return;
      }
      if (res.alreadyPaid) {
        setState("approved");
        return;
      }
      setRetryError(
        res.message || "No pudimos generar un nuevo link de pago.",
      );
    } catch {
      setRetryError(
        "No pudimos conectarnos para reintentar el pago. Probá de nuevo.",
      );
    } finally {
      setRetrying(false);
    }
  };

  const config: Record<
    Exclude<State, "loading">,
    { icon: React.ReactNode; title: string; subtitle: string; color: string }
  > = {
    approved: {
      icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
      title: "¡Pago confirmado!",
      subtitle:
        "Tu reserva fue confirmada. Te enviamos los detalles por mail.",
      color: "from-green-100 to-green-50",
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-yellow-500" />,
      title: "Pago en proceso",
      subtitle:
        "Mercado Pago suele tardar entre 1 y 5 minutos en acreditar. Mientras tanto tu mesa queda reservada. Si pasaron más de 10 minutos, contactanos por WhatsApp para confirmar.",
      color: "from-yellow-100 to-yellow-50",
    },
    rejected: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: "Pago rechazado",
      subtitle:
        "El pago no pudo procesarse. Volvé a intentar o contactanos por WhatsApp.",
      color: "from-red-100 to-red-50",
    },
    unknown: {
      icon: <XCircle className="w-16 h-16 text-gray-400" />,
      title: "No encontramos tu reserva",
      subtitle: "Por favor contactanos para verificar el estado del pago.",
      color: "from-gray-100 to-gray-50",
    },
  };

  const buildWhatsAppLink = (text: string) => {
    if (!whatsappNumber) return "";
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const reservaTag = shiftId
    ? `#${shiftId.slice(-8).toUpperCase()}`
    : "";

  // La fecha de la reserva llega como ISO en medianoche UTC: se formatea desde
  // el string para no correr un día según la zona horaria del navegador.
  const formatDate = (raw?: string) => (raw ? formatShortDate(raw) : "");

  // Detalle discriminado por tipo (ej. "1 adulto + 2 niños + 1 bebé"). Si el
  // turno no trae el desglose, se cae al total de personas.
  const buildPeopleDetail = (s: ShiftPaymentSummary) => {
    const parts: string[] = [];
    const push = (qty: number | undefined, singular: string, plural: string) => {
      if (qty && qty > 0) parts.push(`${qty} ${qty === 1 ? singular : plural}`);
    };
    push(s.adultsQty, "adulto", "adultos");
    push(s.childrenQty, "niño", "niños");
    push(s.babiesQty, "bebé", "bebés");
    if (parts.length) return parts.join(" + ");
    const total = s.peopleQty || 0;
    return `${total} ${total === 1 ? "persona" : "personas"}`;
  };

  // Mensaje prearmado para mandar el comprobante. Va con los datos de la
  // reserva así el negocio no tiene que pedirlos aparte.
  const approvedWhatsAppText = (() => {
    if (!summary) {
      return `Hola! Envío el comprobante de pago de mi reserva ${reservaTag}.`;
    }
    const lines = [
      `Hola! Envío el comprobante de pago de mi reserva ${reservaTag}:`,
      "",
      `Nombre: ${summary.client || ""}`,
      `Fecha: ${formatDate(summary.date)}`,
      `Horario: ${summary.timeStart || ""} hs`,
      `Asistentes: ${buildPeopleDetail(summary)}`,
    ];
    if (summary.price && summary.price > 0) {
      lines.push(`Seña abonada: $${summary.price.toLocaleString("es-AR")}`);
    }
    lines.push("", "(adjunto el comprobante de Mercado Pago)");
    return lines.join("\n");
  })();

  const pendingWhatsAppText = summary
    ? `Hola! Hice una reserva ${reservaTag} a nombre de ${summary.client || ""} para el ${formatDate(summary.date)} a las ${summary.timeStart || ""} hs. El pago figura como pendiente, ¿podrían confirmarlo?`
    : `Hola! Tengo la reserva ${reservaTag} con el pago pendiente. ¿Pueden ayudarme a confirmarla?`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {state === "loading" ? (
          <div className="p-10 text-center">
            <Loader2 className="w-12 h-12 text-pink-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Verificando tu pago...</p>
          </div>
        ) : (
          <>
            <div
              className={`bg-gradient-to-br ${config[state].color} p-8 text-center`}
            >
              <div className="flex justify-center mb-4">
                {config[state].icon}
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {config[state].title}
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                {config[state].subtitle}
              </p>
              {shiftId && (
                <p className="text-xs text-gray-400 mt-4 font-mono">
                  Reserva #{shiftId.slice(-8).toUpperCase()}
                </p>
              )}
            </div>

            {state === "approved" && summary && (
              <div className="px-6 pt-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                  {summary.client && (
                    <p className="font-semibold text-gray-800">
                      {summary.client}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span>
                      {formatDate(summary.date)}
                      {summary.timeStart ? ` · ${summary.timeStart} hs` : ""}
                    </span>
                  </div>
                  {!!summary.peopleQty && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-500" />
                      <span>
                        {summary.peopleQty} personas
                        {summary.adultsQty != null &&
                        summary.childrenQty != null
                          ? ` (${summary.adultsQty} adultos, ${summary.childrenQty} niños${
                              summary.babiesQty
                                ? `, ${summary.babiesQty} bebés`
                                : ""
                            })`
                          : ""}
                      </span>
                    </div>
                  )}
                  {!!summary.price && summary.price > 0 && (
                    <p className="text-xs text-gray-500 pt-2 border-t border-blue-200">
                      Pagado: ${summary.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {state === "approved" && whatsappNumber && (
              <div className="px-6 pt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h2 className="font-semibold text-green-900 text-sm mb-1">
                    📱 Enviános el comprobante
                  </h2>
                  <p className="text-sm text-green-800">
                    Mandanos el comprobante de Mercado Pago por WhatsApp y
                    dejamos tu reserva lista. El mensaje ya va con los datos
                    cargados: solo adjuntá la captura del pago.
                  </p>
                </div>
              </div>
            )}

            <div className="p-6 flex flex-col gap-2">
              {state === "approved" && whatsappNumber && (
                <a
                  href={buildWhatsAppLink(approvedWhatsAppText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar comprobante por WhatsApp
                </a>
              )}

              {state === "pending" && (
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {refreshing ? "Consultando..." : "Actualizar estado"}
                </button>
              )}

              {state === "pending" && whatsappNumber && (
                <a
                  href={buildWhatsAppLink(pendingWhatsAppText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar por WhatsApp
                </a>
              )}

              {state === "rejected" && (
                <button
                  onClick={handleRetryPayment}
                  disabled={retrying}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md disabled:opacity-60"
                >
                  {retrying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {retrying ? "Generando link..." : "Reintentar pago"}
                </button>
              )}

              {retryError && (
                <p className="w-full text-sm text-red-600 text-center">
                  {retryError}
                </p>
              )}

              <Link
                to="/reservas"
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
                  state === "rejected"
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    : "bg-gradient-to-r from-pink-400 to-blue-400 text-white hover:from-pink-300 hover:to-blue-300 shadow-md"
                }`}
              >
                <Home className="w-4 h-4" />
                Volver al inicio
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
