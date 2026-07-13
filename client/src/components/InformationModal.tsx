import { Clock, Phone, AlertCircle, Check } from "lucide-react";
import { parseScheduleText, ScheduleTextGroup } from "../utils/scheduleText";

interface informationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setFormOpen: (val: boolean) => void;
  /** Horario semanal ya agrupado ("Martes a Viernes" -> "17:00 - 21:00"). */
  scheduleGroups?: { label: string; hours: string }[];
  /** Texto libre de horarios; si está presente reemplaza a scheduleGroups. */
  scheduleText?: string;
  /** Subtítulo opcional sobre los horarios (ej. "Horario especial de Invierno"). */
  scheduleSubtitle?: string;
  /** Políticas de reserva como texto libre; una línea por viñeta. */
  policiesText?: string;
}

export default function InformationModal({
  isOpen,
  onClose,
  setFormOpen,
  scheduleGroups = [],
  scheduleText = "",
  scheduleSubtitle = "",
  policiesText = "",
}: informationModalProps) {
  if (!isOpen) return null;

  // Si hay texto libre de horarios, se parsea a cards { label, hours[] }; si
  // no, se usan los grupos del horario configurado (mismo shape).
  const scheduleDisplay: ScheduleTextGroup[] = scheduleText
    ? parseScheduleText(scheduleText)
    : scheduleGroups.map((g) => ({
        label: g.label,
        hours: g.hours ? [g.hours] : [],
      }));

  // Políticas configurables: una línea por viñeta.
  const policyLines = policiesText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

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
                      •{" "}
                      {[g.label, g.hours.join(" · ")]
                        .filter(Boolean)
                        .join(": ")}
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
              {policyLines.length > 0 ? (
                <ul className="text-sm text-purple-800 space-y-1">
                  {policyLines.map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-purple-800">
                  Consultá nuestras políticas de reserva antes de continuar.
                </p>
              )}
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
