import { Phone, AlertCircle, Check } from "lucide-react";
import { IShift } from "../interfaces/shift";
import { ICompany } from "../interfaces/company";
import { formatLongDate } from "../utils/dates";

interface informationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: IShift | undefined;
  company: ICompany | undefined;
  priceChild?: number;
}

const formatPrice = (n: number) =>
  n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

export default function ConfirmationModal({
  isOpen,
  onClose,
  shift,
  company,
  priceChild = 0,
}: informationModalProps) {
  if (!isOpen) return null;

  // Si el horario elegido no lleva seña (franja sin seña o precio 0), no hay
  // nada que transferir: se ocultan importe y datos bancarios.
  const requiresDeposit = (shift?.price || 0) > 0;

  // Detalle discriminado de asistentes (ej. "2 adultos + 1 niño + 1 bebé").
  // Si el turno no trae el desglose, se cae al total de personas.
  const buildPeopleDetail = (s: IShift) => {
    const parts: string[] = [];
    const push = (qty: number | undefined, singular: string, plural: string) => {
      if (qty && qty > 0) parts.push(`${qty} ${qty === 1 ? singular : plural}`);
    };
    push(s.adultsQty, "adulto", "adultos");
    push(s.childrenQty, "niño", "niños");
    push(s.babiesQty, "bebé", "bebés");
    if (parts.length) return parts.join(" + ");
    const total = s.peopleQty || 0;
    return `${total} ${total === 1 ? "persona" : "personas"}`;
  };

  // Mensaje prearmado de WhatsApp con los datos de la reserva: sin seña se
  // envía la confirmación, con seña se anuncia el comprobante.
  const buildWhatsAppText = () => {
    if (!shift) {
      return requiresDeposit
        ? "Hola, envío el comprobante de la seña de mi reserva."
        : "Hola, envío la confirmación de mi reserva.";
    }
    const lines = [
      requiresDeposit
        ? "Hola! Envío el comprobante de la seña de mi reserva:"
        : "Hola! Envío la confirmación de mi reserva:",
      "",
      `Nombre: ${shift.client}`,
      `Fecha: ${formatLongDate(shift.date)}`,
      `Horario: ${shift.timeStart} a ${shift.timeEnd} hs`,
      `Asistentes: ${buildPeopleDetail(shift)}`,
    ];
    if (shift.phoneNumber) lines.push(`Teléfono: ${shift.phoneNumber}`);
    if (shift.description) lines.push(`Comentarios: ${shift.description}`);
    return lines.join("\n");
  };

  return (
    <div
      translate="no"
      className="notranslate fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Gracias por Reservar!
          </h2>
          <p className="text-gray-600">
            Tu reserva ha sido registrada exitosamente
          </p>
        </div>

        {/* Información de Seña */}
        <div className="space-y-4 mb-6">
          {requiresDeposit ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={24}
                  className="text-blue-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">
                    ⚠️ Importante: Confirma tu Reserva
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Para confirmar tu turno, necesitas realizar una seña de{" "}
                    <span className="font-bold">
                      ${formatPrice(priceChild)}
                    </span>{" "}
                    por niño.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Check
                  size={24}
                  className="text-emerald-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-emerald-900 mb-2">
                    Sin seña
                  </h3>
                  <p className="text-sm text-emerald-800">
                    El horario que elegiste no requiere seña: no tenés que
                    pagar ni transferir nada. Te esperamos.
                  </p>
                </div>
              </div>
            </div>
          )}
          {requiresDeposit && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-purple-900 mb-2">
                💳 Datos para Transferencia:
              </h3>
              <div className="space-y-1 text-sm text-purple-800">
                <p>
                  <span className="font-semibold">CVU/Alias:</span>{" "}
                  {company?.alias}
                </p>
                <p>
                  <span className="font-semibold">CUIT:</span> {company?.cuit}
                </p>
                <p>
                  <span className="font-semibold">Titular:</span>{" "}
                  {company?.accountName}
                </p>
              </div>
            </div>
          )}

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Phone
                size={24}
                className="text-green-600 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-bold text-green-900 mb-2">
                  {requiresDeposit
                    ? "📱 Envía el Comprobante"
                    : "📱 Enviá la confirmación de tu reserva a este WhatsApp"}
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  {requiresDeposit
                    ? "Realiza la transferencia y envía el comprobante por WhatsApp:"
                    : "Tocá el botón y envianos el mensaje con los datos de tu reserva:"}
                </p>
                <a
                  href={`https://wa.me/${company?.cellphone}?text=${encodeURIComponent(
                    buildWhatsAppText()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <Phone size={18} />
                  {company?.cellphone}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 text-center mb-4">
            📧 Recibirás un mensaje de confirmación en {shift?.phoneNumber}
          </p>
          <button
            onClick={() => {
              onClose();
            }}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
