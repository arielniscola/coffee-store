import React, { useState, useRef, useEffect } from "react";
import { Clock, Phone, Trash2 } from "lucide-react";
import type { IShift } from "../../../interfaces/shift";
import { IUnitBusiness } from "../../../interfaces/unitBusiness";
import { Toaster } from "react-hot-toast";
import { ITable } from "../../../interfaces/tables";
import { IConfig } from "../../../interfaces/config";
import { getConfigs } from "../../../services/config";

interface CalendarProps {
  shifts: IShift[];
  onAddShift: (date: string, time: string) => void;
  onEditShift: (shift: IShift) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedUN: IUnitBusiness | undefined;
  setSelectedUN: (unit: IUnitBusiness | undefined) => void;
  unitBusiness: IUnitBusiness[];
  onUpdateShift: (
    shiftId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => void;
  deleteShift: (id: string) => void;
  tables: ITable[];
}

const getColorStatus = (status: string) => {
  switch (status) {
    case "paid":
      return "#10B981	";
    case "confirmed":
      return "#3B82F6	";
    case "debt":
      return "#EF4444";
    case "cancelled":
      return "#EF4444";
    default:
      return "#FDE047";
  }
};

export default function Calendar({
  shifts,
  onAddShift,
  onEditShift,
  onUpdateShift,
  deleteShift,
  tables,
}: CalendarProps) {
  const [slotCount, setSlotCount] = useState<number>(0);
  const [initialTimeSlot, setInitialTimeSlot] = useState<number>(12);
  const dragRef = useRef<{
    shiftId: string;
    startY: number;
    originalTop: number;
    startX: number;
    type: "move" | "resize";
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    top: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = (await getConfigs()) as IConfig[];
      getTimeSlots(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  const getShiftsForTable = (table: number) => {
    const shiftsTableFilter = shifts.filter((s) => s.tableNumber === table);
    return shiftsTableFilter;
  };

  const getShiftPosition = (startTime: string) => {
    const [hours, minutes = 0] = startTime.split(":").map(Number);

    return (hours - initialTimeSlot) * 60 + minutes;
  };

  const getShiftHeight = (startTime: string, endTime: string) => {
    const start = getShiftPosition(startTime);
    const end = getShiftPosition(endTime);
    return end - start;
  };

  const getTimeFromPosition = (position: number) => {
    const hours = Math.floor(position / 60) + 16;
    const minutes = position % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const handleDragStart = (
    e: React.MouseEvent,
    shiftId: string,
    currentTop: number,
    type: "move" | "resize"
  ) => {
    e.stopPropagation();
    const container = (e.target as HTMLElement).closest(
      ".shift-container"
    ) as HTMLElement;
    if (!container) return;

    dragRef.current = {
      shiftId,
      startY: e.clientY,
      originalTop: currentTop,
      startX: e.clientX,
      type,
    };

    setDragPreview({
      top: currentTop,
      height: parseInt(container.style.height),
    });
  };

  const handleDragMove = (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragRef.current || !dragPreview) return;

    const deltaY = e.clientY - dragRef.current.startY;
    const gridSize = 30; // Snap to 15-minute intervals
    const snappedDeltaY = Math.round(deltaY / gridSize) * gridSize;

    if (dragRef.current.type === "move") {
      setDragPreview({
        ...dragPreview,
        top: Math.max(0, dragRef.current.originalTop + snappedDeltaY),
      });
    } else {
      setDragPreview({
        ...dragPreview,
        height: Math.max(gridSize, dragPreview.height + snappedDeltaY),
      });
    }
  };

  const handleDragEnd = () => {
    if (!dragRef.current || !dragPreview) return;

    const shift = shifts.find((s) => s._id === dragRef.current?.shiftId);

    if (shift) {
      const newStartTime = getTimeFromPosition(dragPreview.top);
      const newEndTime = getTimeFromPosition(
        dragPreview.top + dragPreview.height
      );
      onUpdateShift(shift._id || "", shift.date, newStartTime, newEndTime);
    }

    dragRef.current = null;
    setDragPreview(null);
  };

  const getTimeSlots = (data: IConfig[]) => {
    const initialTime = data.find((conf) => conf.code == "timeStartDay")
      ?.value as string;
    const iniValue = initialTime.split(":");
    const endTime = data.find((conf) => conf.code == "timeEndDay")
      ?.value as string;
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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50">
          <div className="p-4 border-b border-r border-gray-200"></div>
          {tables.map((tab) => (
            <div
              key={tab.number}
              className="p-4 border-b border-r border-gray-200"
            >
              <h3 className="font-semibold text-gray-900">
                Mesa N°{tab.number}
              </h3>
              <p className="text-sm text-gray-500">
                Capacidad: {tab.capacity} personas
              </p>
            </div>
          ))}
        </div>

        <div className="relative grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto">
          <div className="border-r border-gray-200">
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="h-[60px] border-b border-gray-100 text-xs text-gray-500 text-right pr-2 pt-1"
              >
                {time}
              </div>
            ))}
          </div>

          {tables.map((tab) => (
            <div
              key={tab.number}
              className="border-r border-b border-gray-200 relative"
              onDragOver={(e) => {
                e.preventDefault();
                handleDragMove(e);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDragEnd();
              }}
            >
              {/* Time grid lines */}
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="h-[60px] border-b border-gray-100"
                  onClick={() => onAddShift(new Date().toISOString(), time)}
                />
              ))}

              {/* Shifts */}
              {getShiftsForTable(tab.number).map((shift: IShift) => {
                const top = getShiftPosition(shift.timeStart);
                const height = getShiftHeight(shift.timeStart, shift.timeEnd);
                const isBeingDragged = dragRef.current?.shiftId === shift._id;
                return (
                  <div
                    key={shift._id}
                    className={`shift-container absolute left-1 right-1 rounded-lg shadow-sm cursor-move transition-shadow hover:shadow-md overflow-hidden ${
                      isBeingDragged ? "opacity-50" : ""
                    }`}
                    style={{
                      top: `${
                        isBeingDragged && dragPreview ? dragPreview.top : top
                      }px`,
                      height: `${
                        isBeingDragged && dragPreview
                          ? dragPreview.height
                          : height
                      }px`,
                      backgroundColor: getColorStatus(shift.status),
                    }}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, shift._id || "", top, "move")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditShift(shift);
                    }}
                  >
                    <div className="p-2 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="text-white text-sm font-medium truncate">
                          {shift.client}
                        </div>
                        <Trash2
                          className="w-4 h-4 text-white/70 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteShift(shift._id || "");
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-white/90 text-xs">
                        <Clock className="w-3 h-3" />
                        {shift.timeStart} - {shift.timeEnd}
                      </div>
                      <div className="flex items-center gap-1 text-white/90 text-xs">
                        <Phone className="w-3 h-3" />
                        {shift.phoneNumber}
                      </div>
                      <div className="flex items-center gap-1 text-white/90 text-xs">
                        <span className="font-semibold">
                          {shift.description || ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}
