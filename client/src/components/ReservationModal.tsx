import {
  X,
  Clock,
  Mail,
  Phone,
  Calendar,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
} from "lucide-react";
import { useState, FormEvent, useEffect, useMemo } from "react";
import {
  checkoutShift,
  getAvailableShifts,
} from "../services/shiftService";
import { IShift } from "../interfaces/shift";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getUnitBusiness } from "../services/unitBusinessService";
import { IUnitBusiness } from "../interfaces/unitBusiness";
import { getConfigs } from "../services/config";
import { IConfig } from "../interfaces/config";

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

const initialFormData = (unitBusiness = ""): IShift => ({
  timeStart: "",
  timeEnd: "",
  status: "toConfirm",
  client: "",
  unitBusiness,
  date: format(new Date(), "yyyy-MM-dd"),
  description: "",
  phoneNumber: "",
  email: "",
  peopleQty: 0,
  adultsQty: 1,
  childrenQty: 0,
});

const DRAFT_STORAGE_KEY = "reservationDraft";

interface ReservationDraft {
  formData: IShift;
  step: 1 | 2 | 3;
  shiftId?: string;
}

export default function ReservationModal({
  isOpen,
  onClose,
  setConfirmOpen,
  confirmShift,
}: ReservationModalProps) {
  const [formData, setFormData] = useState<IShift>(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft: ReservationDraft = JSON.parse(raw);
        if (draft?.formData) return draft.formData;
      }
    } catch {
      /* ignore */
    }
    return initialFormData();
  });
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft: ReservationDraft = JSON.parse(raw);
        if (draft?.step) return draft.step;
      }
    } catch {
      /* ignore */
    }
    return 1;
  });
  const [pendingShiftId, setPendingShiftId] = useState<string | undefined>(
    () => {
      try {
        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const draft: ReservationDraft = JSON.parse(raw);
          return draft?.shiftId;
        }
      } catch {
        /* ignore */
      }
      return undefined;
    },
  );
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [unitBusinessCode, setUnitBusinessCode] = useState<string>("");
  const [priceChild, setPriceChild] = useState<number>(0);
  const [slotTakenWarning, setSlotTakenWarning] = useState<string>("");
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    const loadUB = async () => {
      try {
        const ubs = (await getUnitBusiness(true)) as IUnitBusiness[];
        const code = ubs?.[0]?.code || "";
        setUnitBusinessCode(code);
        setFormData((prev) => ({
          ...prev,
          unitBusiness: prev.unitBusiness || code,
        }));
      } catch (e) {
        console.error("Error loading unit business:", e);
      }
    };
    const loadPrices = async () => {
      try {
        const configs = (await getConfigs()) as IConfig[];
        const c = Number(
          configs?.find((c) => c.code === "priceChild")?.value || 0,
        );
        setPriceChild(c);
      } catch (e) {
        console.error("Error loading prices:", e);
      }
    };
    loadUB();
    loadPrices();
  }, []);

  // Persistir el borrador para sobrevivir un redirect a Mercado Pago.
  useEffect(() => {
    try {
      const draft: ReservationDraft = {
        formData,
        step,
        shiftId: pendingShiftId,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore quota errors */
    }
  }, [formData, step, pendingShiftId]);

  // Solo los niños pagan la reserva; los adultos no abonan.
  const totalPrice = useMemo(
    () => (formData.childrenQty || 0) * priceChild,
    [formData.childrenQty, priceChild],
  );

  const peopleQty = useMemo(
    () => (formData.adultsQty || 0) + (formData.childrenQty || 0),
    [formData.adultsQty, formData.childrenQty],
  );

  useEffect(() => {
    if (!isOpen) return;
    const fetchAvailables = async () => {
      try {
        setLoadingSlots(true);
        const reservations = await getAvailableShifts(formData.date);
        setAvailableSlots(Array.isArray(reservations) ? reservations : []);
        setFormData((prev) => ({ ...prev, timeStart: "" }));
      } catch (error) {
        console.error("Error fetching reservas disponibles:", error);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchAvailables();
  }, [formData.date, isOpen]);

  if (!isOpen) return null;

  const selectedSlot = availableSlots.find(
    (a) => a.initialTime === formData.timeStart,
  );

  const invalidOcupations =
    peopleQty > 0 &&
    !!formData.timeStart &&
    peopleQty > (selectedSlot?.availables || 0);

  const canGoStep2 = peopleQty > 0 && !!formData.date;
  const canGoStep3 = !!formData.timeStart && !invalidOcupations;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, peopleQty, price: totalPrice };
      const resul = await checkoutShift(payload);
      if (resul.ack !== 0) {
        notifyError(
          resul.message ||
            "No se pudo realizar la reserva, por favor contactar mediante WhatsApp",
        );
        return;
      }

      // Guardar el shiftId en el borrador antes de redirigir a MP.
      if (resul.shiftId) {
        setPendingShiftId(resul.shiftId);
        try {
          const draft: ReservationDraft = {
            formData,
            step,
            shiftId: resul.shiftId,
          };
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        } catch {
          /* ignore */
        }
      }

      // Si requiere pago y MP devolvió link, redirigir
      if (resul.requiresPayment && resul.paymentLink) {
        window.location.href = resul.paymentLink;
        return;
      }

      // Si no requiere pago (precio 0) o falló MP pero la reserva quedó creada
      if (resul.requiresPayment && !resul.paymentLink) {
        notifyError(
          resul.message ||
            "Reserva creada pero no se pudo generar el link de pago. Te contactaremos.",
        );
      }
      confirmShift(payload);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setPendingShiftId(undefined);
      setFormData(initialFormData(unitBusinessCode));
      setStep(1);
      onClose();
      setConfirmOpen(true);
    } catch (error) {
      console.log(error);
      notifyError("Error procesando la reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    setPendingShiftId(undefined);
    setFormData(initialFormData(unitBusinessCode));
    setStep(1);
    setSlotTakenWarning("");
    onClose();
  };

  // Revalida disponibilidad antes de pasar al paso 3 (pago).
  const goToStep3 = async () => {
    if (!canGoStep3) return;
    setRevalidating(true);
    setSlotTakenWarning("");
    try {
      const fresh = await getAvailableShifts(formData.date);
      const list: TimeSlot[] = Array.isArray(fresh) ? fresh : [];
      setAvailableSlots(list);
      const current = list.find((s) => s.initialTime === formData.timeStart);
      if (!current) {
        setSlotTakenWarning(
          "El horario que elegiste ya no está disponible. Elegí otro.",
        );
        setFormData((prev) => ({ ...prev, timeStart: "" }));
        return;
      }
      if (current.availables < peopleQty) {
        setSlotTakenWarning(
          `Mientras completabas se ocuparon lugares. Quedan ${current.availables} en ese horario.`,
        );
        return;
      }
      setStep(3);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo verificar la disponibilidad. Intentá de nuevo.");
    } finally {
      setRevalidating(false);
    }
  };

  const Stepper = () => (
    <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-gray-100">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step === s
                ? "bg-pink-400 text-white shadow-md"
                : step > s
                  ? "bg-blue-400 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {s}
          </div>
          {s < 3 && (
            <div
              className={`w-8 h-0.5 ${step > s ? "bg-blue-400" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-300 to-blue-300 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Reservar Mesa</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="hover:bg-pink-400 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <Stepper />

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
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
                    min={format(new Date(), "yyyy-MM-dd")}
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adultos *
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
                      value={formData.adultsQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          adultsQty: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niños
                  </label>
                  <div className="relative">
                    <Users
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={formData.childrenQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          childrenQty: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 text-center">
                Total de personas:{" "}
                <span className="font-bold">{peopleQty}</span>
              </div>

              {totalPrice > 0 && (
                <div className="bg-gradient-to-r from-pink-50 to-blue-50 border border-pink-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Total a pagar</p>
                  <p className="text-2xl font-bold text-pink-600">
                    ${totalPrice.toFixed(2)}
                  </p>
                  {priceChild > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Niño ${priceChild.toFixed(2)} · Adultos sin cargo
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Selecciona un Horario *
              </label>
              {loadingSlots ? (
                <div className="text-center py-8 text-gray-500">
                  Cargando disponibilidad...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay horarios disponibles para esta fecha.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {availableSlots.map((sl) => {
                    const selected = formData.timeStart === sl.initialTime;
                    const insufficient =
                      peopleQty > 0 && sl.availables < peopleQty;
                    return (
                      <button
                        key={sl.initialTime}
                        type="button"
                        disabled={insufficient}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            timeStart: sl.initialTime,
                          });
                          setSlotTakenWarning("");
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          selected
                            ? "border-pink-400 bg-pink-50 text-pink-700 shadow-md"
                            : insufficient
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-gray-200 hover:border-pink-300 hover:bg-white text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Clock size={16} />
                          <span>{sl.initialTime}</span>
                          <span
                            className={`text-xs ${
                              insufficient
                                ? "text-red-500"
                                : "text-green-600"
                            }`}
                          >
                            {sl.availables} lugares
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {invalidOcupations && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                  <AlertCircle
                    size={18}
                    className="text-orange-600 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-orange-700 text-sm">
                    Solo hay {selectedSlot?.availables} lugares en ese horario.
                  </p>
                </div>
              )}

              {slotTakenWarning && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle
                    size={18}
                    className="text-red-600 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-red-700 text-sm">{slotTakenWarning}</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
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
                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
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
                    pattern="[0-9+\s-]{6,}"
                    value={formData.phoneNumber}
                    placeholder="2614789647"
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  />
                </div>
              </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  placeholder="Alergias, preferencias, ocasiones especiales..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Fecha:</strong> {formData.date}
                </p>
                <p>
                  <strong>Horario:</strong> {formData.timeStart}
                </p>
                <p>
                  <strong>Personas:</strong> {peopleQty} ({formData.adultsQty}{" "}
                  adultos, {formData.childrenQty} niños)
                </p>
                {totalPrice > 0 && (
                  <div className="pt-2 mt-2 border-t border-blue-200">
                    {priceChild > 0 && (formData.childrenQty || 0) > 0 && (
                      <p className="text-xs text-gray-600">
                        {formData.childrenQty} × ${priceChild.toFixed(2)} ={" "}
                        $
                        {((formData.childrenQty || 0) * priceChild).toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      Adultos sin cargo
                    </p>
                    <p className="font-bold text-base text-pink-600 mt-1">
                      Total: ${totalPrice.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 flex items-start gap-2">
                <Info
                  size={18}
                  className="text-amber-600 mt-0.5 flex-shrink-0"
                />
                <div className="space-y-1">
                  {totalPrice > 0 ? (
                    <p>
                      <strong>El pago confirma la reserva.</strong> Hasta que
                      Mercado Pago acredite el cobro, el horario no queda
                      garantizado.
                    </p>
                  ) : (
                    <p>
                      <strong>Tu reserva queda pendiente de confirmación</strong>{" "}
                      hasta que la validemos.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {step > 1 && (
              <button
                type="button"
                disabled={loading || revalidating}
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                disabled={
                  revalidating ||
                  (step === 1 && !canGoStep2) ||
                  (step === 2 && !canGoStep3)
                }
                onClick={() => {
                  if (step === 2) {
                    goToStep3();
                  } else {
                    setStep((s) => (s + 1) as 1 | 2 | 3);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white py-3 rounded-lg font-bold hover:from-pink-300 hover:to-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {revalidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                disabled={loading || invalidOcupations}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white py-3 rounded-lg font-bold hover:from-pink-300 hover:to-blue-300 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : totalPrice > 0 ? (
                  `Pagar $${totalPrice.toFixed(2)} con Mercado Pago`
                ) : (
                  "Confirmar Reserva"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
