import { useState } from "react";
import { Settings, Building2 } from "lucide-react";
import { CompanyProfile } from "./companyProfile";
import { CompanySettings } from "./companySettings";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";

type View = "profile" | "settings";

function CompanyConfig() {
  const [currentView, setCurrentView] = useState<View>("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tabs = [
    { id: "profile" as View, name: "Perfil", icon: Building2 },
    { id: "settings" as View, name: "Configuración", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main></main>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex gap-1 p-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setCurrentView(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                          currentView === tab.id
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {currentView === "profile" && <CompanyProfile />}

                {currentView === "settings" && <CompanySettings />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyConfig;
