import { useEffect } from "react";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

// Pantalla que reemplaza al error boundary por defecto de React Router, que
// mostraba el stack trace crudo (y en inglés) al cliente que intentaba reservar.
export default function ErrorPage() {
  const error = useRouteError();

  // El detalle solo va a la consola: sirve para depurar sin exponerlo al usuario.
  useEffect(() => {
    console.error("Error no controlado en la aplicación:", error);
  }, [error]);

  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-pink-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          {is404 ? "No encontramos esta página" : "Algo salió mal"}
        </h1>
        <p className="text-gray-600 mb-8">
          {is404
            ? "El enlace puede estar desactualizado."
            : "Tuvimos un problema inesperado. Podés reintentar; si el error se repite, escribinos y te tomamos la reserva por WhatsApp."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!is404 && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 bg-pink-400 hover:bg-pink-300 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Reintentar
            </button>
          )}
          <a
            href="/reservas"
            className="inline-flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-300 text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            <Home className="w-5 h-5" />
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
