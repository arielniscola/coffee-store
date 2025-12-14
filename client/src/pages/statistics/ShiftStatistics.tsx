import { useEffect, useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";

import { Calendar, LucideProps } from "lucide-react";
import MonthYearPicker from "./yearMonthPicker";
import { getStatistics } from "../../services/shiftService";
import moment from "moment";

interface DataShift {
  title: string;
  value: any;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  color: string;
}

const ShiftStatistics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dataShift, setDataShift] = useState<DataShift[]>([]);
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await getStatistics(moment(selectedDate).format("MM/YYYY"));
        const formated = formData(res);
        setDataShift(formated);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };
    fetchdata();
  }, [selectedDate]);

  const formData = (data: any) => {
    const statsData = [
      {
        title: "Total Turnos reservados",
        value: data.total,
        icon: Calendar,
        color: "blue",
      },
      {
        title: "Turnos pendientes",
        value: data.toConfirm,
        icon: Calendar,
        color: "yellow",
      },
      {
        title: "Turnos confirmados",
        value: data.confirmed,
        icon: Calendar,
        color: "green",
      },
      {
        title: "Turnos pagados",
        value: data.confirmed,
        icon: Calendar,
        color: "green",
      },
      {
        title: "Turnos cancelados",
        value: data.cancelled,
        icon: Calendar,
        color: "red",
      },
      {
        title: "Cantidad de Ocupaciones",
        value: data.people,
        icon: Calendar,
        color: "purple",
      },
    ];

    return statsData;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="py-2 px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg mt-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Estadisticas de Turnos
              </h2>
              <p className="mt-2 text-gray-600">
                Estas son las estadísticas de los turnos por mes.
              </p>

              <MonthYearPicker
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dataShift.map((stat) => {
                return (
                  <div
                    key={stat.title}
                    className="relative group bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div
                      className={`bg-${stat.color}-50 rounded-lg p-4 border border-${stat.color}-100`}
                    >
                      <p
                        className={`text-sm text-${stat.color}-600 font-medium`}
                      >
                        {stat.title}
                      </p>
                      <p
                        className={`text-3xl font-bold text-${stat.color}-800 mt-2`}
                      >
                        {stat.value}
                      </p>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShiftStatistics;
