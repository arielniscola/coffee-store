import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  DollarSign,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import type { IShift } from "../../../interfaces/shift";
import { IUnitBusiness } from "../../../interfaces/unitBusiness";
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

const STATUS_META: Record<
  string,
  { label: string; bg: string; ring: string; dot: string }
> = {
  toConfirm: {
    label: "Pendiente",
    bg: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
    ring: "ring-yellow-300",
    dot: "bg-yellow-500",
  },
  confirmed: {
    label: "Confirmada",
    bg: "bg-blue-100 hover:bg-blue-200 border-blue-300",
    ring: "ring-blue-300",
    dot: "bg-blue-500",
  },
  paid: {
    label: "Pagada",
    bg: "bg-green-100 hover:bg-green-200 border-green-300",
    ring: "ring-green-300",
    dot: "bg-green-500",
  },
  completed: {
    label: "Completada",
    bg: "bg-gray-100 hover:bg-gray-200 border-gray-300",
    ring: "ring-gray-300",
    dot: "bg-gray-500",
  },
  cancelled: {
    label: "Cancelada",
    bg: "bg-red-50 hover:bg-red-100 border-red-200 line-through opacity-70",
    ring: "ring-red-300",
    dot: "bg-red-500",
  },
};

export default function Calendar({
  shifts,
  onAddShift,
  onEditShift,
  deleteShift,
  selectedDate,
  tables,
}: CalendarProps) {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, tables]);

  const totalCapacity = useMemo(
    () => tables.reduce((acc, t) => acc + (t.capacity || 0), 0),
    [tables],
  );

  const normalizeTime = (time: string) => {
    const [h, m] = time.split(":");
    return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`;
  };

  const reservesSchedule = useMemo(() => {
    const schedule: { time: string; shifts: IShift[] }[] = timeSlots.map(
      (t) => ({ time: t, shifts: [] }),
    );
    for (const reser of shifts) {
      const normalizedTime = normalizeTime(reser.timeStart);
      const i = schedule.findIndex((s) => s.time === normalizedTime);
      if (i >= 0) schedule[i].shifts.push(reser);
    }
    return schedule;
  }, [shifts, timeSlots]);

  const dayTotals = useMemo(() => {
    const active = shifts.filter((s) => s.status !== "cancelled");
    const people = active.reduce((a, s) => a + (s.peopleQty || 0), 0);
    const revenue = active.reduce((a, s) => a + (s.price || 0), 0);
    return {
      total: shifts.length,
      active: active.length,
      people,
      revenue,
    };
  }, [shifts]);

  async function loadSettings() {
    try {
      const data = (await getConfigs()) as IConfig[];
      getTimeSlots(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  const calcOcupacion = (reservas: IShift[]) => {
    const active = reservas.filter((r) => r.status !== "cancelled");
    const people = active.reduce((acc, r) => acc + (r.peopleQty || 0), 0);
    return {
      ocupados: people,
      disponibles: Math.max(0, totalCapacity - people),
      porcentaje: totalCapacity ? (people / totalCapacity) * 100 : 0,
    };
  };

  const getOcupacionColor = (porcentaje: number) => {
    if (porcentaje >= 90) return "bg-red-500";
    if (porcentaje >= 70) return "bg-orange-500";
    if (porcentaje >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTimeSlots = (data: IConfig[]) => {
    let day = moment(selectedDate).locale("en").format("dddd");
    day = day.charAt(0).toUpperCase() + day.slice(1);

    const configCode = `scheduleDay${day}`;
    const timeSchedule = data.find((conf) => conf.code === configCode)
      ?.value as string;

    if (!timeSchedule) {
      setTimeSlots([]);
      return;
    }

    const durationShiftValue = data.find(
      (conf) => conf.code === "durationShift",
    )?.value;
    const durationShift = Number(durationShiftValue);

    if (!durationShift) {
      setTimeSlots([]);
      return;
    }

    const slots: string[] = [];
    const scheduleRanges = timeSchedule.trim().split(",");

    for (const range of scheduleRanges) {
      const parts = range.trim().split("-");
      if (parts.length < 2) continue;

      const [startTime, endTime] = parts;
      const startParts = startTime.split(":");
      const endParts = endTime.split(":");
      if (startParts.length < 2 || endParts.length < 2) continue;

      const [startH, startM] = startParts.map(Number);
      const [endH, endM] = endParts.map(Number);

      let currentMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      while (currentMinutes < endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        );
        currentMinutes += durationShift;
      }
    }

    setTimeSlots(slots);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Reservas</p>
          <p className="text-2xl font-bold text-gray-800">{dayTotals.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Activas</p>
          <p className="text-2xl font-bold text-gray-800">
            {dayTotals.active}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Personas</p>
          <p className="text-2xl font-bold text-gray-800">
            {dayTotals.people}{" "}
            <span className="text-sm font-normal text-gray-400">
              / {totalCapacity}
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Ingresos del día</p>
          <p className="text-2xl font-bold text-gray-800">
            ${dayTotals.revenue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddShift(format(selectedDate, "yyyy-MM-dd"), "");
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Agregar reserva
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {timeSlots.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p>No hay horarios configurados para este día.</p>
            <p className="text-xs mt-1">
              Configurá los horarios en Empresa → Configuración.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reservesSchedule.map((slot) => {
              const ocupacion = calcOcupacion(slot.shifts);
              const isEmpty = slot.shifts.length === 0;
              return (
                <div
                  key={slot.time}
                  className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-2 md:col-span-1 flex items-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        Hora
                      </span>
                      <span className="text-base font-bold text-gray-800">
                        {slot.time}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-10 md:col-span-8 min-w-0">
                    {isEmpty ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddShift(
                            format(selectedDate, "yyyy-MM-dd"),
                            slot.time,
                          );
                        }}
                        className="w-full text-left text-sm text-gray-400 hover:text-pink-500 hover:bg-pink-50/50 italic px-3 py-2 rounded-lg border border-dashed border-gray-200 hover:border-pink-300 transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar reserva en {slot.time}
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {slot.shifts.map((reserva) => {
                          const meta =
                            STATUS_META[reserva.status] ||
                            STATUS_META.completed;
                          const adults =
                            reserva.adultsQty ?? reserva.peopleQty ?? 0;
                          const children = reserva.childrenQty ?? 0;
                          return (
                            <div
                              key={reserva._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditShift(reserva);
                              }}
                              className={`relative cursor-pointer rounded-lg border p-3 shadow-sm transition-all ${meta.bg}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`}
                                  />
                                  <span className="text-sm font-semibold text-gray-800 truncate">
                                    {reserva.client || "Sin nombre"}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteShift(reserva._id || "");
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="space-y-0.5 text-xs text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  {reserva.timeStart} - {reserva.timeEnd}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  {adults} adulto{adults !== 1 ? "s" : ""}
                                  {children > 0 &&
                                    `, ${children} niño${
                                      children !== 1 ? "s" : ""
                                    }`}
                                </div>
                                {reserva.phoneNumber && (
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    {reserva.phoneNumber}
                                  </div>
                                )}
                                {(reserva.price || 0) > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-3 h-3 text-gray-400" />
                                    <span className="font-semibold text-gray-700">
                                      ${reserva.price?.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                {reserva.description && (
                                  <div
                                    className="text-gray-500 italic truncate pt-0.5"
                                    title={reserva.description}
                                  >
                                    “{reserva.description}”
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-3 flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">
                          {ocupacion.ocupados}/{totalCapacity}
                        </span>
                        <span className="text-gray-400">
                          {Math.round(ocupacion.porcentaje)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${getOcupacionColor(
                            ocupacion.porcentaje,
                          )} transition-all duration-300`}
                          style={{
                            width: `${Math.min(100, ocupacion.porcentaje)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
