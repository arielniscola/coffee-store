import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Lock,
  LockOpen,
  Palette,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import {
  IBlock,
  IDaySummary,
  IGenerateResult,
  ISlot,
  WEEKDAYS,
} from "../../interfaces/slot";
import {
  deleteSlots,
  generateSlots,
  getSlotSummary,
  getSlotsByDate,
  setSlotStatus,
  updateSlot,
} from "../../services/slotService";
import { getClosedDates } from "../../services/shiftService";
import { formatLongDate } from "../../utils/dates";
import AvailabilityCalendar, { toDateStr } from "./AvailabilityCalendar";

const today = () => toDateStr(new Date());
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateStr(date);
};

const toMinutes = (time: string) => {
  const [h, m] = String(time).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const newBlock = (): IBlock => ({
  key: Math.random().toString(36).slice(2),
  timeStart: "09:00",
  timeEnd: "11:00",
  requiresDeposit: true,
});

/**
 * Revisa la configuración antes de pedirle nada al servidor: horarios dados
 * vuelta, franjas que se pisan entre sí y días sin elegir. La misma validación
 * corre también en el backend, pero acá el error se ve mientras se escribe.
 */
function validateConfig(
  weekdays: number[],
  from: string,
  to: string,
  blocks: IBlock[]
): string | null {
  if (!weekdays.length) return "Elegí al menos un día de la semana.";
  if (!from || !to) return "Completá el rango de fechas.";
  if (to < from) return "La fecha de fin no puede ser anterior a la de inicio.";
  if (!blocks.length) return "Agregá al menos un horario.";

  for (const block of blocks) {
    if (!block.timeStart || !block.timeEnd) return "Hay un horario incompleto.";
    if (toMinutes(block.timeEnd) <= toMinutes(block.timeStart)) {
      return `En ${block.timeStart}-${block.timeEnd}, el fin debe ser posterior al inicio.`;
    }
  }

  const sorted = [...blocks].sort(
    (a, b) => toMinutes(a.timeStart) - toMinutes(b.timeStart)
  );
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (toMinutes(current.timeStart) < toMinutes(previous.timeEnd)) {
      return `Los horarios ${previous.timeStart}-${previous.timeEnd} y ${current.timeStart}-${current.timeEnd} se superponen.`;
    }
  }
  return null;
}

/**
 * Disponibilidad para reservas: a la izquierda se configura qué publicar y a
 * la derecha el calendario muestra en vivo el efecto (rosa punteado) sobre lo
 * ya publicado (azul). Al elegir un día se editan sus horarios abajo.
 *
 * Ojo con el nombre: acá NO se crean reservas, se crean los horarios en los
 * que la gente puede reservar. Las reservas viven en la sección de turnos.
 */
export default function SlotGenerator() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Configuración
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(inDays(30));
  const [blocks, setBlocks] = useState<IBlock[]>([newBlock()]);

  // Calendario
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [published, setPublished] = useState<Map<string, IDaySummary>>(new Map());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [horizon, setHorizon] = useState<{ date: string | null; total: number }>({
    date: null,
    total: 0,
  });

  // Previsualización en vivo
  const [preview, setPreview] = useState<IGenerateResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Día seleccionado
  const [day, setDay] = useState(today());
  const [slots, setSlots] = useState<ISlot[]>([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const configError = useMemo(
    () => validateConfig(weekdays, from, to, blocks),
    [weekdays, from, to, blocks]
  );

  /** Cuántos horarios agregaría cada día, para pintar el calendario. */
  const previewByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of preview?.preview || []) {
      if (item.status !== "new") continue;
      map.set(item.date, (map.get(item.date) || 0) + 1);
    }
    return map;
  }, [preview]);

  useEffect(() => {
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadHorizon();
  }, []);

  useEffect(() => {
    loadDay(day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  // La previsualización se recalcula sola mientras se configura: es lo que
  // pinta el calendario, así que no puede depender de apretar un botón. Se
  // espera a que el usuario deje de tipear para no disparar una por tecla.
  const previewTimer = useRef<number | null>(null);
  useEffect(() => {
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    if (configError) {
      setPreview(null);
      return;
    }
    previewTimer.current = window.setTimeout(() => runPreview(), 450);
    return () => {
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekdays, from, to, blocks, configError]);

  /** Resumen del mes visible: se piden 6 semanas para cubrir toda la grilla. */
  async function loadMonth() {
    try {
      const first = new Date(month.getFullYear(), month.getMonth(), 1);
      const gridStart = new Date(first);
      gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
      const gridEnd = new Date(gridStart);
      gridEnd.setDate(gridStart.getDate() + 41);

      const [summary, closedDates] = await Promise.all([
        getSlotSummary(toDateStr(gridStart), toDateStr(gridEnd)),
        getClosedDates(),
      ]);
      setPublished(new Map((summary?.days || []).map((d) => [d.date, d])));
      setClosed(new Set(closedDates));
    } catch (e) {
      console.error("Error loading month:", e);
      toast.error("No se pudo cargar el calendario");
    }
  }

  /**
   * Horizonte de la agenda: se mide sobre un año entero, así que es la
   * consulta más cara de la pantalla. Solo se rehace cuando la disponibilidad
   * cambió de verdad, nunca al pasar de mes.
   */
  async function loadHorizon() {
    try {
      const full = await getSlotSummary(today(), inDays(365));
      setHorizon({ date: full?.horizon || null, total: full?.total || 0 });
    } catch (e) {
      console.error("Error loading horizon:", e);
    }
  }

  async function loadDay(date: string) {
    try {
      setDayLoading(true);
      setSelected([]);
      setSlots(await getSlotsByDate(date));
    } catch (e) {
      console.error("Error loading slots:", e);
      toast.error("No se pudo cargar la disponibilidad del día");
    } finally {
      setDayLoading(false);
    }
  }

  const payload = () => ({
    from,
    to,
    weekdays,
    blocks: blocks.map((b) => ({
      timeStart: b.timeStart,
      timeEnd: b.timeEnd,
      requiresDeposit: b.requiresDeposit,
    })),
  });

  async function runPreview() {
    try {
      setPreviewing(true);
      const res = await generateSlots({ ...payload(), dryRun: true });
      if (res.ack) {
        setPreview(null);
        return;
      }
      setPreview(res.data as IGenerateResult);
    } catch (e) {
      console.error(e);
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }

  const publish = async () => {
    if (configError || !preview?.created) return;
    try {
      setPublishing(true);
      const res = await generateSlots({ ...payload(), dryRun: false });
      if (res.ack) {
        toast.error(res.message || "No se pudo publicar");
        return;
      }
      toast.success(res.message || "Disponibilidad publicada");
      await loadMonth();
      await loadHorizon();
      await loadDay(day);
      await runPreview();
    } catch (e) {
      console.error(e);
      toast.error("Error al publicar la disponibilidad");
    } finally {
      setPublishing(false);
    }
  };

  const toggleStatus = async (slot: ISlot) => {
    if (!slot._id) return;
    try {
      setBusy(true);
      const res = await setSlotStatus(
        slot._id,
        slot.status === "open" ? "closed" : "open"
      );
      if (res.ack) {
        toast.error(res.message || "No se pudo cambiar");
        return;
      }
      toast.success(res.message || "Actualizado");
      await loadDay(day);
      await loadMonth();
    } catch (e) {
      console.error(e);
      toast.error("Error al cambiar la disponibilidad");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Pasa una franja publicada de "con seña" a "sin seña" y viceversa. Es la
   * única forma de corregirlo sin borrar la franja: el `requiresDeposit` del
   * slot le gana al flag `free` del horario semanal a la hora de cobrar.
   */
  const toggleDeposit = async (slot: ISlot) => {
    if (!slot._id) return;
    if (slot.kind === "workshop") {
      toast.error("La seña de un taller se cambia desde el taller.");
      return;
    }
    try {
      setBusy(true);
      const res = await updateSlot(slot._id, {
        requiresDeposit: !slot.requiresDeposit,
      });
      if (res.ack) {
        toast.error(res.message || "No se pudo cambiar la seña");
        return;
      }
      toast.success(
        slot.requiresDeposit
          ? "La franja pasó a sin seña"
          : "La franja pasó a con seña",
      );
      await loadDay(day);
    } catch (e) {
      console.error(e);
      toast.error("Error al cambiar la seña");
    } finally {
      setBusy(false);
    }
  };

  const removeSelected = async () => {
    if (!selected.length) return;
    try {
      setBusy(true);
      const res = await deleteSlots(selected);
      if (res.ack) {
        toast.error(res.message || "No se pudo eliminar");
        return;
      }
      // Las que tienen reservas no se borran: el backend las devuelve acá.
      const data = res.data as { blocked: { timeStart: string }[] };
      if (data?.blocked?.length) {
        toast(res.message || "", { icon: "⚠️" });
      } else {
        toast.success(res.message || "Disponibilidades eliminadas");
      }
      await loadDay(day);
      await loadMonth();
      await loadHorizon();
      await runPreview();
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar");
    } finally {
      setBusy(false);
    }
  };

  const toggleWeekday = (value: number) =>
    setWeekdays((current) =>
      current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value]
    );

  const updateBlock = (key: string, changes: Partial<IBlock>) =>
    setBlocks((current) =>
      current.map((b) => (b.key === key ? { ...b, ...changes } : b))
    );

  const selectDay = (date: string) => {
    setDay(date);
    // Elegir un día de otro mes mueve el calendario con él.
    const picked = new Date(`${date}T00:00:00`);
    if (picked.getMonth() !== month.getMonth()) {
      setMonth(new Date(picked.getFullYear(), picked.getMonth(), 1));
    }
  };

  const reservedIn = (slot: ISlot) =>
    (slot.occupiedAdults || 0) + (slot.occupiedChildren || 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-7 pb-32 space-y-5">

            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Disponibilidad</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Los horarios en los que se puede reservar. Esto no crea reservas.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-gray-200 text-[13px] text-gray-600">
                <span
                  className={`w-2 h-2 rounded-full ${
                    horizon.date ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                />
                {horizon.date ? (
                  <>
                    Reservable hasta el{" "}
                    <strong className="font-semibold text-gray-800">
                      {horizon.date.split("-").reverse().slice(0, 2).join("/")}
                    </strong>{" "}
                    · {horizon.total} horarios
                  </>
                ) : (
                  "Todavía no hay horarios publicados"
                )}
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 items-start">

              {/* Configuración */}
              <section className="w-full xl:w-[400px] xl:flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden shadow">
                <header className="px-5 py-4 border-b border-slate-100">
                  <div className="text-[15px] font-semibold text-gray-800">
                    Publicar horarios
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Se marcan en el calendario mientras elegís
                  </div>
                </header>

                <div className="p-5 space-y-5">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">
                      Días
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {WEEKDAYS.map((wd) => {
                        const on = weekdays.includes(wd.value);
                        return (
                          <button
                            key={wd.value}
                            type="button"
                            onClick={() => toggleWeekday(wd.value)}
                            title={wd.label}
                            className={`w-11 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                              on
                                ? "bg-pink-400 text-white font-semibold"
                                : "bg-white border border-gray-300 text-gray-500 hover:border-pink-300"
                            }`}
                          >
                            {wd.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">
                      Rango
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-pink-200"
                      />
                      <span className="text-[13px] text-gray-400">al</span>
                      <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-pink-200"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[30, 60, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setFrom(today());
                            setTo(inDays(d));
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:border-pink-300"
                        >
                          {d} días
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-gray-600">
                        Horarios de cada día
                      </div>
                      <button
                        type="button"
                        onClick={() => setBlocks([...blocks, newBlock()])}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-pink-500 hover:text-pink-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar
                      </button>
                    </div>

                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <div
                          key={block.key}
                          className={`border rounded-lg p-3 ${
                            block.requiresDeposit
                              ? "border-gray-200"
                              : "border-emerald-200 bg-emerald-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <input
                              type="time"
                              value={block.timeStart}
                              onChange={(e) =>
                                updateBlock(block.key, {
                                  timeStart: e.target.value,
                                })
                              }
                              className="border border-gray-300 rounded-md px-2 py-1.5 text-[13px] bg-white"
                            />
                            <span className="text-xs text-gray-400">a</span>
                            <input
                              type="time"
                              value={block.timeEnd}
                              onChange={(e) =>
                                updateBlock(block.key, {
                                  timeEnd: e.target.value,
                                })
                              }
                              className="border border-gray-300 rounded-md px-2 py-1.5 text-[13px] bg-white"
                            />
                            <span className="text-[11px] text-gray-400">
                              {toMinutes(block.timeEnd) -
                                toMinutes(block.timeStart) >
                              0
                                ? `${toMinutes(block.timeEnd) - toMinutes(block.timeStart)} min`
                                : "—"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setBlocks(
                                  blocks.filter((b) => b.key !== block.key)
                                )
                              }
                              className="ml-auto text-gray-400 hover:text-red-500"
                              aria-label={`Quitar horario ${block.timeStart}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={block.requiresDeposit}
                              onClick={() =>
                                updateBlock(block.key, {
                                  requiresDeposit: !block.requiresDeposit,
                                })
                              }
                              className={`relative inline-flex items-center h-5 w-9 shrink-0 rounded-full transition-colors ${
                                block.requiresDeposit
                                  ? "bg-blue-400"
                                  : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                                  block.requiresDeposit
                                    ? "translate-x-[18px]"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs whitespace-nowrap ${
                                block.requiresDeposit
                                  ? "text-gray-600"
                                  : "text-emerald-700 font-medium"
                              }`}
                            >
                              {block.requiresDeposit ? "Con seña" : "Sin seña"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {configError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-[13px] text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {configError}
                    </div>
                  )}

                  {!configError && preview && preview.overlapping > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-[13px] text-amber-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {preview.overlapping} horario(s) se superponen con
                        disponibilidad ya publicada y no se van a crear.
                      </span>
                    </div>
                  )}
                </div>

                <footer className="border-t border-gray-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {configError
                      ? "Completá la configuración"
                      : previewing
                        ? "Calculando…"
                        : preview
                          ? `${preview.created} nuevos${
                              preview.existing
                                ? ` · ${preview.existing} ya existían`
                                : ""
                            }${preview.closed ? ` · ${preview.closed} cerrados` : ""}`
                          : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={publish}
                    disabled={publishing || !!configError || !preview?.created}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-pink-400 to-blue-400 text-white text-[13px] font-semibold hover:from-pink-300 hover:to-blue-300 disabled:opacity-50"
                  >
                    {publishing
                      ? "Publicando…"
                      : `Publicar ${preview?.created || 0}`}
                  </button>
                </footer>
              </section>

              {/* Calendario + día */}
              <div className="flex-1 min-w-0 w-full space-y-5">
                <AvailabilityCalendar
                  month={month}
                  published={published}
                  preview={previewByDate}
                  closed={closed}
                  selected={day}
                  onSelect={selectDay}
                  onMonthChange={setMonth}
                />

                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow">
                  <header className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-[15px] font-semibold text-gray-800 capitalize">
                        {formatLongDate(day)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {slots.length
                          ? `${slots.length} horario${slots.length === 1 ? "" : "s"}`
                          : "sin horarios"}
                        {slots.some((s) => reservedIn(s) > 0)
                          ? ` · ${slots.filter((s) => reservedIn(s) > 0).length} con reservas`
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {slots.length > 0 && (
                        <label className="flex items-center gap-2 text-[13px] text-gray-500 mr-2">
                          <input
                            type="checkbox"
                            checked={
                              selected.length > 0 &&
                              selected.length === slots.length
                            }
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? slots.map((s) => String(s._id))
                                  : []
                              )
                            }
                            className="w-4 h-4 accent-pink-400 cursor-pointer"
                          />
                          Todo
                        </label>
                      )}
                      {selected.length > 0 && (
                        <button
                          type="button"
                          onClick={removeSelected}
                          disabled={busy}
                          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-3.5 py-1.5 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar {selected.length}
                        </button>
                      )}
                    </div>
                  </header>

                  <div className="px-5 py-4">
                    {dayLoading ? (
                      <p className="text-sm text-gray-500 py-3 text-center">
                        Cargando…
                      </p>
                    ) : !slots.length ? (
                      <p className="text-sm text-gray-500 py-6 text-center">
                        {closed.has(day)
                          ? "El local está cerrado este día."
                          : "No hay horarios publicados para este día. Configurá a la izquierda y publicá."}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {slots.map((slot) => {
                          const id = String(slot._id);
                          const reserved = reservedIn(slot);
                          const isChecked = selected.includes(id);
                          return (
                            <li
                              key={id}
                              className={`border rounded-lg px-4 py-3 flex items-start gap-4 ${
                                isChecked
                                  ? "border-pink-200 bg-pink-50"
                                  : slot.status === "closed"
                                    ? "border-gray-200 bg-slate-50"
                                    : "border-gray-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setSelected((current) =>
                                    e.target.checked
                                      ? [...current, id]
                                      : current.filter((s) => s !== id)
                                  )
                                }
                                aria-label={`Seleccionar ${slot.timeStart}`}
                                className="w-4 h-4 mt-1 shrink-0 accent-pink-400 cursor-pointer"
                              />

                              {/* El horario y sus etiquetas en una línea, y la
                                  ocupación abajo: apilarlo todo en una sola
                                  fila dejaba el texto pegado al check. */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-800 tabular-nums">
                                    {slot.timeStart} – {slot.timeEnd}
                                  </span>
                                  {slot.kind === "workshop" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                      <Palette className="w-3 h-3" />
                                      taller
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={busy || slot.kind === "workshop"}
                                    onClick={() => toggleDeposit(slot)}
                                    title={
                                      slot.kind === "workshop"
                                        ? "La seña del taller se configura en el taller"
                                        : slot.requiresDeposit
                                          ? "Pasar a sin seña (no se cobra al reservar)"
                                          : "Pasar a con seña"
                                    }
                                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors disabled:opacity-60 disabled:cursor-default ${
                                      slot.requiresDeposit
                                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    }`}
                                  >
                                    {slot.requiresDeposit
                                      ? `con seña${slot.depositAmount ? ` $${slot.depositAmount}` : ""}`
                                      : "sin seña"}
                                  </button>
                                  {slot.status === "closed" && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                      cerrado
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`text-xs mt-1.5 ${
                                    reserved > 0
                                      ? "text-amber-700"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {reserved > 0
                                    ? `${reserved} lugar(es) reservados · no se puede eliminar`
                                    : `Sin reservas · adultos ${slot.occupiedAdults ?? 0}/${slot.capacityAdults}, niños ${slot.occupiedChildren ?? 0}/${slot.capacityChildren}`}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => toggleStatus(slot)}
                                className="shrink-0 p-2 -mt-1 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                                title={
                                  slot.status === "open"
                                    ? "Cerrar sin borrar (no cancela las reservas)"
                                    : "Reabrir"
                                }
                              >
                                {slot.status === "open" ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <LockOpen className="w-4 h-4" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
