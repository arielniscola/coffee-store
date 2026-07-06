import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { IScheduleException } from "../../../interfaces/scheduleException";
import {
  createScheduleException,
  deleteScheduleException,
  getScheduleExceptions,
} from "../../../services/scheduleExceptionService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama cuando se crea o elimina una excepción, para refrescar el calendario. */
  onChanged: () => void;
}

const emptyForm = (date: string) => ({
  type: "open" as "open" | "close",
  dateFrom: date,
  dateTo: date,
  timeStart: "10:00",
  timeEnd: "12:00",
});

const toDateLabel = (value: string): string => {
  const day = String(value).split("T")[0];
  const [y, m, d] = day.split("-");
  if (!y || !m || !d) return day;
  return `${d}/${m}/${y}`;
};

export default function ScheduleExceptionsModal({
  isOpen,
  onClose,
  onChanged,
}: Props) {
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [form, setForm] = useState(emptyForm(today));
  const [items, setItems] = useState<IScheduleException[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm(today));
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function load() {
    try {
      setLoading(true);
      const data = await getScheduleExceptions();
      setItems(data);
    } catch (e) {
      toast.error("No se pudieron cargar las excepciones de horario.");
    } finally {
      setLoading(false);
    }
  }

  const validate = (): string | null => {
    if (!form.dateFrom || !form.dateTo) return "Completá el rango de fechas.";
    if (form.dateTo < form.dateFrom)
      return "La fecha de fin no puede ser anterior a la de inicio.";
    if (!form.timeStart || !form.timeEnd) return "Completá las horas.";
    if (form.timeEnd <= form.timeStart)
      return "La hora de fin debe ser posterior a la de inicio.";
    return null;
  };

  async function handleSubmit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      setSaving(true);
      const res = await createScheduleException(form);
      if (res.ack) {
        toast.error(res.message || "No se pudo crear la excepción.");
        return;
      }
      toast.success(
        form.type === "open"
          ? "Franja habilitada correctamente."
          : "Franja bloqueada correctamente.",
      );
      if (form.type === "close" && res.affectedReservations) {
        toast(
          `Atención: hay ${res.affectedReservations} reserva(s) existente(s) en esa franja. No se cancelaron automáticamente.`,
          { icon: "⚠️", duration: 6000 },
        );
      }
      await load();
      onChanged();
    } catch (e) {
      toast.error("Error al crear la excepción.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    try {
      setDeletingId(id);
      const res = await deleteScheduleException(id);
      if (res.ack) {
        toast.error(res.message || "No se pudo eliminar.");
        return;
      }
      toast.success("Excepción eliminada.");
      await load();
      onChanged();
    } catch (e) {
      toast.error("Error al eliminar.");
    } finally {
      setDeletingId("");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-blue-400 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <CalendarClock className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Horarios por rango de fechas</h3>
              <p className="text-xs text-white/80">
                Abrí o cerrá una franja horaria en un rango de días
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "open" }))}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                form.type === "open"
                  ? "bg-green-50 border-green-400 text-green-700 ring-2 ring-green-200"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              Abrir franja
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "close" }))}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                form.type === "close"
                  ? "bg-red-50 border-red-400 text-red-700 ring-2 ring-red-200"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <CalendarX className="w-4 h-4" />
              Cerrar franja
            </button>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Desde</span>
              <input
                type="date"
                value={form.dateFrom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dateFrom: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Hasta</span>
              <input
                type="date"
                value={form.dateTo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dateTo: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none"
              />
            </label>
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                Hora inicio
              </span>
              <input
                type="time"
                value={form.timeStart}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timeStart: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Hora fin</span>
              <input
                type="time"
                value={form.timeEnd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timeEnd: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none"
              />
            </label>
          </div>

          <p className="text-xs text-gray-400">
            {form.type === "open"
              ? "Se validará que la franja no se pise con los horarios ya configurados."
              : "Bloquea nuevas reservas en la franja. Las reservas ya existentes no se cancelan."}
          </p>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : form.type === "open" ? (
              <CalendarPlus className="w-4 h-4" />
            ) : (
              <CalendarX className="w-4 h-4" />
            )}
            {form.type === "open" ? "Habilitar franja" : "Bloquear franja"}
          </button>

          {/* Lista de excepciones */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Excepciones configuradas
            </h4>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                No hay excepciones configuradas.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it._id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 border border-gray-100 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          it.type === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {it.type === "open" ? (
                          <CalendarPlus className="w-3 h-3" />
                        ) : (
                          <CalendarX className="w-3 h-3" />
                        )}
                        {it.type === "open" ? "Abre" : "Cierra"}
                      </span>
                      <span className="text-sm text-gray-700 truncate">
                        {toDateLabel(it.dateFrom)} – {toDateLabel(it.dateTo)}
                        <span className="text-gray-400">
                          {" "}
                          · {it.timeStart}-{it.timeEnd}
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(it._id)}
                      disabled={deletingId === it._id}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50"
                      aria-label="Eliminar excepción"
                    >
                      {deletingId === it._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
