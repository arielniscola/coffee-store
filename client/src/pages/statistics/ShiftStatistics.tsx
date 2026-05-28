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
  LucideProps,
} from "lucide-react";
import MonthYearPicker from "./yearMonthPicker";
import { getStatistics } from "../../services/shiftService";
import moment from "moment";
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
}

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<"doughnut"> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getStatistics(
          moment(selectedDate).format("MM/YYYY"),
        );
        setStats(res as Stats);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

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

  const monthLabel = moment(selectedDate).format("MMMM YYYY");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="bg-gray-50 min-h-full">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Estadísticas
                </h1>
                <p className="text-gray-500 text-sm capitalize">
                  Resumen de turnos · {monthLabel}
                </p>
              </div>
              <MonthYearPicker
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
            </div>

            {loading || !stats ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
              </div>
            ) : stats.total === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No hay datos para {monthLabel}.
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
                      Reservas del mes por estado
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShiftStatistics;
