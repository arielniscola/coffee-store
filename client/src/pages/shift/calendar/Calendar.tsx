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
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [totalCapacity, setTotalCapacity] = useState<number>(0);
  useEffect(() => {
    loadSettings();
    calculateCapacity();
  }, [selectedDate, tables]);

  const normalizeTime = (time: string) => {
    const [h, m] = time.split(":");
    return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`;
  };

  const reservesSchedule = () => {
    let schedule: { time: string; shifts: IShift[] }[] = [];
    timeSlots.map((t) => schedule.push({ time: t, shifts: [] }));
    for (const reser of shifts) {
      const normalizedTime = normalizeTime(reser.timeStart);
      const i = schedule.findIndex((s) => s.time == normalizedTime);

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
    // Usar locale inglés para que coincida con la configuración (scheduleDayMonday, etc.)
    let day = moment(selectedDate).locale("en").format("dddd");
    day = day.charAt(0).toUpperCase() + day.slice(1);

    const configCode = `scheduleDay${day}`;
    const timeSchedule = data.find((conf) => conf.code == configCode)
      ?.value as string;

    if (!timeSchedule) {
      setTimeSlots([]);
      return;
    }

    const durationShiftValue = data.find((conf) => conf.code == "durationShift")?.value;
    const durationShift = Number(durationShiftValue);

    if (!durationShift) {
      setTimeSlots([]);
      return;
    }

    const slots: string[] = [];
    const scheduleRanges = timeSchedule.trim().split(",");

    for (const range of scheduleRanges) {
      const parts = range.trim().split("-");
      if (parts.length < 2) {
        console.warn(`Formato de horario incorrecto: ${range}`);
        continue;
      }

      const [startTime, endTime] = parts;
      const startParts = startTime.split(":");
      const endParts = endTime.split(":");

      if (startParts.length < 2 || endParts.length < 2) {
        console.warn(`Formato de hora incorrecto: ${range}`);
        continue;
      }

      const [startH, startM] = startParts.map(Number);
      const [endH, endM] = endParts.map(Number);

      let currentMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      while (currentMinutes < endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        currentMinutes += durationShift;
      }
    }

    setTimeSlots(slots);
  };
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
                                  <Users className="w-3 h-3" />
                                  {reserva.adultsQty ?? reserva.peopleQty ?? 0} adulto{(reserva.adultsQty ?? reserva.peopleQty ?? 0) !== 1 ? 's' : ''}
                                  {(reserva.childrenQty ?? 0) > 0 && `, ${reserva.childrenQty} niño${reserva.childrenQty !== 1 ? 's' : ''}`}
                                </div>
                                {reserva.description && (
                                  <div className="flex items-center gap-1 text-white/90 text-xs">
                                    <span className="font-semibold">
                                      {reserva.description}
                                    </span>
                                  </div>
                                )}
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
