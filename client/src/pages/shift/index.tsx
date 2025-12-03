import { useState } from "react";
import Header from "../../partials/headers";
import { Sidebar } from "../../partials/sidebar";
import { Calendar, List } from "lucide-react";
import CalendarMenu from "./calendar/CalendarMenu";
import { ListView } from "./list/list";

export const ShiftView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="mb-4 ml-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mt-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestion Turnos
                </h1>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "calendar"
                        ? "bg-white shadow text-indigo-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "bg-white shadow text-indigo-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mt-1">
                Gestione sus turnos por canchas
              </p>
            </div>
          </div>
          {viewMode === "calendar" ? <CalendarMenu /> : <ListView />}
        </main>
      </div>
    </div>
  );
};
