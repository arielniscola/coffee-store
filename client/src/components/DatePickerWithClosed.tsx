import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
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
  parseISO,
} from "date-fns";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
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

interface DatePickerWithClosedProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  closedDates: string[];
  /** Última fecha reservable (yyyy-MM-dd). Fechas posteriores se deshabilitan. */
  maxDate?: string;
}

export default function DatePickerWithClosed({
  value,
  onChange,
  closedDates,
  maxDate,
}: DatePickerWithClosedProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    value ? startOfMonth(parseISO(value)) : startOfToday(),
  );
  const ref = useRef<HTMLDivElement>(null);

  const closedSet = useMemo(() => new Set(closedDates), [closedDates]);

  // Al abrir, posicionar el calendario en el mes de la fecha elegida.
  useEffect(() => {
    if (open && value) setViewMonth(startOfMonth(parseISO(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cerrar al hacer click afuera o con Escape.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const label = value
    ? format(parseISO(value), "dd/MM/yyyy")
    : "Elegí una fecha";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-left relative"
      >
        <CalendarIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {label}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-[11px] font-semibold text-gray-400 py-1"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const selected = key === value;
              const past = isBefore(day, startOfToday());
              const closed = closedSet.has(key);
              const beyondMax = !!maxDate && key > maxDate;
              const inMonth = isSameMonth(day, viewMonth);
              const isToday = isSameDay(day, startOfToday());
              const disabled = past || closed || beyondMax;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  title={
                    closed
                      ? "Cerrado"
                      : beyondMax
                        ? "Fuera del período de reservas"
                        : undefined
                  }
                  onClick={() => {
                    if (disabled) return;
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`h-9 rounded-lg text-sm flex items-center justify-center transition-all ${
                    closed
                      ? "bg-red-50 text-red-400 line-through cursor-not-allowed"
                      : past || beyondMax
                        ? "text-gray-300 cursor-not-allowed"
                        : selected
                          ? "bg-gradient-to-br from-pink-400 to-blue-400 text-white font-semibold shadow-sm"
                          : inMonth
                            ? "text-gray-700 hover:bg-pink-50"
                            : "text-gray-300 hover:bg-gray-50"
                  } ${isToday && !selected && !closed ? "ring-2 ring-pink-300" : ""}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
              Cerrado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-br from-pink-400 to-blue-400 inline-block" />
              Elegida
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
