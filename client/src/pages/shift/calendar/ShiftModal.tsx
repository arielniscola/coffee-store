import React, { useEffect, useState } from "react";
import { AlertCircle, Clock, X } from "lucide-react";
import type { IShift } from "../../../interfaces/shift";
import { getAvailableShifts } from "../../../services/shiftService";
import { format } from "date-fns";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Partial<IShift>) => void;
  initialShift?: IShift;
  date: Date;
  time: string;
  selectedUnitBusiness: string | undefined;
  loading: boolean;
}

interface TimeSlot {
  availables: number;
  initialTime: string;
}

export default function ShiftModal({
  isOpen,
  onClose,
  onSave,
  initialShift,
  date,
  time,
  selectedUnitBusiness,
  loading,
}: ShiftModalProps) {
  const [formData, setFormData] = useState({
    _id: initialShift?._id || "",
    client: initialShift?.client || "",
    timeStart: initialShift?.timeStart || time,
    timeEnd: initialShift?.timeEnd || time,
    status: initialShift?.status || "toConfirm",
    unitBusiness: initialShift?.unitBusiness || selectedUnitBusiness,
    date: initialShift?.date.split("T")[0] || format(date, "yyyy-MM-dd"),
    description: initialShift?.description || "",
    phoneNumber: initialShift?.phoneNumber || "",
    email: initialShift?.email || "",
    peopleQty: initialShift?.peopleQty || 0,
  });
  const [errorDate, setErrorDate] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  useEffect(() => {
    setFormData({
      _id: initialShift?._id || "",
      client: initialShift?.client || "",
      unitBusiness: initialShift?.unitBusiness || selectedUnitBusiness,
      status: initialShift?.status || "toConfirm",
      timeStart: initialShift?.timeStart || time,
      timeEnd: initialShift?.timeEnd || "",
      date: initialShift?.date.split("T")[0] || format(date, "yyyy-MM-dd"),
      description: initialShift?.description || "",
      phoneNumber: initialShift?.phoneNumber || "",
      email: initialShift?.email || "",
      peopleQty: initialShift?.peopleQty || 0,
    });
  }, [isOpen]);

  useEffect(() => {
    const fetchAvailables = async () => {
      try {
        let dateSet = "";
        typeof formData.date == "string"
          ? (dateSet = formData.date)
          : format(formData.date, "yyyy-MM-ddd");
        const reservations = await getAvailableShifts(dateSet);
        setAvailableSlots(reservations);
      } catch (error) {
        console.error("Error fetching reservas disponiles:", error);
      }
    };
    fetchAvailables();
  }, [formData.date]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormData({ ...formData, timeEnd: "" });
    onSave(formData);
    onClose();
  };

  const handleDate = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate >= today) {
      setFormData({ ...formData, date: date });
      setErrorDate(false);
    } else {
      setErrorDate(true);
    }
  };

  const SlotGroup = ({ slots }: { title: string; slots: TimeSlot[] }) => (
    <div>
      {slots.length != 0 ? (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Selecciona un Horario *
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
            {slots.map((sl) => {
              const estaSeleccionado = formData.timeStart === sl.initialTime;

              return (
                <button
                  key={sl.initialTime}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, timeStart: sl.initialTime })
                  }
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    estaSeleccionado
                      ? "border-amber-500 bg-amber-50 text-amber-700 shadow-md"
                      : "border-gray-200 hover:border-amber-300 hover:bg-white text-gray-700"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Clock size={16} />
                    <span>{sl.initialTime}</span>
                    <span className={`text-xs ${"text-green-600"}`}>
                      {sl.availables} lugares
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-md text-center">No hay reservas disponibles</div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-800 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reservar Mesa</h2>
          <button
            onClick={onClose}
            className="hover:bg-pink-400 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                value={formData.client}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phoneNumber: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Personas *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={formData.peopleQty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    peopleQty: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Reserva *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horario Inicio Reserva
              </label>
              <input
                type="text"
                disabled
                value={formData.timeStart}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="toConfirm">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
                <option value="paid">Pagada</option>
              </select>
            </div>
          </div>
          <SlotGroup title="Cena" slots={availableSlots} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Alergias, preferencias, ocasiones especiales..."
            />
          </div>
          {formData.peopleQty > 0 &&
            formData.timeStart &&
            formData.peopleQty >
              (availableSlots.find((a) => a.initialTime == formData.timeStart)
                ?.availables || 0) && (
              <div>
                {/* Indicador de Disponibilidad */}
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                  <AlertCircle
                    size={18}
                    className="text-orange-600 mt-0.5 flex-shrink-0"
                  />
                  <div className="text-sm">
                    <div className="mt-1">
                      <span
                        className={`font-bold text-lg ${"text-orange-600"}`}
                      >
                        {availableSlots.find(
                          (a) => a.initialTime == formData.timeStart
                        )
                          ? availableSlots.find(
                              (a) => a.initialTime == formData.timeStart
                            )?.availables
                          : 0}{" "}
                        lugares disponibles
                      </span>
                    </div>

                    <p className="text-orange-700 mt-1 text-xs">
                      ⚠️ Ha seleccionado un horario donde no hay disponibilidad
                      para la cantidad de personas requeridas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          {errorDate && (
            <div>
              {/* Error de fecha */}
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle
                  size={18}
                  className="text-orange-600 mt-0.5 flex-shrink-0"
                />
                <div className="text-sm">
                  <div className="mt-1"></div>
                  <p className="text-orange-700 mt-1 text-xs">
                    ⚠️ Ha seleccionado una fecha que no corresponde.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {loading ? "Guardando..." : "Confirmar Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
