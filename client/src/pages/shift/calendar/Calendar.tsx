import React, { useState, useRef } from "react";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { IShift } from "../../../interfaces/shift";
import { IUnitBusiness } from "../../../interfaces/unitBusiness";
import { Toaster } from "react-hot-toast";

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
      return "#FBBF24	";
  }
};

// Calcular slots de tiempo
const TIME_SLOTS = Array.from(
  { length: 4 },
  (_, i) => `${String(i + 16).padStart(2, "0")}:00`
);

export default function Calendar({
  shifts,
  onAddShift,
  onEditShift,
  selectedDate,
  onDateChange,
  onUpdateShift,
  selectedUN,
  setSelectedUN,
  unitBusiness,
  deleteShift,
}: CalendarProps) {
  const startDate = startOfWeek(selectedDate);
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

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startDate, i + 1);
    return format(date, "yyyy-MM-dd", { locale: es });
  });

  const getShiftsForDate = (date: string) => {
    const formatDate = date.concat("T00:00:00.000Z");
    const shiftsDateFilter = shifts.filter((s) => s.date == formatDate);
    return shiftsDateFilter;
  };

  const getShiftPosition = (startTime: string) => {
    const [hours, minutes = 0] = startTime.split(":").map(Number);

    return (hours - 16) * 60 + minutes;
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
      onUpdateShift(shift._id, shift.date, newStartTime, newEndTime);
    }

    dragRef.current = null;
    setDragPreview(null);
  };

  const handlePreviousWeek = () => {
    onDateChange(addDays(selectedDate, -7));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(selectedDate, 7));
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd", { locale: es })}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <select
            value={selectedUN?.code}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500r"
            onChange={(e) =>
              setSelectedUN(unitBusiness.find((u) => u.code === e.target.value))
            }
          >
            {unitBusiness.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Semana del{" "}
          {format(addDays(startDate, 1), "d MMMM, yyyy", { locale: es })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50">
          <div className="p-4 border-b border-r border-gray-200"></div>
          {weekDays.map((date) => (
            <div key={date} className="p-4 border-b border-r border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {format(parseISO(date), "EEE", { locale: es })}
              </h3>
              <p className="text-sm text-gray-500">
                {format(parseISO(date), "MMM d", { locale: es })}
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

          {weekDays.map((date) => (
            <div
              key={date}
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
                  onClick={() => onAddShift(date, time)}
                />
              ))}

              {/* Current time indicator */}
              {/* {format(new Date(), "yyyy-MM-dd") === date && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                  style={{
                    top: `${
                      new Date().getHours() * 60 + new Date().getMinutes()
                    }px`,
                  }}
                />
              )} */}

              {/* Shifts */}
              {getShiftsForDate(date).map((shift: IShift) => {
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
                      handleDragStart(e, shift._id, top, "move")
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
                            deleteShift(shift._id);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-white/90 text-xs">
                        <Clock className="w-3 h-3" />
                        {shift.timeStart} - {shift.timeEnd}
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
