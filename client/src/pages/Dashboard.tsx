import { useEffect, useState } from "react";
import { Sidebar } from "../partials/sidebar";
import Header from "../partials/headers";
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getShifts } from "../services/shiftService";
import { IShift } from "../interfaces/shift";
import { format, addDays, parseISO } from "date-fns";

// yyyy-MM-dd -> "dd/MM/yyyy" sin construir Date (evita saltos de zona horaria).
const formatDateLabel = (d: string): string => {
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};


interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}

const KpiCard = ({ label, value, icon, gradient }: KpiCardProps) => (
  <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow">
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md ${gradient}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getShifts(selectedDate);
        setShifts(Array.isArray(data) ? (data as IShift[]) : []);
      } catch (e) {
        console.error("Error cargando reservas:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDate]);

  const isToday = selectedDate === todayStr;
  // Un día de diferencia sobre la fecha seleccionada (parseISO da medianoche local).
  const shiftDate = (delta: number) =>
    setSelectedDate(format(addDays(parseISO(selectedDate), delta), "yyyy-MM-dd"));

  const dayShifts = shifts.filter((s) => {
    if (!s.date) return false;
    const d =
      typeof s.date === "string"
        ? s.date.slice(0, 10)
        : format(new Date(s.date), "yyyy-MM-dd");
    return d === selectedDate && s.status !== "cancelled";
  });
  const confirmedDay = dayShifts.filter(
    (s) => s.status === "confirmed" || s.status === "paid",
  );
  const pendingDay = dayShifts.filter((s) => s.status === "toConfirm");
  const peopleDay = dayShifts.reduce((acc, s) => acc + (s.peopleQty || 0), 0);
  const upcoming = [...dayShifts]
    .filter((s) => s.timeStart)
    .sort((a, b) => a.timeStart.localeCompare(b.timeStart))
    .slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="bg-gray-50 min-h-full">
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Panel de Control
                </h1>
                <p className="text-gray-500 mt-1">
                  {isToday ? "Resumen del día — " : "Resumen del "}
                  {formatDateLabel(selectedDate)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-pink-500 transition-colors"
                  aria-label="Día anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) =>
                      setSelectedDate(e.target.value || todayStr)
                    }
                    className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-pink-500 transition-colors"
                  aria-label="Día siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  disabled={isToday}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
                >
                  Hoy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard
                label={isToday ? "Reservas hoy" : "Reservas"}
                value={loading ? "…" : dayShifts.length}
                icon={<Calendar className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-pink-400 to-pink-500"
              />
              <KpiCard
                label="Confirmadas"
                value={loading ? "…" : confirmedDay.length}
                icon={<TrendingUp className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-green-400 to-green-500"
              />
              <KpiCard
                label="Pendientes"
                value={loading ? "…" : pendingDay.length}
                icon={<Clock className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-yellow-400 to-orange-400"
              />
              <KpiCard
                label="Personas"
                value={loading ? "…" : peopleDay}
                icon={<Users className="w-6 h-6" />}
                gradient="bg-gradient-to-br from-blue-400 to-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {isToday
                    ? "Próximas reservas de hoy"
                    : `Reservas del ${formatDateLabel(selectedDate)}`}
                </h2>
                {loading ? (
                  <p className="text-gray-500">Cargando...</p>
                ) : upcoming.length === 0 ? (
                  <p className="text-gray-500">
                    {isToday
                      ? "No hay reservas programadas para hoy."
                      : "No hay reservas programadas para esta fecha."}
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {upcoming.map((s) => (
                      <div
                        key={s._id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-semibold">
                            {s.timeStart.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {s.client || "Sin nombre"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {s.timeStart} · {s.peopleQty} personas
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            s.status === "confirmed" || s.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {s.status === "paid"
                            ? "Pagada"
                            : s.status === "confirmed"
                              ? "Confirmada"
                              : "Pendiente"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
                <img
                  className="w-40 h-40 object-contain"
                  src="/images/wichiwi-logo.jpg"
                  alt="Wichi Wi Cafe Kids"
                />
                <p className="mt-4 text-center text-gray-600 text-sm">
                  Wichi Wi Cafe Kids
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
