import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Users,
  Baby,
  XCircle,
  TrendingUp,
  Link as LinkIcon,
  Unlink,
  FileSpreadsheet,
  LucideProps,
} from "lucide-react";
import DateRangePicker, { DateRange, defaultRange } from "./dateRangePicker";
import {
  getStatistics,
  downloadShiftsExcel,
} from "../../services/shiftService";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface Stats {
  total: number;
  toConfirm: number;
  confirmed: number;
  paid: number;
  cancelled: number;
  people: number;
  adults: number;
  children: number;
  babies: number;
  /** Turnos con un pago de Mercado Pago asociado. */
  linked: number;
  /** Turnos sin pago asociado (cargados a mano, sin seña, etc.). */
  unlinked: number;
}

/** Filtro de vinculación con pagos de Mercado Pago. */
type LinkedFilter = "all" | "linked" | "unlinked";

const LINKED_FILTERS: { key: LinkedFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "linked", label: "Vinculadas" },
  { key: "unlinked", label: "Sin vincular" },
];

interface KpiProps {
  title: string;
  value: number | string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  gradient: string;
  hint?: string;
}

const KpiCard = ({ title, value, icon: Icon, gradient, hint }: KpiProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md ${gradient}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const ShiftStatistics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [linked, setLinked] = useState<LinkedFilter>("all");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"doughnut"> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getStatistics({ ...range, linked });
        setStats(res as Stats);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range, linked]);

  // El Excel sale con el mismo rango y filtro que se está viendo en pantalla.
  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadShiftsExcel({ ...range, linked });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo generar el Excel",
      );
    } finally {
      setExporting(false);
    }
  };

  const confirmationRate = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.round(
      ((stats.confirmed + stats.paid) / stats.total) * 100,
    );
  }, [stats]);

  const cancellationRate = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.cancelled / stats.total) * 100);
  }, [stats]);

  useEffect(() => {
    if (!stats || !canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Pendientes", "Confirmados", "Pagados", "Cancelados"],
        datasets: [
          {
            data: [
              stats.toConfirm,
              stats.confirmed,
              stats.paid,
              stats.cancelled,
            ],
            backgroundColor: ["#fbbf24", "#60a5fa", "#34d399", "#f87171"],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 16, boxWidth: 12, font: { size: 12 } },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [stats]);

  const peopleSplit = useMemo(() => {
    if (!stats || stats.people === 0) return { adults: 0, children: 0 };
    return {
      adults: Math.round((stats.adults / stats.people) * 100),
      children: Math.round((stats.children / stats.people) * 100),
    };
  }, [stats]);

  const rangeLabel = useMemo(() => {
    try {
      return `${format(parseISO(range.from), "dd/MM/yyyy")} al ${format(
        parseISO(range.to),
        "dd/MM/yyyy",
      )}`;
    } catch {
      return `${range.from} al ${range.to}`;
    }
  }, [range]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="bg-gray-50 min-h-full">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Estadísticas
                </h1>
                <p className="text-gray-500 text-sm">
                  Resumen de turnos · {rangeLabel}
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exporting ? "Generando..." : "Exportar a Excel"}
              </button>
            </div>

            <div className="mb-5">
              <DateRangePicker value={range} onChange={setRange} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-medium text-gray-500">
                Vinculación con pagos:
              </span>
              {LINKED_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setLinked(f.key)}
                  title="Una reserva está vinculada cuando tiene un pago de Mercado Pago asociado"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    linked === f.key
                      ? "bg-pink-50 text-pink-600 border-pink-300"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading || !stats ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
              </div>
            ) : stats.total === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No hay datos para el período {rangeLabel}
                  {linked !== "all" &&
                    ` con el filtro "${
                      LINKED_FILTERS.find((f) => f.key === linked)?.label
                    }"`}
                  .
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <KpiCard
                    title="Total turnos"
                    value={stats.total}
                    icon={Calendar}
                    gradient="bg-gradient-to-br from-pink-400 to-pink-500"
                  />
                  <KpiCard
                    title="Confirmadas + Pagadas"
                    value={stats.confirmed + stats.paid}
                    icon={CheckCircle2}
                    gradient="bg-gradient-to-br from-blue-400 to-blue-500"
                    hint={`${confirmationRate}% del total`}
                  />
                  <KpiCard
                    title="Pendientes"
                    value={stats.toConfirm}
                    icon={Clock}
                    gradient="bg-gradient-to-br from-yellow-400 to-orange-400"
                  />
                  <KpiCard
                    title="Canceladas"
                    value={stats.cancelled}
                    icon={XCircle}
                    gradient="bg-gradient-to-br from-red-400 to-red-500"
                    hint={`${cancellationRate}% del total`}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Distribución de estados
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Reservas del período por estado
                    </p>
                    <div className="h-72">
                      <canvas ref={canvasRef} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Tasa de confirmación
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Confirmadas + pagadas sobre el total
                    </p>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="80"
                            cy="80"
                            r="68"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="14"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="68"
                            fill="none"
                            stroke="url(#grad)"
                            strokeWidth="14"
                            strokeDasharray={`${
                              (confirmationRate / 100) * 2 * Math.PI * 68
                            } 999`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient
                              id="grad"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#f472b6" />
                              <stop offset="100%" stopColor="#60a5fa" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-gray-800">
                            {confirmationRate}%
                          </span>
                          <span className="text-xs text-gray-500">
                            confirmación
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 text-center text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 inline mr-1 text-pink-400" />
                        {stats.confirmed + stats.paid} de {stats.total}{" "}
                        reservas
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <KpiCard
                    title="Total personas"
                    value={stats.people}
                    icon={Users}
                    gradient="bg-gradient-to-br from-purple-400 to-purple-500"
                  />
                  <KpiCard
                    title="Adultos"
                    value={stats.adults}
                    icon={Users}
                    gradient="bg-gradient-to-br from-indigo-400 to-indigo-500"
                    hint={`${peopleSplit.adults}% del total`}
                  />
                  <KpiCard
                    title="Niños"
                    value={stats.children}
                    icon={Baby}
                    gradient="bg-gradient-to-br from-pink-400 to-pink-500"
                    hint={`${peopleSplit.children}% del total`}
                  />
                  <KpiCard
                    title="Bebés"
                    value={stats.babies || 0}
                    icon={Baby}
                    gradient="bg-gradient-to-br from-amber-400 to-amber-500"
                    hint="No ocupan lugar"
                  />
                </div>

                {stats.people > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                      Adultos vs Niños
                    </h2>
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold"
                        style={{ width: `${peopleSplit.adults}%` }}
                        title={`${stats.adults} adultos`}
                      >
                        {peopleSplit.adults > 8 && `${peopleSplit.adults}%`}
                      </div>
                      <div
                        className="bg-gradient-to-r from-pink-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold"
                        style={{ width: `${peopleSplit.children}%` }}
                        title={`${stats.children} niños`}
                      >
                        {peopleSplit.children > 8 &&
                          `${peopleSplit.children}%`}
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Adultos: {stats.adults}</span>
                      <span>Niños: {stats.children}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Pagadas</p>
                      <p className="text-xl font-bold text-gray-800">
                        {stats.paid}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Confirmadas</p>
                      <p className="text-xl font-bold text-gray-800">
                        {stats.confirmed}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-xs text-gray-500">Pendientes</p>
                      <p className="text-xl font-bold text-gray-800">
                        {stats.toConfirm}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-xs text-gray-500">Canceladas</p>
                      <p className="text-xl font-bold text-gray-800">
                        {stats.cancelled}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <LinkIcon className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">
                        Vinculadas a un pago
                      </p>
                      <p className="text-xl font-bold text-gray-800">
                        {stats.linked ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <Unlink className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Sin vincular</p>
                      <p className="text-xl font-bold text-gray-800">
                        {stats.unlinked ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShiftStatistics;
