import { ChevronLeft, ChevronRight } from "lucide-react";
import { IDaySummary } from "../../interfaces/slot";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEKDAY_HEADERS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

/** yyyy-MM-dd de una fecha local, sin pasar por UTC (que corre el día). */
export const toDateStr = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Las 6 semanas que cubren el mes, empezando en lunes. Se devuelven siempre
 * 42 celdas para que la grilla no cambie de alto al pasar de mes.
 */
function buildGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // getDay() es 0=domingo; queremos 0=lunes.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

interface Props {
  /** Cualquier fecha del mes a mostrar. */
  month: Date;
  /** Disponibilidad ya publicada, por fecha. */
  published: Map<string, IDaySummary>;
  /** Horarios que la configuración actual agregaría, por fecha. */
  preview: Map<string, number>;
  /** Fechas cerradas por completo (yyyy-MM-dd). */
  closed: Set<string>;
  selected: string;
  onSelect: (date: string) => void;
  onMonthChange: (month: Date) => void;
}

/**
 * Calendario del mes: es a la vez la previsualización de lo que se va a
 * publicar (rosa punteado) y la vista de lo ya publicado (azul). Al elegir un
 * día, la pantalla muestra abajo sus horarios para editarlos.
 */
export function AvailabilityCalendar({
  month,
  published,
  preview,
  closed,
  selected,
  onSelect,
  onMonthChange,
}: Props) {
  const todayStr = toDateStr(new Date());
  const days = buildGrid(month);

  const shiftMonth = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow">
      <header className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[15px] font-semibold text-gray-800 min-w-44 text-center">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          <Legend className="bg-blue-100 border-blue-300">publicado</Legend>
          <Legend className="bg-pink-50 border-pink-400 border-dashed">
            se va a publicar
          </Legend>
          <Legend className="bg-purple-50 border-purple-300">taller</Legend>
          <Legend className="bg-slate-100 border-gray-200">cerrado</Legend>
        </div>
      </header>

      <div className="px-5 pt-4 pb-5">
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAY_HEADERS.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-semibold text-gray-400"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const dateStr = toDateStr(day);
            const outside = day.getMonth() !== month.getMonth();
            return (
              <DayCell
                key={dateStr}
                dateStr={dateStr}
                dayNumber={day.getDate()}
                outside={outside}
                isToday={dateStr === todayStr}
                isSelected={dateStr === selected}
                isClosed={closed.has(dateStr)}
                published={published.get(dateStr)}
                incoming={preview.get(dateStr) || 0}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Legend({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm border ${className}`} />
      {children}
    </span>
  );
}

interface CellProps {
  dateStr: string;
  dayNumber: number;
  outside: boolean;
  isToday: boolean;
  isSelected: boolean;
  isClosed: boolean;
  published?: IDaySummary;
  incoming: number;
  onSelect: (date: string) => void;
}

/**
 * Una celda del calendario. El orden de precedencia importa: un día cerrado no
 * ofrece nada aunque la configuración lo alcance, y lo que se va a publicar se
 * muestra por encima de lo ya publicado porque es lo que el usuario está
 * decidiendo en ese momento.
 */
function DayCell({
  dateStr,
  dayNumber,
  outside,
  isToday,
  isSelected,
  isClosed,
  published,
  incoming,
  onSelect,
}: CellProps) {
  if (outside) {
    return (
      <div className="h-[58px] rounded-lg bg-slate-50 px-2 py-1.5 text-[13px] text-gray-300">
        {dayNumber}
      </div>
    );
  }

  let tone = "bg-white border border-gray-200 hover:border-pink-300";
  let badge: { text: string; className: string } | null = null;

  if (isClosed) {
    tone = "bg-slate-100 border border-gray-200";
    badge = { text: "cerrado", className: "text-gray-400" };
  } else if (incoming > 0) {
    tone = "bg-pink-50 border border-dashed border-pink-400";
    badge = { text: `+${incoming}`, className: "text-pink-600 font-medium" };
  } else if (published && published.total > 0) {
    const isWorkshop = published.workshop > 0;
    tone = isWorkshop
      ? "bg-purple-50 border border-purple-300"
      : "bg-blue-50 border border-blue-300";
    badge = {
      text: isWorkshop
        ? `${published.total} · taller`
        : `${published.total} horario${published.total === 1 ? "" : "s"}`,
      className: isWorkshop ? "text-purple-700" : "text-blue-700",
    };
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(dateStr)}
      className={`h-[58px] rounded-lg px-2 py-1.5 text-left transition-colors ${tone} ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-0" : ""
      }`}
    >
      <div
        className={`text-[13px] ${
          isToday || isSelected
            ? "font-bold text-gray-800"
            : isClosed
              ? "text-gray-400 font-medium"
              : "text-gray-800 font-medium"
        }`}
      >
        {dayNumber}
      </div>
      {badge ? (
        <div className={`mt-1.5 text-[11px] truncate ${badge.className}`}>
          {badge.text}
        </div>
      ) : isToday ? (
        <div className="mt-1.5 text-[11px] text-gray-500">hoy</div>
      ) : null}
    </button>
  );
}

export default AvailabilityCalendar;
