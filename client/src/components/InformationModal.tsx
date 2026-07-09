import { Clock, Phone, AlertCircle, Check } from "lucide-react";
import { parseScheduleText } from "../utils/scheduleText";

interface informationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setFormOpen: (val: boolean) => void;
  priceChild?: number;
  /** Precios por niño de los talleres próximos (uno por taller). */
  workshopPrices?: number[];
  /** Horario semanal ya agrupado ("Martes a Viernes" -> "17:00 - 21:00"). */
  scheduleGroups?: { label: string; hours: string }[];
  /** Texto libre de horarios; si está presente reemplaza a scheduleGroups. */
  scheduleText?: string;
  /** Subtítulo opcional sobre los horarios (ej. "Horario especial de Invierno"). */
  scheduleSubtitle?: string;
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
  scheduleText = "",
  scheduleSubtitle = "",
}: informationModalProps) {
  if (!isOpen) return null;

  // Si hay texto libre de horarios, se parsea a { label, hours }; si no, se
  // usan los grupos del horario configurado.
  const scheduleDisplay = scheduleText
    ? parseScheduleText(scheduleText)
    : scheduleGroups;

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
              {scheduleSubtitle && (
                <p className="text-sm font-semibold text-blue-700 mb-1">
                  {scheduleSubtitle}
                </p>
              )}
              {scheduleDisplay.length > 0 ? (
                <ul className="text-sm text-blue-800 space-y-1">
                  {scheduleDisplay.map((g, i) => (
                    <li key={`${g.label}-${i}`}>
                      • {g.label}
                      {g.hours ? `: ${g.hours}` : ""}
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
                      - Jugo Pura Fruta, Chocolatada, Agua, Leche o Yogurt +
                      Tortita, Muffin, Budín, Cereales con o sin azúcar,
                      Panqueque de banana sin azúcar.
                    </li>
                  </ul>
                </li>
                <li>
                  • Se recomienda ingresar y pedir a la carta lo que consuman
                  para evitar retrasos.
                </li>
                <li>• No se permite entrar con comida, bebida o el mate.</li>
                <li>
                  • Le pedimos a los mayores el uso responsable de los juguetes.
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
