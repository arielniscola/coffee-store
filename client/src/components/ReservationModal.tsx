import {
  X,
  Clock,
  Mail,
  Phone,
  Calendar,
  Users,
  AlertCircle,
} from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { createShift, getAvailableShifts } from "../services/shiftService";
import { IShift } from "../interfaces/shift";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";

const notifyError = (msg: string) => toast.error(msg);

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setConfirmOpen: (val: boolean) => void;
  confirmShift: (val: IShift | undefined) => void;
}

interface TimeSlot {
  availables: number;
  initialTime: string;
}

const UNITBUSINESS = "LOC1";

export default function ReservationModal({
  isOpen,
  onClose,
  setConfirmOpen,
  confirmShift,
}: ReservationModalProps) {
  const [formData, setFormData] = useState<IShift>({
    timeStart: "",
    timeEnd: "",
    status: "toConfirm",
    client: "",
    unitBusiness: UNITBUSINESS,
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    phoneNumber: "",
    email: "",
    peopleQty: 0,
  });

  const [loading, setLoading] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

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

  const invalidOcupations = () => {
    const isInvalid =
      formData.peopleQty > 0 &&
      formData.timeStart &&
      formData.peopleQty >
        (availableSlots.find((a) => a.initialTime == formData.timeStart)
          ?.availables || 0);
    return typeof isInvalid === "string" ? false : isInvalid;
  };

  const handleSubmit = async (e: FormEvent) => {
    setLoading(true);
    e.preventDefault();
    try {
      const resul = await createShift(formData);
      if (!resul.ack) {
        confirmShift(formData);
        setFormData({
          timeStart: "",
          timeEnd: "",
          status: "toConfirm",
          client: "",
          unitBusiness: UNITBUSINESS,
          date: format(new Date(), "yyyy-MM-dd"),
          description: "",
          phoneNumber: "",
          email: "",
          peopleQty: 0,
        });
        onClose();
        setConfirmOpen(true);
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
                placeholder="Ej: Juan Pérez"
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
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  placeholder="correo@ejemplo.com"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10  px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  placeholder="2614789647"
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Personas *
              </label>
              <div className="relative">
                <Users
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
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
                  className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Reserva *
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
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
                  className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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

          {invalidOcupations() && (
            <div>
              {/* Indicador de Disponibilidad */}
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle
                  size={18}
                  className="text-orange-600 mt-0.5 flex-shrink-0"
                />
                <div className="text-sm">
                  <div className="mt-1">
                    <span className={`font-bold text-lg ${"text-orange-600"}`}>
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
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || invalidOcupations()}
              className="w-full bg-gradient-to-r from-pink-400 to-blue-400 text-white py-4 rounded-lg font-bold text-lg hover:from-pink-300 hover:to-blue-300 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {loading ? "Guardando..." : "Confirmar Reserva"}
            </button>
          </div>
        </form>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
