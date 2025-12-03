import { ShieldX, LogIn } from "lucide-react";

function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-50 rounded-full">
            <ShieldX className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso denegado
        </h1>

        <p className="text-gray-600 mb-8">
          Lo siento, no tenes acceso a esta página. Por favor inicia sesión.
        </p>

        <a
          href="/login"
          className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <LogIn className="w-5 h-5" />
          <span>Ir a Iniciar sesión</span>
        </a>
      </div>
    </div>
  );
}

export default Unauthorized;
