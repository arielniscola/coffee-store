import { Phone, AlertCircle, Check } from "lucide-react";
import { IShift } from "../interfaces/shift";

interface informationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: IShift | undefined;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  shift,
}: informationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  Para confirmar tu turno, necesitas realizar una seña del{" "}
                  <span className="font-bold">30%</span> del consumo mínimo.
                </p>
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-600 mb-2">
                    Monto de seña estimado:
                  </p>
                  <p className="text-2xl font-bold text-blue-900">$5.000 ARS</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-2">
              💳 Datos para Transferencia:
            </h3>
            <div className="space-y-1 text-sm text-purple-800">
              <p>
                <span className="font-semibold">CVU/Alias:</span> CAFE.RESERVAS
              </p>
              <p>
                <span className="font-semibold">CUIT:</span> 20-12345678-9
              </p>
              <p>
                <span className="font-semibold">Titular:</span> Café Reservas
                S.A.
              </p>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Phone
                size={24}
                className="text-green-600 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-bold text-green-900 mb-2">
                  📱 Envía el Comprobante
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Realiza la transferencia y envía el comprobante por WhatsApp:
                </p>
                <a
                  href="https://wa.me/2616271352?text=Hola Anita la arañita"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <Phone size={18} />
                  +54 299 123-4567
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
