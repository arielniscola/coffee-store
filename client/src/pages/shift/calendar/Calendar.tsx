import { useState, useEffect } from "react";
import { Clock, Phone, Trash2, Users } from "lucide-react";
import type { IShift } from "../../../interfaces/shift";
import { IUnitBusiness } from "../../../interfaces/unitBusiness";
import { Toaster } from "react-hot-toast";
import { ITable } from "../../../interfaces/tables";
import { IConfig } from "../../../interfaces/config";
import { getConfigs } from "../../../services/config";
import moment from "moment";
import { format } from "date-fns";

interface CalendarProps {
  shifts: IShift[];
  onAddShift: (date: string, time: string) => void;
  onEditShift: (shift: IShift) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedUN: IUnitBusiness | undefined;
  setSelectedUN: (unit: IUnitBusiness | undefined) => void;
  unitBusiness: IUnitBusiness[];
  deleteShift: (id: string) => void;
  tables: ITable[];
}

export default function Calendar({
  shifts,
  onAddShift,
  onEditShift,
  deleteShift,
  selectedDate,
  tables,
}: CalendarProps) {
  const [slotCount, setSlotCount] = useState<number>(0);
  const [initialTimeSlot, setInitialTimeSlot] = useState<number>(12);
  const [totalCapacity, setTotalCapacity] = useState<number>(0);
  useEffect(() => {
    loadSettings();
    calculateCapacity();
  }, [selectedDate, tables]);

  const reservesSchedule = () => {
    let schedule: { time: string; shifts: IShift[] }[] = [];
    TIME_SLOTS.map((t) => schedule.push({ time: t, shifts: [] }));
    for (const reser of shifts) {
      const i = schedule.findIndex((s) => s.time == reser.timeStart);

      if (i >= 0) schedule[i].shifts.push(reser);
    }
    return schedule;
  };

  async function loadSettings() {
    try {
      const data = (await getConfigs()) as IConfig[];
      getTimeSlots(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  const calculateCapacity = () => {
    let total = 0;
    tables.map((t) => (total += t.capacity));
    setTotalCapacity(total);
  };

  const calcularOcupacion = (reservas: IShift[]) => {
    const reserv = reservas.filter((r) => r.status != "cancelled");
    const total = reserv.reduce(
      (sum: number, r: IShift) => sum + r.peopleQty,
      0
    );
    return {
      ocupados: total,
      disponibles: totalCapacity - total,
      porcentaje: (total / totalCapacity) * 100,
    };
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "toConfirm":
        return "bg-yellow-200 text-white-800";
      case "confirmed":
        return "bg-blue-500 text-white-800";
      case "cancelled":
        return "bg-red-300 text-white-800";
      case "completed":
        return "bg-green-300 text-white-800";
      case "paid":
        return "bg-green-500 text-white-800";
    }
  };

  const getOcupacionColor = (porcentaje: number) => {
    if (porcentaje >= 90) return "bg-red-500";
    if (porcentaje >= 70) return "bg-orange-500";
    if (porcentaje >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTimeSlots = (data: IConfig[]) => {
    let day = moment(selectedDate).format("dddd");
    day = day.charAt(0).toUpperCase() + day.slice(1);

    const timeSchedule = data.find((conf) => conf.code == `scheduleDay${day}`)
      ?.value as string;
    /** Validamos cuantos horarios contiene */
    const scheduleSlot = timeSchedule.trim().split(",");

    const initialTime = scheduleSlot[0].split("-")[0];
    const iniValue = initialTime.split(":");
    const endTime =
      scheduleSlot.length == 2
        ? scheduleSlot[1].split("-")[1]
        : scheduleSlot[0].split("-")[1];
    const endValue = endTime.split(":");
    const durationShift = data.find((conf) => conf.code == "durationShift")
      ?.value as number;
    let initialTimeMinutes = parseInt(iniValue[0]) * 60 + parseInt(iniValue[1]);
    let endTimeMinutes = parseInt(endValue[0]) * 60 + parseInt(endValue[1]);
    let totalSlots = (endTimeMinutes - initialTimeMinutes) / durationShift;
    setInitialTimeSlot(parseInt(iniValue[0]));
    setSlotCount(totalSlots * (durationShift / 60));
  };
  // Calcular slots de tiempo
  const TIME_SLOTS = Array.from(
    { length: slotCount },
    (_, i) => `${String(i + initialTimeSlot).padStart(2, "0")}:00`
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddShift(format(selectedDate, "yyyy-MM-dd"), "");
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          Agregar Reserva
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-32">
                    <div className="flex items-center gap-2">
                      <Clock size={18} />
                      Horario
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Reservas
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-64">
                    <div className="flex items-center justify-center gap-2">
                      <Users size={18} />
                      Ocupación
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservesSchedule().map((slot) => {
                  const ocupacion = calcularOcupacion(slot.shifts);
                  return (
                    <tr
                      key={slot.time}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {slot.time}
                      </td>
                      <td className="px-4 py-2">
                        {slot.shifts.length === 0 ? (
                          <div className="text-sm text-gray-400 italic">
                            Sin reservas
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {slot.shifts.map((reserva) => (
                              <div
                                key={reserva._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditShift(reserva);
                                }}
                                className={`relative px-4 py-3 rounded-lg text-sm ${getEstadoColor(
                                  reserva.status
                                )} min-w-64 shadow-sm`}
                              >
                                {/* Botón eliminar */}
                                <div className="flex items-center justify-between">
                                  <div className="text-white text-sm font-medium truncate">
                                    {reserva.client}
                                  </div>
                                  <Trash2
                                    className="w-4 h-4 text-white/70 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteShift(reserva._id || "");
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-1 text-white/90 text-xs">
                                  <Clock className="w-3 h-3" />
                                  {reserva.timeStart} - {reserva.timeEnd}
                                </div>
                                <div className="flex items-center gap-1 text-white/90 text-xs">
                                  <Phone className="w-3 h-3" />
                                  {reserva.phoneNumber}
                                </div>
                                <div className="flex items-center gap-1 text-white/90 text-xs">
                                  <span className="font-semibold">
                                    {reserva.description || ""}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {ocupacion.ocupados} / {totalCapacity}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full ${getOcupacionColor(
                                ocupacion.porcentaje
                              )} transition-all duration-300`}
                              style={{ width: `${ocupacion.porcentaje}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            {ocupacion.disponibles} disponibles
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}
