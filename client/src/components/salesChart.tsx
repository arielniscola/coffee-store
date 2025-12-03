import { FC, useState } from "react";
import { IMovement } from "../interfaces/movement";
import { IDailyBalance } from "../interfaces/dailyBalance";
import ModalPaymentMethod from "./DetailModalMovements";
import moment from "moment";
import ModalDelete from "./DeleteModal";
import { deleteMovement } from "../services/movementService";
import toast, { Toaster } from "react-hot-toast";
import { ListTodo, Trash2 } from "lucide-react";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

interface DailyMovementsProps {
  movements: IMovement[];
  setReload: (reload: boolean) => void;
  reload: boolean;
  balance?: IDailyBalance;
}
const DailyMovementsCard: FC<DailyMovementsProps> = ({
  movements,
  setReload,
  reload,
}) => {
  const [selectedMov, setSelectedMov] = useState<IMovement>();
  const [methodModalOpen, setMethodModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>();

  const deleteHandler = async () => {
    try {
      const res = await deleteMovement(deleteId);
      if (res.ack) {
        notifyError(res.message ? res.message : "error");
      } else {
        notify(res.message ? res.message : "ok");
      }
      setDeleteModalOpen(false);
      setReload(!reload);
    } catch (error) {
      notifyError(error ? error.toString() : "error");
    }
  };

  return (
    <div>
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700"></div>
      <div className="mt-2 col-span-full xl:col-span-6 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
        <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            Ventas
          </h2>
        </header>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nro. Venta
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((mov) => (
                <tr key={mov._id} className="hover:bg-gray-50 text-center">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-500">
                      {mov.client && typeof mov.client == "object"
                        ? `${mov.client.firstname} ${mov.client.lastname}`
                        : "Sin Cliente"}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {mov.identifacationNumber
                        ? mov.identifacationNumber
                        : "N/A"}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-500">
                      {moment(mov.date).format("DD-MM-YYYY")}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-500">
                      {mov.state === "debit" ? (
                        <span className="bg-red-100 text-red-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                          Impago
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                          Pagado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-500">
                      $ {mov.totalAmount}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex  items-center justify-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMov(mov);
                          setMethodModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        <ListTodo className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(mov._id);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <ModalPaymentMethod
            id="method-modal"
            setModalOpen={setMethodModalOpen}
            modalOpen={methodModalOpen}
            movement={selectedMov}
          />
          <ModalDelete
            id="delete-modal"
            modalOpen={deleteModalOpen}
            setModalOpen={setDeleteModalOpen}
            deleteFn={deleteHandler}
          />
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default DailyMovementsCard;
