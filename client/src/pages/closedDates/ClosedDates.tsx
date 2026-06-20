import { useEffect, useMemo, useState } from "react";
import {
  CalendarOff,
  Trash2,
  Save,
  AlertCircle,
  X,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfToday,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { IConfig } from "../../interfaces/config";
import { getConfigs, updateConfig } from "../../services/config";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import toast from "react-hot-toast";

const CLOSED_DATES_CODE = "closedDates";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const parseDates = (value: unknown): string[] =>
  String(value || "")
    .split(",")
    .map((d) => d.trim())
    .filter((d) => DATE_RE.test(d))
    .sort();

const formatDateLabel = (d: string): string => {
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

export default function ClosedDates() {
  const [config, setConfig] = useState<IConfig | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfToday());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const data = (await getConfigs()) as IConfig[];
      const cfg = data?.find((c) => c.code === CLOSED_DATES_CODE) || null;
      setConfig(cfg);
      setDates(parseDates(cfg?.value));
      setError(null);
    } catch (e) {
      console.error("Error loading closed dates:", e);
      setError("No se pudieron cargar las fechas cerradas.");
    } finally {
      setLoading(false);
    }
  }

  const initial = useMemo(() => parseDates(config?.value), [config]);
  const dirty = useMemo(
    () => initial.join(",") !== [...dates].sort().join(","),
    [initial, dates],
  );

  const closedSet = useMemo(() => new Set(dates), [dates]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const toggleDate = (key: string) => {
    setDates((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key].sort(),
    );
  };

  const removeDate = (d: string) => {
    setDates((prev) => prev.filter((x) => x !== d));
  };

  const handleReset = () => {
    setDates(initial);
    setError(null);
  };

  async function handleSave() {
    if (!config) {
      setError(
        "La configuración de fechas cerradas aún no existe. Reiniciá el servidor para crearla.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateConfig({
        ...config,
        // Centinela "-" cuando no hay fechas: el campo value es requerido y
        // Mongoose rechaza el string vacío.
        value: dates.length > 0 ? dates.join(", ") : "-",
      });
      if (res.ack) {
        toast.error(res.message || "Error al guardar");
        return;
      }
      toast.success("Fechas cerradas actualizadas");
      await loadConfig();
    } catch (e) {
      console.error("Error saving closed dates:", e);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
              </div>
            ) : (
              <div className="max-w-3xl pb-32">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white">
          <CalendarOff className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Días cerrados</h2>
          <p className="text-sm text-gray-500">
            Fechas en las que el local permanece cerrado y no se podrán realizar
            reservas
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 mb-5">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <header className="bg-gradient-to-r from-pink-300 to-blue-300 text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Calendario</h3>
              <p className="text-xs text-white/80">
                Tocá un día para marcarlo como cerrado o liberarlo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold w-36 text-center capitalize">
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-5">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-xs font-semibold text-gray-400 py-1"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const closed = closedSet.has(key);
              const inMonth = isSameMonth(day, viewMonth);
              const past = isBefore(day, startOfToday());
              const isToday = isSameDay(day, startOfToday());
              return (
                <button
                  key={key}
                  type="button"
                  disabled={past}
                  onClick={() => toggleDate(key)}
                  title={
                    past
                      ? "Fecha pasada"
                      : closed
                        ? "Cerrado — tocá para abrir"
                        : "Abierto — tocá para cerrar"
                  }
                  className={`relative h-11 rounded-lg text-sm flex items-center justify-center transition-all ${
                    past
                      ? "text-gray-300 cursor-not-allowed"
                      : closed
                        ? "bg-gradient-to-br from-pink-400 to-blue-400 text-white font-semibold shadow-sm hover:opacity-90"
                        : inMonth
                          ? "text-gray-700 hover:bg-pink-50"
                          : "text-gray-300 hover:bg-gray-50"
                  } ${isToday && !closed ? "ring-2 ring-pink-300" : ""}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-gradient-to-br from-pink-400 to-blue-400 inline-block" />
              Cerrado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded ring-2 ring-pink-300 inline-block" />
              Hoy
            </span>
          </div>
        </div>
      </section>

      {/* Resumen de fechas cerradas */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-5">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Fechas cerradas</h3>
          <span className="text-xs font-medium text-white bg-pink-400 rounded-full px-2 py-0.5">
            {dates.length}
          </span>
        </div>
        <div className="p-5">
          {dates.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <CalendarOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              No hay fechas cerradas configuradas.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-full text-sm"
                >
                  <CalendarOff className="w-3.5 h-3.5" />
                  {formatDateLabel(d)}
                  <button
                    type="button"
                    onClick={() => removeDate(d)}
                    className="p-0.5 text-pink-400 hover:text-pink-700 hover:bg-pink-100 rounded-full transition-colors"
                    aria-label={`Quitar ${formatDateLabel(d)}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sticky bottom bar with save / reset */}
      {dirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white border border-gray-200 shadow-lg rounded-full pl-5 pr-2 py-2 flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-400"></span>
            </span>
            Cambios sin guardar
          </span>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Descartar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-full text-sm font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Guardando..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </button>
        </div>
      )}

      {!dirty && !loading && (
        <div className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          Todos los cambios están guardados
        </div>
      )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
