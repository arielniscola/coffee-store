import { Users } from "lucide-react";
import { useState } from "react";

interface Table {
  id: number;
  x: number;
  y: number;
  capacity: number;
  available: boolean;
}

const tables: Table[] = [
  { id: 1, x: 15, y: 15, capacity: 2, available: true },
  { id: 2, x: 40, y: 15, capacity: 2, available: false },
  { id: 3, x: 65, y: 15, capacity: 4, available: true },
  { id: 4, x: 15, y: 50, capacity: 4, available: true },
  { id: 5, x: 40, y: 50, capacity: 6, available: true },
  { id: 6, x: 65, y: 50, capacity: 2, available: false },
  { id: 7, x: 15, y: 80, capacity: 4, available: true },
  { id: 8, x: 40, y: 80, capacity: 2, available: true },
  { id: 9, x: 65, y: 80, capacity: 4, available: true },
];

export default function FloorPlan() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  return (
    <div className="bg-gradient-to-b from-pink-100 to-blue-100 p-8 rounded-2xl shadow-lg">
      <div className="mb-8 flex items-center justify-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-500 rounded-lg shadow-md"></div>
          <span className="text-gray-700 font-medium">Disponible</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-400 rounded-lg shadow-md"></div>
          <span className="text-gray-700 font-medium">Ocupada</span>
        </div>
      </div>

      <div
        className="relative bg-white border-4 border-blue-300 rounded-xl overflow-hidden"
        style={{ width: "100%", paddingBottom: "66.67%" }}
      >
        <div className="absolute inset-0 p-4 flex flex-col">
          <div className="text-center text-sm font-semibold text-pink-400 mb-2">
            ENTRADA
          </div>
          <div className="flex-1 relative">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 65"
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0"
            >
              <defs>
                <pattern
                  id="floorPattern"
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="0.5" fill="#fce7f3" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="65" fill="url(#floorPattern)" />
            </svg>

            {tables.map((table) => (
              <div
                key={table.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all"
                style={{
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  zIndex: selectedTable === table.id ? 20 : 10,
                }}
                onClick={() =>
                  setSelectedTable(selectedTable === table.id ? null : table.id)
                }
              >
                <div
                  className={`rounded-lg shadow-lg border-2 border-white transition-all transform ${
                    selectedTable === table.id ? "scale-125" : "hover:scale-110"
                  } ${
                    table.available
                      ? "bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-300 hover:to-pink-400"
                      : "bg-gray-400"
                  }`}
                  style={{
                    width:
                      table.capacity === 2
                        ? "32px"
                        : table.capacity === 4
                        ? "40px"
                        : "48px",
                    height:
                      table.capacity === 2
                        ? "32px"
                        : table.capacity === 4
                        ? "40px"
                        : "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="text-white text-xs font-bold">{table.id}</div>
                </div>

                {selectedTable === table.id && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg whitespace-nowrap text-xs font-medium shadow-xl z-30">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>{table.capacity} personas</span>
                    </div>
                    <div className="text-pink-300 text-xs mt-1">
                      {table.available ? "Disponible" : "Ocupada"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm font-semibold text-blue-400 mt-2">
            VENTANAS / VISTA
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-400">
          <div className="text-2xl font-bold text-pink-400">
            {tables.filter((t) => t.available).length}
          </div>
          <div className="text-sm text-gray-600">Mesas Disponibles</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-400">
          <div className="text-2xl font-bold text-gray-400">
            {tables.filter((t) => !t.available).length}
          </div>
          <div className="text-sm text-gray-600">Mesas Ocupadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-400">
          <div className="text-2xl font-bold text-blue-400">
            {tables.length}
          </div>
          <div className="text-sm text-gray-600">Mesas Totales</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-300">
          <div className="text-2xl font-bold text-orange-400">
            {tables.reduce((acc, t) => acc + t.capacity, 0)}
          </div>
          <div className="text-sm text-gray-600">Capacidad Total</div>
        </div>
      </div>
    </div>
  );
}
