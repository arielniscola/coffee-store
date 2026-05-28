import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import {
  CreditCard,
  Search,
  ExternalLink,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import {
  listMpPayments,
  linkPaymentToShift,
  IMpPayment,
} from "../../services/paymentsService";
import { getShifts } from "../../services/shiftService";
import { IShift } from "../../interfaces/shift";
import { format, subDays } from "date-fns";
import toast from "react-hot-toast";

const STATUS_META: Record<
  string,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  approved: {
    label: "Aprobado",
    badge: "bg-green-100 text-green-700 border-green-300",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  pending: {
    label: "Pendiente",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  in_process: {
    label: "En proceso",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Rechazado",
    badge: "bg-red-100 text-red-700 border-red-300",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Cancelado",
    badge: "bg-gray-100 text-gray-700 border-gray-300",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  refunded: {
    label: "Reembolsado",
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
};

const MpPayments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState<IMpPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [from, setFrom] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [linkingPayment, setLinkingPayment] = useState<IMpPayment | null>(
    null,
  );

  const load = async () => {
    try {
      setLoading(true);
      const data = await listMpPayments({ from, to, limit: 100 });
      setPayments(data);
    } catch (e) {
      console.error("Error loading payments:", e);
      toast.error("Error cargando pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: payments.length };
    let totalApproved = 0;
    for (const p of payments) {
      acc[p.status] = (acc[p.status] || 0) + 1;
      if (p.status === "approved") totalApproved += p.amount || 0;
    }
    return { byStatus: acc, totalApproved };
  }, [payments]);

  const filtered = useMemo(() => {
    let arr = payments;
    if (statusFilter !== "all") {
      arr = arr.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.id?.toString().includes(q) ||
          p.payerEmail?.toLowerCase().includes(q) ||
          p.shift?.client?.toLowerCase().includes(q) ||
          p.externalReference?.toLowerCase().includes(q),
      );
    }
    return arr;
  }, [payments, statusFilter, search]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="bg-gray-50 min-h-full">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Movimientos Mercado Pago
                </h1>
                <p className="text-gray-500 text-sm">
                  Pagos recibidos en tu cuenta MP y vinculación con reservas
                </p>
              </div>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Total movimientos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {counts.byStatus.all}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold text-green-600">
                  {counts.byStatus.approved || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(counts.byStatus.pending || 0) +
                    (counts.byStatus.in_process || 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Total cobrado</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${counts.totalApproved.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ID pago, cliente o email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { key: "all", label: "Todos" },
                  { key: "approved", label: "Aprobados" },
                  { key: "pending", label: "Pendientes" },
                  { key: "rejected", label: "Rechazados" },
                  { key: "refunded", label: "Reembolsados" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === s.key
                        ? "bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No hay movimientos en este período.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Verificá que el access token de Mercado Pago esté
                  configurado en Empresa → Configuración.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Pago
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Reserva
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filtered.map((p) => {
                        const meta =
                          STATUS_META[p.status] || {
                            label: p.status,
                            badge:
                              "bg-gray-100 text-gray-700 border-gray-300",
                            icon: <Clock className="w-3.5 h-3.5" />,
                          };
                        return (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {p.dateCreated
                                ? format(
                                    new Date(p.dateCreated),
                                    "dd/MM/yy HH:mm",
                                  )
                                : "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-800">
                                #{String(p.id).slice(-8)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {p.method || p.type || "—"}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {p.shift?.client || p.payerEmail || "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                              ${(p.amount || 0).toFixed(2)} {p.currency}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badge}`}
                              >
                                {meta.icon}
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {p.shift ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs">
                                    Vinculada
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-orange-500">
                                  Sin vincular
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="inline-flex gap-1">
                                {!p.shift && p.status === "approved" && (
                                  <button
                                    onClick={() => setLinkingPayment(p)}
                                    className="p-1.5 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                                    title="Vincular a reserva"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <a
                                  href={`https://www.mercadopago.com.ar/activities/${p.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Ver en Mercado Pago"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {linkingPayment && (
        <LinkPaymentModal
          payment={linkingPayment}
          onClose={() => setLinkingPayment(null)}
          onSuccess={() => {
            setLinkingPayment(null);
            load();
          }}
        />
      )}
    </div>
  );
};

interface LinkPaymentModalProps {
  payment: IMpPayment;
  onClose: () => void;
  onSuccess: () => void;
}

function LinkPaymentModal({
  payment,
  onClose,
  onSuccess,
}: LinkPaymentModalProps) {
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [linking, setLinking] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = (await getShifts(date)) as IShift[];
        setShifts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  const filtered = useMemo(() => {
    if (!filter) return shifts;
    const q = filter.toLowerCase();
    return shifts.filter(
      (s) =>
        s.client?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phoneNumber?.includes(q),
    );
  }, [shifts, filter]);

  const handleLink = async (shiftId: string) => {
    try {
      setLinking(true);
      const res = await linkPaymentToShift(shiftId, payment.id);
      if (res.ack === 0) {
        toast.success("Pago vinculado correctamente");
        onSuccess();
      } else {
        toast.error(res.message || "Error al vincular");
      }
    } catch (e) {
      toast.error("Error al vincular");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-300 to-blue-300 text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Vincular pago a reserva</h2>
            <p className="text-sm text-white/80">
              Pago #{String(payment.id).slice(-8)} · $
              {payment.amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Fecha de la reserva
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Cliente, email o teléfono..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No hay reservas en esa fecha.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto border border-gray-100 rounded-lg">
              {filtered.map((s) => (
                <button
                  key={s._id}
                  onClick={() => handleLink(s._id || "")}
                  disabled={linking}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between disabled:opacity-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {s.client || "Sin nombre"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.timeStart} · {s.peopleQty || 0} personas · $
                      {(s.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {s.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MpPayments;
