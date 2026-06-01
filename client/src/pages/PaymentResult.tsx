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
  ShiftPaymentSummary,
} from "../services/shiftService";
import { getConfigs } from "../services/config";
import { IConfig } from "../interfaces/config";

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

  const handleRetryPayment = () => {
    if (summary?.paymentLink) {
      window.location.href = summary.paymentLink;
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

  const approvedWhatsAppText = summary
    ? `Hola! Confirmo mi reserva ${reservaTag} a nombre de ${summary.client || ""} para el ${formatDateRaw(summary.date)} a las ${summary.timeStart || ""} hs (${summary.peopleQty || 0} personas). El pago ya está aprobado.`
    : `Hola! Confirmo mi reserva ${reservaTag}. El pago ya está aprobado.`;

  const pendingWhatsAppText = summary
    ? `Hola! Hice una reserva ${reservaTag} a nombre de ${summary.client || ""} para el ${formatDateRaw(summary.date)} a las ${summary.timeStart || ""} hs. El pago figura como pendiente, ¿podrían confirmarlo?`
    : `Hola! Tengo la reserva ${reservaTag} con el pago pendiente. ¿Pueden ayudarme a confirmarla?`;

  function formatDateRaw(raw?: string) {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const formatDate = (raw?: string) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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
                          ? ` (${summary.adultsQty} adultos, ${summary.childrenQty} niños)`
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

            <div className="p-6 flex flex-col gap-2">
              {state === "approved" && whatsappNumber && (
                <a
                  href={buildWhatsAppLink(approvedWhatsAppText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  Confirmar por WhatsApp
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

              {state === "rejected" && summary?.paymentLink && (
                <button
                  onClick={handleRetryPayment}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  Reintentar pago
                </button>
              )}

              <Link
                to="/reservas"
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
                  state === "rejected" && summary?.paymentLink
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
