import { Clock, Phone, AlertCircle, Check } from "lucide-react";

interface informationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setFormOpen: (val: boolean) => void;
}

export default function InformationModal({
  isOpen,
  onClose,
  setFormOpen,
}: informationModalProps) {
  if (!isOpen) return null;

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
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Martes a viernes 17 a 21 hs</li>
                <li>
                  • Sabados y Domingos 10 a 12 hs 17 a 19 hs 19:15 a 21:15 hs
                </li>
              </ul>
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
                  • Cada niño abona un monto de $ 10.000, (talleres $15.000)
                  esta entrada incluye las siguientes consumiciones:
                  <ul>
                    <li>
                      {" "}
                      - Jugo Pura Fruta o Chocolatada o Agua + Muffin o Budin o
                      Tortita{" "}
                    </li>
                    <li>- Yogurt con cereales</li>
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
