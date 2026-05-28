import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  DollarSign,
} from "lucide-react";
import {
  deleteShift,
  getShifts,
  updateShift,
} from "../../../services/shiftService";
import { IShift } from "../../../interfaces/shift";
import { addDays, format } from "date-fns";
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
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  async function loadReservations() {
    try {
      setLoading(true);
      const data = (await getShifts(
        format(currentDate, "yyyy-MM-dd"),
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
    if (!search.trim()) return byStatus;
    const q = search.toLowerCase();
    return byStatus.filter(
      (r) =>
        r.client?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phoneNumber?.includes(q),
    );
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

  return (
    <div className="space-y-5 p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Reservas
          </h1>
          <p className="text-gray-500 text-sm capitalize">
            {currentDate.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -1))}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <input
            type="date"
            value={format(currentDate, "yyyy-MM-dd")}
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            className="px-3 py-1.5 border-0 focus:ring-0 text-gray-700 bg-transparent"
          />
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-1 px-3 py-1.5 text-sm font-medium text-pink-500 hover:bg-pink-50 rounded-md transition-colors"
          >
            Hoy
          </button>
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
        <div className="grid gap-3">
          {filtered.map((r) => {
            const meta = STATUS_META[r.status] || STATUS_META.completed;
            const adults = r.adultsQty ?? r.peopleQty ?? 0;
            const children = r.childrenQty ?? 0;
            return (
              <div
                key={r._id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {r.client || "Sin nombre"}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {r.status === "toConfirm" && (
                      <>
                        <button
                          onClick={() => updateStatus(r, "confirmed")}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirmar"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(r, "cancelled")}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setDeleteId(r._id || "");
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatShiftDate(r.date)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{r.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {r.timeStart || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {r.phoneNumber}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    {adults} adulto{adults !== 1 ? "s" : ""}
                    {children > 0 &&
                      `, ${children} niño${children !== 1 ? "s" : ""}`}
                  </div>
                  {(r.price || 0) > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-700">
                        ${r.price?.toFixed(2)}
                      </span>
                      {r.paymentId && (
                        <span
                          className="text-xs text-gray-400 truncate"
                          title={r.paymentId}
                        >
                          · MP {String(r.paymentId).slice(-8)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {r.description && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notas:</span>{" "}
                      {r.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
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
