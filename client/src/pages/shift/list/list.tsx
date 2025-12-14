import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  Trash2,
  Check,
  X,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  deleteShift,
  getShifts,
  updateShift,
} from "../../../services/shiftService";
import { IShift } from "../../../interfaces/shift";
import { addDays, format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import ModalDelete from "../../../components/DeleteModal";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

export function ReservationList() {
  const [reservations, setReservations] = useState<IShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [filter, setFilter] = useState<
    "all" | "toConfirm" | "confirmed" | "cancelled" | "completed"
  >("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    loadReservations();
  }, [currentDate]);

  async function loadReservations() {
    try {
      setLoading(true);
      const data = (await getShifts(
        currentDate.toISOString(),
        "LOC1"
      )) as IShift[];
      setReservations(data);
    } catch (error) {
      console.error("Error loading reservations:", error);
    } finally {
      setLoading(false);
    }
  }
  const handlePreviousDay = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const deleteReservation = async () => {
    try {
      const res = await deleteShift(deleteId);
      if (res.ack) {
        notifyError(res.message || "Error al eliminar reserva");
        console.error("Error delete reservation:", res.message);
        return;
      } else {
        notify("Reserva eliminada correctamente");
      }
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

  async function updateStatus(shift: Partial<IShift>, status: string) {
    try {
      shift.status = status;
      const res = await updateShift(shift);
      if (res.ack) {
        notifyError(res.message || "Error al actualizar reserva");
        console.error("Error updating status:", res.message);
        return;
      } else {
        notify("Reserva actualizada correctamente");
      }
      loadReservations();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  const filteredReservations =
    filter === "all"
      ? reservations
      : reservations.filter((r) => r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "toConfirm":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "paid":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "debt":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "toConfirm":
        return "Pendiente";
      case "paid":
        return "Pagado";
      case "confirmed":
        return "Confirmado";
      case "cancelled":
        return "Cancelado";
      case "completed":
        return "Completado";
      case "debt":
        return "Impaga";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-gray-100 min-h-screen">
      <div className="flex items-right  justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-medium text-gray-900">
            {currentDate.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousDay}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input
              type="date"
              value={format(new Date(currentDate), "yyyy-MM-dd")}
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          "all",
          "toConfirm",
          "confirmed",
          "cancelled",
          "completed",
          "paid",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            {status === "all" ? "Todas" : getStatusText(status)}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No hay reservas para mostrar</p>
          </div>
        ) : (
          filteredReservations.map((reservation) => (
            <div
              key={reservation._id}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {reservation.client}
                  </h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      reservation.status
                    )}`}
                  >
                    {getStatusText(reservation.status)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {reservation.status === "toConfirm" && (
                    <>
                      <button
                        onClick={() => updateStatus(reservation, "confirmed")}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Confirmar"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(reservation, "cancelled")}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModalOpen(true);
                      setDeleteId(reservation._id || "");
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(reservation.date).getUTCDate()}-
                      {new Date(reservation.date).getUTCMonth() + 1}-
                      {new Date(reservation.date).getUTCFullYear()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {reservation.timeStart || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">2 personas</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{reservation.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{reservation.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {reservation.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notas:</span>{" "}
                    {reservation.description}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Toaster position="bottom-right" />
      <ModalDelete
        id="delete-modal-shift"
        modalOpen={deleteModalOpen}
        setModalOpen={setDeleteModalOpen}
        deleteFn={deleteReservation}
      />
    </div>
  );
}
