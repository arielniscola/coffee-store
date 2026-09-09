import { CalendarRange } from "lucide-react";
import {
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export interface DateRange {
  /** YYYY-MM-DD, inclusive. */
  from: string;
  /** YYYY-MM-DD, inclusive. */
  to: string;
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * La semana del negocio arranca el lunes y termina el domingo, así que todos
 * los presets semanales usan `weekStartsOn: 1` en vez del domingo por defecto
 * de date-fns.
 */
const weekOf = (base: Date): DateRange => ({
  from: fmt(startOfWeek(base, { weekStartsOn: 1 })),
  to: fmt(endOfWeek(base, { weekStartsOn: 1 })),
});

const monthOf = (base: Date): DateRange => ({
  from: fmt(startOfMonth(base)),
  to: fmt(endOfMonth(base)),
});

export const PRESETS: { key: string; label: string; range: () => DateRange }[] =
  [
    { key: "thisWeek", label: "Esta semana", range: () => weekOf(new Date()) },
    {
      key: "lastWeek",
      label: "Semana pasada",
      range: () => weekOf(addWeeks(new Date(), -1)),
    },
    { key: "thisMonth", label: "Este mes", range: () => monthOf(new Date()) },
    {
      key: "lastMonth",
      label: "Mes pasado",
      range: () => monthOf(subMonths(new Date(), 1)),
    },
  ];

export const defaultRange = (): DateRange => monthOf(new Date());

/** Devuelve el preset que coincide exactamente con el rango, si hay alguno. */
export const matchPreset = (range: DateRange): string => {
  const hit = PRESETS.find((p) => {
    const r = p.range();
    return r.from === range.from && r.to === range.to;
  });
  return hit ? hit.key : "custom";
};

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangePicker = ({ value, onChange }: Props) => {
  const active = matchPreset(value);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <CalendarRange className="w-4 h-4 text-gray-400" />
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.range())}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              active === p.key
                ? "bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        {active === "custom" && (
          <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-pink-50 text-pink-600 border border-pink-300">
            Personalizado
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={value.from}
            max={value.to}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={value.to}
            min={value.from}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
