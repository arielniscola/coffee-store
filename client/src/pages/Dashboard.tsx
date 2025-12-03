import { useState } from "react";
import { Sidebar } from "../partials/sidebar";
import Header from "../partials/headers";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-1/2 max-w-9xl mx-auto">
            <img
              className="w-100 h-100 block mx-auto"
              src={`/images/wichiwi-logo.jpg`}
              alt="Logo"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
