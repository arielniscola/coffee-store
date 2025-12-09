import { X, Clock } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { ITable } from "../interfaces/tables";
import { getPTables } from "../services/tables";
import { createShift, getAvailableShifts } from "../services/shiftService";
import { IShift } from "../interfaces/shift";
import toast, { Toaster } from "react-hot-toast";

const notifyError = (msg: string) => toast.error(msg);

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot {
  table: number;
  initialTime: string;
}

const UNITBUSINESS = "LOC1";

export default function ReservationModal({
  isOpen,
  onClose,
}: ReservationModalProps) {
  const [formData, setFormData] = useState<IShift>({
    timeStart: "",
    timeEnd: "",
    status: "toConfirm",
    client: "",
    unitBusiness: UNITBUSINESS,
    date: "",
    description: "",
    tableNumber: 1,
    phoneNumber: "",
    email: "",
  });
  const [tables, setTables] = useState<ITable[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tablesData = (await getPTables()) as ITable[];
        setTables(tablesData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    const fetchAvailables = async () => {
      try {
        const reservations = await getAvailableShifts(formData.date);
        setAvailableSlots(reservations);
      } catch (error) {
        console.error("Error fetching reservas disponiles:", error);
      }
    };
    fetchTables();
    fetchAvailables();
  }, [formData.date]);

  if (!isOpen) return null;

  const handleSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setFormData({ ...formData, timeStart: slot.initialTime });
  };

  const handleSubmit = async (e: FormEvent) => {
    setLoading(true);

    e.preventDefault();
    try {
      const resul = await createShift(formData);
      if (!resul.ack) {
        setSubmitted(true);
        setFormData({
          timeStart: "",
          timeEnd: "",
          status: "toConfirm",
          client: "",
          unitBusiness: UNITBUSINESS,
          date: "",
          description: "",
          tableNumber: 1,
          phoneNumber: "",
          email: "",
        });
      } else {
        notifyError(
          "No se pudo realizar la reserva, por favor contactar mediante whatsapp"
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
              onClick={() => handleSlot(slot)}
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

        {submitted || loading ? (
          <div className="p-8 text-center">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Reserva Solicitada!
            </h3>
            <p className="text-gray-600">Te esperamos en WichiWi Cafe Kids</p>
            <p>Te contactaremos para confirmar la reserva. Muchas Gracias!</p>
          </div>
        ) : (
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
                    setFormData({ ...formData, client: e.target.value })
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
                    setFormData({ ...formData, email: e.target.value })
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
                    setFormData({ ...formData, phoneNumber: e.target.value })
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
                  value={formData.date}
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
        )}
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
