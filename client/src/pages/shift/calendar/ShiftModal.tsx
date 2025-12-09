import React, { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import type { IShift } from "../../../interfaces/shift";
import { getPTables } from "../../../services/tables";
import { getAvailableShifts } from "../../../services/shiftService";
import { ITable } from "../../../interfaces/tables";
import { format } from "date-fns";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Partial<IShift>) => void;
  initialShift?: IShift;
  date: string;
  time: string;
  selectedUnitBusiness: string | undefined;
  loading: boolean;
}

interface FormErrors {
  client?: string;
  timeEnd?: string;
}

const addDurationshift = (time: string) => {
  const [hours, minutes = 0] = time.split(":").map(Number);
  let endTime = hours + 2;
  return `${String(endTime).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

interface TimeSlot {
  table: number;
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
    date: initialShift?.date || date,
    description: initialShift?.description || "",
    phoneNumber: initialShift?.phoneNumber || "",
    email: initialShift?.email || "",
    tableNumber: initialShift?.tableNumber || 1,
  });

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>();
  const [tables, setTables] = useState<ITable[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    setFormData({
      _id: initialShift?._id || "",
      client: initialShift?.client || "",
      unitBusiness: initialShift?.unitBusiness || selectedUnitBusiness,
      status: initialShift?.status || "toConfirm",
      timeStart: initialShift?.timeStart || time,
      timeEnd: initialShift?.timeEnd || addDurationshift(time),
      date: initialShift?.date || date,
      description: initialShift?.description || "",
      phoneNumber: initialShift?.phoneNumber || "",
      email: initialShift?.email || "",
      tableNumber: initialShift?.tableNumber || 1,
    });
  }, [isOpen]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tablesData = (await getPTables()) as ITable[];
        setTables(tablesData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    const fetchAvailables = async () => {
      try {
        const reservations = await getAvailableShifts(formData.date);
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
    const validationErrors: FormErrors = {
      client: validateField(
        "client",
        typeof formData.client == "string"
          ? formData.client
          : formData.client || ""
      ),
      timeEnd: validateField("timeEnd", formData.timeEnd),
    };
    // Check if there are any errors
    if (!Object.values(validationErrors).some((error) => error)) {
      setFormData({ ...formData, timeEnd: "" });
      onSave(formData);
      onClose();
    }
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "client":
        if (!value.trim()) return "Cliente es requerido";
        return undefined;
      case "timeEnd":
        if (!value) return "Hora de finalización es requerida";
        if (value < formData.timeStart) return "Hora de finalización inválida";
        return undefined;
      default:
        return undefined;
    }
  };

  const SlotGroup = ({ slots }: { title: string; slots: TimeSlot[] }) => (
    <div>
      {formData.tableNumber ? (
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Horarios Disponibles
        </h3>
      ) : (
        <div></div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots
          .filter((s) => s.table == formData.tableNumber)
          .map((slot) => (
            <div
              key={slot.initialTime}
              onClick={() => setSelectedSlot(slot)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSlot == slot
                  ? "bg-green-50 border-blue-300 text-blue-800"
                  : "bg-gray-50 border-green-300 text-green-500"
              } hover:shadow-md`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{slot.initialTime}</span>
              </div>
              <div className="text-xs text-center mt-1">Disponible</div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-300 to-blue-300 text-white p-6 rounded-t-2xl flex items-center justify-between">
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
                value={formData.tableNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tableNumber: parseInt(e.target.value),
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
                value={format(formData.date, "yyyy-MM-dd")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesa *
              </label>
              <select
                required
                value={formData.tableNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tableNumber: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar mesa</option>
                {tables.map((table) => (
                  <option key={table._id} value={table.number}>
                    Mesa #{table.number} (Capacidad: {table.capacity})
                  </option>
                ))}
              </select>
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
                <option value="confirmed">Confirmada</option>
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

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-blue-400 text-white py-4 rounded-lg font-bold text-lg hover:from-pink-300 hover:to-blue-300 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {loading ? "Guardando..." : "Confirmar Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
