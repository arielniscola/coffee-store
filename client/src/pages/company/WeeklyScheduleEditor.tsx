import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, RotateCcw, Loader2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import {
  IWeeklySchedule,
  ITimeRange,
  WeekdayKey,
  WEEKDAYS,
  emptyWeeklySchedule,
} from "../../interfaces/weeklySchedule";
import {
  getWeeklySchedule,
  updateWeeklySchedule,
} from "../../services/weeklyScheduleService";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Valida todas las franjas. Devuelve el primer error o null. */
const validate = (schedule: IWeeklySchedule): string | null => {
  for (const { key, label } of WEEKDAYS) {
    const ranges = schedule[key];
    for (const r of ranges) {
      if (!TIME_RE.test(r.start) || !TIME_RE.test(r.end))
        return `${label}: completá horas válidas (HH:mm).`;
      if (toMin(r.end) <= toMin(r.start))
        return `${label}: la hora de fin debe ser posterior a la de inicio.`;
    }
    const sorted = [...ranges].sort((a, b) => toMin(a.start) - toMin(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (toMin(sorted[i].start) < toMin(sorted[i - 1].end))
        return `${label}: hay franjas que se solapan.`;
    }
  }
  return null;
};

const serialize = (s: IWeeklySchedule) =>
  WEEKDAYS.map(
    ({ key }) => s[key].map((r) => `${r.start}-${r.end}`).join(","),
  ).join("|");

export default function WeeklyScheduleEditor() {
  const [schedule, setSchedule] = useState<IWeeklySchedule>(
    emptyWeeklySchedule(),
  );
  const [initial, setInitial] = useState<IWeeklySchedule>(
    emptyWeeklySchedule(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await getWeeklySchedule();
      const merged = { ...emptyWeeklySchedule(), ...(data || {}) };
      setSchedule(merged);
      setInitial(merged);
    } catch (e) {
      console.error("Error loading weekly schedule:", e);
      toast.error("No se pudo cargar el horario semanal.");
    } finally {
      setLoading(false);
    }
  }

  const dirty = useMemo(
    () => serialize(schedule) !== serialize(initial),
    [schedule, initial],
  );
  const error = useMemo(() => validate(schedule), [schedule]);

  const updateRange = (
    day: WeekdayKey,
    index: number,
    field: keyof ITimeRange,
    value: string,
  ) => {
    setSchedule((prev) => {
      const ranges = [...prev[day]];
      ranges[index] = { ...ranges[index], [field]: value };
      return { ...prev, [day]: ranges };
    });
  };

  const addRange = (day: WeekdayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "18:00" }],
    }));
  };

  const removeRange = (day: WeekdayKey, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  async function handleSave() {
    if (error) {
      toast.error(error);
      return;
    }
    try {
      setSaving(true);
      const res = await updateWeeklySchedule(schedule);
      if (res.ack) {
        toast.error(res.message || "No se pudo guardar el horario.");
        return;
      }
      toast.success("Horario semanal actualizado.");
      setInitial(schedule);
    } catch (e) {
      toast.error("Error al guardar el horario.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Franjas horarias por día
          </p>
          <p className="text-xs text-gray-500">
            Agregá una o varias franjas por día (hora de inicio y fin).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WEEKDAYS.map(({ key, label }) => (
          <div
            key={key}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                {label}
              </span>
              <button
                type="button"
                onClick={() => addRange(key)}
                className="inline-flex items-center gap-1 text-xs font-medium text-pink-500 hover:bg-pink-50 px-2 py-1 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
            {schedule[key].length === 0 ? (
              <p className="text-xs text-gray-400 italic py-1">Cerrado</p>
            ) : (
              <div className="space-y-2">
                {schedule[key].map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={r.start}
                      onChange={(e) =>
                        updateRange(key, i, "start", e.target.value)
                      }
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none"
                    />
                    <span className="text-gray-400 text-sm">a</span>
                    <input
                      type="time"
                      value={r.end}
                      onChange={(e) =>
                        updateRange(key, i, "end", e.target.value)
                      }
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeRange(key, i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Quitar franja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-3">{error}</p>
      )}

      {dirty && (
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !!error}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-lg text-sm font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar horario
          </button>
          <button
            type="button"
            onClick={() => setSchedule(initial)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}
