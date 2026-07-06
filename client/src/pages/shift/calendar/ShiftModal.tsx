import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Mail,
  Phone,
  User,
  Users,
  X,
} from "lucide-react";
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
  availablesAdults: number;
  availablesChildren: number;
  initialTime: string;
}

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "toConfirm", label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmed", label: "Confirmada", color: "bg-blue-100 text-blue-700" },
  { value: "paid", label: "Pagada", color: "bg-green-100 text-green-700" },
  { value: "completed", label: "Completada", color: "bg-gray-100 text-gray-700" },
  { value: "cancelled", label: "Cancelada", color: "bg-red-100 text-red-700" },
];

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
  const buildInitial = () => ({
    _id: initialShift?._id || "",
    client: initialShift?.client || "",
    timeStart: initialShift?.timeStart || time,
    timeEnd: initialShift?.timeEnd || "",
    status: initialShift?.status || "toConfirm",
    unitBusiness: initialShift?.unitBusiness || selectedUnitBusiness,
    date:
      initialShift?.date?.split("T")[0] || format(date, "yyyy-MM-dd"),
    description: initialShift?.description || "",
    phoneNumber: initialShift?.phoneNumber || "",
    email: initialShift?.email || "",
    peopleQty: initialShift?.peopleQty || 0,
    adultsQty: initialShift?.adultsQty || 1,
    childrenQty: initialShift?.childrenQty || 0,
    price: initialShift?.price || 0,
  });

  const [formData, setFormData] = useState(buildInitial);
  const [errorDate, setErrorDate] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const peopleQty = useMemo(
    () => (formData.adultsQty || 0) + (formData.childrenQty || 0),
    [formData.adultsQty, formData.childrenQty],
  );

  useEffect(() => {
    if (isOpen) setFormData(buildInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAvailables = async () => {
      try {
        setLoadingSlots(true);
        const dateSet =
          typeof formData.date === "string"
            ? formData.date
            : format(formData.date, "yyyy-MM-dd");
        const reservations = await getAvailableShifts(dateSet);
        setAvailableSlots(Array.isArray(reservations) ? reservations : []);
      } catch (error) {
        console.error("Error fetching reservas disponibles:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchAvailables();
  }, [formData.date, isOpen]);

  if (!isOpen) return null;

  const adultsQty = formData.adultsQty || 0;
  const childrenQty = formData.childrenQty || 0;

  // Lo que esta misma reserva ya ocupa en un horario. El backend ya lo descontó
  // del disponible, así que al editar hay que sumarlo de vuelta para conocer el
  // cupo real editable.
  const ownForSlot = (sl: TimeSlot) => {
    const sameSlot =
      !!initialShift?._id &&
      (initialShift?.date?.split("T")[0] || "") === formData.date &&
      initialShift?.timeStart === sl.initialTime;
    return {
      adults: sameSlot ? initialShift?.adultsQty || 0 : 0,
      children: sameSlot ? initialShift?.childrenQty || 0 : 0,
    };
  };

  // Cupo real de un horario = disponible del backend + lo propio (al editar).
  const slotRoom = (sl: TimeSlot) => {
    const own = ownForSlot(sl);
    return {
      adults: (sl.availablesAdults ?? 0) + own.adults,
      children: (sl.availablesChildren ?? 0) + own.children,
    };
  };

  // Un horario no alcanza si no quedan lugares de adultos o de niños suficientes.
  const slotInsufficient = (s: TimeSlot) => {
    const room = slotRoom(s);
    return adultsQty > room.adults || childrenQty > room.children;
  };

  const selectedSlot = availableSlots.find(
    (a) => a.initialTime === formData.timeStart,
  );
  const insufficient =
    !!formData.timeStart && !!selectedSlot && slotInsufficient(selectedSlot);

  // Máximos de los inputs según el cupo del horario elegido. Si no hay horario
  // seleccionado todavía, no se aplica tope (los horarios sin cupo se bloquean).
  const room = selectedSlot ? slotRoom(selectedSlot) : undefined;
  const maxAdults = room?.adults;
  const maxChildren = room?.children;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, peopleQty });
    onClose();
  };

  const handleDate = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    if (inputDate >= today) {
      setFormData({ ...formData, date, timeStart: "" });
      setErrorDate(false);
    } else {
      setErrorDate(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-300 to-blue-300 text-white p-5 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold">
              {formData._id ? "Editar reserva" : "Nueva reserva"}
            </h2>
            <p className="text-sm text-white/80">
              {format(new Date(formData.date + "T00:00:00"), "dd/MM/yyyy")}
              {formData.timeStart && ` · ${formData.timeStart}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Datos del cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del cliente *
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    required
                    value={formData.client}
                    placeholder="Ej: Juan Pérez"
                    onChange={(e) =>
                      setFormData({ ...formData, client: e.target.value })
                    }
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    placeholder="correo@ejemplo.com"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    placeholder="2614789647"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Personas
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adultos *
                </label>
                <div className="relative">
                  <Users
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="1"
                    max={maxAdults}
                    required
                    value={formData.adultsQty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adultsQty: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niños
                </label>
                <div className="relative">
                  <Users
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="0"
                    max={maxChildren}
                    value={formData.childrenQty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        childrenQty: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-lg font-bold text-gray-700">
                  {peopleQty}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Fecha y horario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <div className="relative">
                  <CalendarIcon
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => handleDate(e.target.value)}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario seleccionado
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  {formData.timeStart || (
                    <span className="text-gray-400">— sin horario —</span>
                  )}
                </div>
              </div>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selecciona un horario
            </label>
            {loadingSlots ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                Cargando disponibilidad...
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                No hay horarios disponibles para esta fecha.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                {availableSlots.map((sl) => {
                  const selected = formData.timeStart === sl.initialTime;
                  const noRoom = slotInsufficient(sl);
                  return (
                    <button
                      key={sl.initialTime}
                      type="button"
                      disabled={noRoom && !selected}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          timeStart: sl.initialTime,
                        })
                      }
                      className={`p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                        selected
                          ? "border-pink-400 bg-pink-50 text-pink-700 shadow-md"
                          : noRoom
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-gray-200 hover:border-pink-300 hover:bg-white text-gray-700"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold">{sl.initialTime}</span>
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          Disponibilidad
                        </span>
                        <span
                          className={`text-xs leading-tight text-center ${
                            noRoom ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          {sl.availablesAdults} adultos
                          <br />
                          {sl.availablesChildren} niños
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio total
                </label>
                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>
              {peopleQty > 0 && (formData.price || 0) > 0 && (
                <div className="flex items-end">
                  <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full">
                    Por persona:{" "}
                    <span className="font-semibold text-gray-700">
                      ${((formData.price || 0) / peopleQty).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
              placeholder="Alergias, preferencias, ocasiones especiales..."
            />
          </div>

          {insufficient && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                size={18}
                className="text-orange-600 mt-0.5 flex-shrink-0"
              />
              <div className="text-sm">
                <p className="font-bold text-orange-700">
                  Quedan {room?.adults ?? 0} adultos y {room?.children ?? 0}{" "}
                  niños
                </p>
                <p className="text-orange-700 text-xs mt-1">
                  El horario seleccionado no tiene cupo para la cantidad de
                  personas indicada.
                </p>
              </div>
            </div>
          )}

          {errorDate && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                size={18}
                className="text-orange-600 mt-0.5 flex-shrink-0"
              />
              <p className="text-orange-700 text-xs">
                ⚠️ La fecha seleccionada no es válida.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || insufficient || errorDate}
              className="flex-1 bg-gradient-to-r from-pink-400 to-blue-400 text-white py-3 rounded-lg font-bold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Guardando..."
                : formData._id
                  ? "Guardar cambios"
                  : "Crear reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
