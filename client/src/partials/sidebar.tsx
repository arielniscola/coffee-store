import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import React from "react";
import SidebarLinkGroup from "./SiderbarLinkGroup";
import {
  ChartNoAxesCombined,
  CreditCard,
  NotebookPen,
  Settings,
  Home,
  Wallet,
  Store,
  Coffee,
  Building2,
  CalendarOff,
  Palette,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
}) => {
  const location = useLocation();
  const { pathname } = location;
  const { user, logout } = useAuth();
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true",
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    const elementBody = document.querySelector("body");
    if (sidebarExpanded) {
      if (elementBody) elementBody.classList.add("sidebar-expanded");
    } else {
      if (elementBody) elementBody.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  // Helpers de estilo para mantener consistencia
  const isActive = (key: string) => pathname.includes(key);

  const linkClasses = (active: boolean) =>
    `flex items-center px-3 py-2 rounded-md mb-0.5 transition-colors ${
      active
        ? "bg-slate-900 text-white"
        : "text-slate-200 hover:bg-slate-700/40 hover:text-white"
    }`;

  const iconClasses = (active: boolean) =>
    `shrink-0 w-5 h-5 ${active ? "text-indigo-300" : "text-slate-400"}`;

  const labelClasses =
    "text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 truncate";

  const subLinkClasses = (active: boolean) =>
    `flex items-center transition-colors py-1 ${
      active ? "text-indigo-300" : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-slate-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:!w-64 shrink-0 bg-slate-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Close button */}
          <button
            ref={trigger}
            className="lg:hidden text-slate-500 hover:text-slate-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <NavLink end to="/dashboard" className="block" title="Inicio">
            <img
              className="w-8 h-8 rounded-full"
              src={`/images/wichiwi-logo.jpg`}
              width="32"
              height="32"
              alt="Wichi Wi"
            />
          </NavLink>
        </div>

        {/* Links */}
        <div className="space-y-8">
          <div>
            <h3 className="text-xs uppercase text-slate-500 font-semibold pl-3">
              <span
                className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6"
                aria-hidden="true"
              >
                •••
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                Menu
              </span>
            </h3>
            <ul className="mt-3">
              {/* Principal */}
              <li title="Principal">
                <NavLink
                  end
                  to="/dashboard"
                  className={linkClasses(isActive("dashboard"))}
                >
                  <Home className={iconClasses(isActive("dashboard"))} />
                  <span className={labelClasses}>Principal</span>
                </NavLink>
              </li>

              {/* Turnos */}
              <li title="Turnos">
                <NavLink
                  end
                  to="/shift"
                  className={linkClasses(isActive("shift"))}
                >
                  <NotebookPen className={iconClasses(isActive("shift"))} />
                  <span className={labelClasses}>Turnos</span>
                </NavLink>
              </li>

              {/* Pagos MP */}
              <li title="Pagos">
                <NavLink
                  end
                  to="/payments/mercadopago"
                  className={linkClasses(isActive("payments"))}
                >
                  <CreditCard className={iconClasses(isActive("payments"))} />
                  <span className={labelClasses}>Pagos</span>
                </NavLink>
              </li>

              {/* Configuración */}
              <SidebarLinkGroup activecondition={isActive("settings")}>
                {(handleClick, open) => {
                  const active = isActive("settings");
                  return (
                    <React.Fragment>
                      <a
                        href="#0"
                        title="Configuración"
                        className={linkClasses(active)}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <Settings className={iconClasses(active)} />
                          <span className={labelClasses}>Configuración</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 ml-1 text-slate-400 transition-transform ${
                            open ? "rotate-180" : ""
                          } lg:hidden lg:sidebar-expanded:block 2xl:block`}
                        />
                      </a>
                      <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                        <ul className={`pl-9 mt-1 mb-2 ${!open && "hidden"}`}>
                          <li>
                            <NavLink
                              end
                              to="/settings/payment-methods"
                              className={({ isActive: a }) =>
                                subLinkClasses(a)
                              }
                            >
                              <Wallet className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-medium ml-2 truncate">
                                Medios de pago
                              </span>
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              end
                              to="/settings/unit-business"
                              className={({ isActive: a }) =>
                                subLinkClasses(a)
                              }
                            >
                              <Store className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-medium ml-2 truncate">
                                Unidad de Negocio
                              </span>
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              end
                              to="/settings/tables"
                              className={({ isActive: a }) =>
                                subLinkClasses(a)
                              }
                            >
                              <Coffee className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-medium ml-2 truncate">
                                Mesas
                              </span>
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              end
                              to="/settings/companies"
                              className={({ isActive: a }) =>
                                subLinkClasses(a)
                              }
                            >
                              <Building2 className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-medium ml-2 truncate">
                                Empresa
                              </span>
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              end
                              to="/settings/closed-dates"
                              className={({ isActive: a }) =>
                                subLinkClasses(a)
                              }
                            >
                              <CalendarOff className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-medium ml-2 truncate">
                                Días cerrados
                              </span>
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              end
                              to="/settings/workshops"
                              className={({ isActive: a }) =>
                                subLinkClasses(a)
                              }
                            >
                              <Palette className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-medium ml-2 truncate">
                                Talleres
                              </span>
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>

              {/* Estadisticas */}
              <SidebarLinkGroup activecondition={isActive("statistics")}>
                {(handleClick, open) => {
                  const active = isActive("statistics");
                  return (
                    <React.Fragment>
                      <a
                        href="#0"
                        title="Estadísticas"
                        className={linkClasses(active)}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <ChartNoAxesCombined
                            className={iconClasses(active)}
                          />
                          <span className={labelClasses}>Estadísticas</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 ml-1 text-slate-400 transition-transform ${
                            open ? "rotate-180" : ""
                          } lg:hidden lg:sidebar-expanded:block 2xl:block`}
                        />
                      </a>
                      <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                        <ul className={`pl-9 mt-1 ${!open && "hidden"}`}>
                          <li>
                            <NavLink
                              end
                              to="/statistics"
                              className={({ isActive: a }) =>
                                subLinkClasses(a)
                              }
                            >
                              <NotebookPen className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-medium ml-2 truncate">
                                Turnos
                              </span>
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
            </ul>
          </div>
        </div>

        {/* Footer: usuario + logout */}
        <div className="mt-auto pt-4 border-t border-slate-700/60">
          <div
            className="flex items-center px-2 py-2"
            title={
              user
                ? `${user.username}${user.companyCode ? ` · ${user.companyCode}` : ""}`
                : "Usuario"
            }
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center text-white shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="ml-3 min-w-0 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
              <p className="text-sm font-medium text-slate-100 truncate">
                {user?.username || "Usuario"}
              </p>
              {user?.companyCode && (
                <p className="text-xs text-slate-400 truncate">
                  {user.companyCode}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="w-full mt-2 flex items-center px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700/40 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0 text-slate-400" />
            <span className={labelClasses}>Cerrar sesión</span>
          </button>

          {/* Expand / collapse button */}
          <div className="pt-3 hidden lg:flex 2xl:hidden justify-end">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? "Colapsar" : "Expandir"}
            >
              <span className="sr-only">Expand / collapse sidebar</span>
              <svg
                className="w-6 h-6 fill-current sidebar-expanded:rotate-180"
                viewBox="0 0 24 24"
              >
                <path
                  className="text-slate-400"
                  d="M19.586 11l-5-5L16 4.586 23.414 12 16 19.414 14.586 18l5-5H7v-2z"
                />
                <path className="text-slate-600" d="M3 23H1V1h2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
