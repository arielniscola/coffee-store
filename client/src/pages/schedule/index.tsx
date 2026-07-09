import { useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import { CompanySettings } from "../company/companySettings";

/**
 * Página dedicada a la configuración de horarios: duración del turno, franjas
 * horarias semanales, texto/subtítulo de horarios y días máximos de
 * anticipación. Reutiliza CompanySettings scopeado a la categoría "schedule".
 */
function ScheduleConfig() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <CompanySettings
              categories={["schedule"]}
              title="Horarios"
              subtitle="Duración del turno, franjas horarias y textos de horarios"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleConfig;
