import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Trash2,
  Check,
  X,
  Search,
  Users,
} from "lucide-react";
import {
  deleteShift,
  getShiftsRange,
  updateShift,
} from "../../../services/shiftService";
import { IShift } from "../../../interfaces/shift";
import { format } from "date-fns";
import toast from "react-hot-toast";
import ModalDelete from "../../../components/DeleteModal";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

type StatusFilter =
  | "all"
  | "toConfirm"
  | "pendingPayment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "paid";

const STATUS_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  toConfirm: {
    label: "Pendiente",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
    dot: "bg-yellow-400",
  },
  pendingPayment: {
    label: "Esperando pago",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    dot: "bg-orange-400",
  },
  confirmed: {
    label: "Confirmado",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    dot: "bg-blue-400",
  },
  paid: {
    label: "Pagado",
    badge: "bg-green-100 text-green-800 border-green-300",
    dot: "bg-green-400",
  },
  cancelled: {
    label: "Cancelado",
    badge: "bg-red-100 text-red-800 border-red-300",
    dot: "bg-red-400",
  },
  completed: {
    label: "Completado",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    dot: "bg-gray-400",
  },
  debt: {
    label: "Impaga",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    dot: "bg-orange-400",
  },
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "toConfirm", label: "Pendientes" },
  { key: "pendingPayment", label: "Esperando pago" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "paid", label: "Pagadas" },
  { key: "cancelled", label: "Canceladas" },
  { key: "completed", label: "Completadas" },
];

export function ReservationList() {
  const [reservations, setReservations] = useState<IShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  // El filtro de fecha de inicio arranca en el día actual; el de fin queda
  // abierto para ver todos los turnos desde hoy en adelante.
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  async function loadReservations() {
    try {
      setLoading(true);
      const data = (await getShiftsRange(
        dateFrom || undefined,
        dateTo || undefined,
      )) as IShift[];
      setReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading reservations:", error);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: reservations.length };
    for (const r of reservations) acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, [reservations]);

  const filtered = useMemo(() => {
    const byStatus =
      filter === "all"
        ? reservations
        : reservations.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    const bySearch = !q
      ? byStatus
      : byStatus.filter(
          (r) =>
            r.client?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.phoneNumber?.includes(q),
        );
    // Ordenar por fecha y luego por hora de inicio.
    return [...bySearch].sort((a, b) => {
      const da = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (da !== 0) return da;
      return (a.timeStart || "").localeCompare(b.timeStart || "");
    });
  }, [reservations, filter, search]);

  const deleteReservation = async () => {
    try {
      const res = await deleteShift(deleteId);
      if (res.ack) {
        notifyError(res.message || "Error al eliminar reserva");
        return;
      }
      notify("Reserva eliminada correctamente");
      loadReservations();
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

  async function updateStatus(shift: IShift, status: string) {
    try {
      const res = await updateShift({ ...shift, status });
      if (res.ack) {
        notifyError(res.message || "Error al actualizar reserva");
        return;
      }
      notify("Reserva actualizada correctamente");
      loadReservations();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  const formatShiftDate = (d: string) => {
    const date = new Date(d);
    return `${String(date.getUTCDate()).padStart(2, "0")}/${String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0")}/${date.getUTCFullYear()}`;
  };

  const resetToToday = () => {
    setDateFrom(format(new Date(), "yyyy-MM-dd"));
    setDateTo("");
  };

  const clearDates = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-5 p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Reservas
          </h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} reserva{filtered.length !== 1 ? "s" : ""}
            {dateFrom || dateTo ? " en el rango seleccionado" : " (todas)"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 mb-1">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 mb-1">Hasta</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
            />
          </label>
          <div className="flex gap-1">
            <button
              onClick={resetToToday}
              className="px-3 py-1.5 text-sm font-medium text-pink-500 hover:bg-pink-50 rounded-lg border border-gray-200 bg-white transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={clearDates}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 bg-white transition-colors"
            >
              Ver todas
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por cliente, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const count = counts[f.key] || 0;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                active
                  ? "bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {f.label}
              <span
                className={`ml-2 inline-flex items-center justify-center min-w-[1.5rem] px-1.5 text-xs rounded-full ${
                  active ? "bg-white/30" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay reservas para mostrar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold px-4 py-3">Fecha</th>
                  <th className="text-left font-semibold px-4 py-3">Hora</th>
                  <th className="text-left font-semibold px-4 py-3">Cliente</th>
                  <th className="text-left font-semibold px-4 py-3">Personas</th>
                  <th className="text-left font-semibold px-4 py-3">Contacto</th>
                  <th className="text-right font-semibold px-4 py-3">Precio</th>
                  <th className="text-left font-semibold px-4 py-3">Estado</th>
                  <th className="text-right font-semibold px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.completed;
                  const adults = r.adultsQty ?? r.peopleQty ?? 0;
                  const children = r.childrenQty ?? 0;
                  return (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {formatShiftDate(r.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {r.timeStart || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {r.client || "Sin nombre"}
                        </div>
                        {r.description && (
                          <div
                            className="text-xs text-gray-400 truncate max-w-[200px]"
                            title={r.description}
                          >
                            {r.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {adults}
                          {children > 0 && ` + ${children} niño${
                            children !== 1 ? "s" : ""
                          }`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 truncate max-w-[200px]" title={r.email}>
                          {r.email || "—"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {r.phoneNumber || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {(r.price || 0) > 0 ? (
                          <span className="font-semibold text-gray-700">
                            ${r.price?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          {r.status === "toConfirm" && (
                            <>
                              <button
                                onClick={() => updateStatus(r, "confirmed")}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Confirmar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(r, "cancelled")}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setDeleteId(r._id || "");
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      <ModalDelete
        id="delete-modal-shift"
        modalOpen={deleteModalOpen}
        setModalOpen={setDeleteModalOpen}
        deleteFn={deleteReservation}
      />
    </div>
  );
}
