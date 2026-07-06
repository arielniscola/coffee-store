import { Clock, Phone, AlertCircle, Check } from "lucide-react";
import { IScheduleException } from "../interfaces/scheduleException";
import { formatDateRange } from "../utils/dates";

interface informationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setFormOpen: (val: boolean) => void;
  priceChild?: number;
  /** Precios por niño de los talleres próximos (uno por taller). */
  workshopPrices?: number[];
  /** Horario semanal ya agrupado ("Martes a Viernes" -> "17:00 - 21:00"). */
  scheduleGroups?: { label: string; hours: string }[];
  /** Aperturas con horarios especiales (excepciones "open"). */
  specialDates?: IScheduleException[];
}

const formatPrice = (n: number) =>
  n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

export default function InformationModal({
  isOpen,
  onClose,
  setFormOpen,
  priceChild = 0,
  workshopPrices = [],
  scheduleGroups = [],
  specialDates = [],
}: informationModalProps) {
  if (!isOpen) return null;

  // Los días cerrados no se listan (ya se ven bloqueados en el calendario);
  // acá solo mostramos las aperturas con horarios especiales.
  const specialPreview = specialDates.slice(0, 4);
  const hasSpecialDates = specialPreview.length > 0;

  // Los talleres pueden tener distinto precio: mostramos el valor único o un
  // rango. Si no hay talleres próximos, no se menciona el precio de taller.
  const distinctWorkshopPrices = Array.from(new Set(workshopPrices)).sort(
    (a, b) => a - b,
  );
  const workshopPriceLabel =
    distinctWorkshopPrices.length === 0
      ? null
      : distinctWorkshopPrices.length === 1
        ? `Día de talleres $${formatPrice(distinctWorkshopPrices[0])}`
        : `Días de taller $${formatPrice(distinctWorkshopPrices[0])} a $${formatPrice(
            distinctWorkshopPrices[distinctWorkshopPrices.length - 1],
          )}`;

  const openForm = () => {
    onClose();
    setFormOpen(true);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-pink-300 to-blue-300 text-white p-6 mb-6 rounded-t-2xl flex items-center justify-between">
          <div className="w-16 h-16 bg-white-100 rounded-full flex items-center justify-center mx-auto m-4">
            <AlertCircle size={32} className="text-white-200" />
          </div>
          <h4 className="text-center text-3xl font-bold text-white-600 m-2">
            Información importante para reservar
          </h4>
          <p className="text-gray-600"></p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Clock size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Horarios de Atención
              </h3>
              {scheduleGroups.length > 0 ? (
                <ul className="text-sm text-blue-800 space-y-1">
                  {scheduleGroups.map((g, i) => (
                    <li key={`${g.label}-${i}`}>
                      • {g.label}: {g.hours}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-blue-800">
                  Consultá nuestros horarios de atención antes de reservar.
                </p>
              )}
            </div>
          </div>

          {hasSpecialDates && (
            <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-lg">
              <Clock
                size={20}
                className="text-pink-600 mt-0.5 flex-shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-semibold text-pink-900 mb-1">
                  Fechas especiales
                </h3>
                {specialPreview.length > 0 && (
                  <div className="text-sm text-pink-800 mt-1">
                    <span className="font-medium">
                      Aperturas con horarios especiales:
                    </span>
                    <ul className="mt-0.5 space-y-0.5">
                      {specialPreview.map((e) => (
                        <li key={e._id}>
                          • {formatDateRange(e.dateFrom, e.dateTo)}:{" "}
                          {e.timeStart} - {e.timeEnd} hs
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <AlertCircle
              size={20}
              className="text-purple-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">
                Políticas de Reserva e Información
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>
                  • Wichi Wi es una cafetería con juegos para niños de 0 a 6
                  años (juegos de roles y un gran pelotero).
                </li>
                <li>
                  • Para el disfrute del espacio de manera cómoda y segura,
                  trabajamos con turnos, los cuales tienen una duración de 2
                  horas (ingresos y salidas puntuales).
                </li>
                <li>
                  • Cada niño abona un monto de ${formatPrice(priceChild)}
                  {workshopPriceLabel ? ` (${workshopPriceLabel})` : ""}. Esta
                  entrada incluye las siguientes consumiciones:
                  <ul>
                    <li>
                      {" "}
                      - Jugo pura fruta, chocolatada, leche, agua o yogurt con o
                      sin azúcar + tortita, muffin, budín, panqueque de banana
                      sin azúcar o cereales con o sin azúcar. Tortita{" "}
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
            <Phone size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Confirmación
              </h3>
              <p className="text-sm text-orange-800">
                Para la confirmación deberas enviar comprobante de reserva por
                whatsapp
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={openForm}
            className="flex-1 px-6 py-3 sticky top-0 bg-gradient-to-r from-pink-300 to-blue-300 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Continuar
            <Check size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
