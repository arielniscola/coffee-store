import { ChangeEvent, useEffect, useState } from "react";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import { IClient } from "../../interfaces/client";
import {
  createClient,
  deleteClient,
  getClients,
  getMovementsClient,
  updateClient,
} from "../../services/clientService";
import { IMovement } from "../../interfaces/movement";
import ModalPaymentMethod from "../../components/PaymentMethodModal";
import FormClientModal from "../../components/formClientModal";
import ModalDetailMovements from "../../components/DetailModalMovements";
import { deleteMovement } from "../../services/movementService";
import toast, { Toaster } from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Pencil,
  Search,
  SquareMenu,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import ModalDelete from "../../components/DeleteModal";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

const ClientView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clients, setClients] = useState<IClient[]>([]);
  const [movements, setMovements] = useState<IMovement[]>();
  const [selectedMov, setSelectedMov] = useState<IMovement>();
  const [selectedClient, setSelectedClient] = useState<IClient>();
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [doubt, setDoubt] = useState<number>();
  const [research, setResearch] = useState<boolean>(false);
  const [formData, setFormData] = useState<IClient>({
    _id: "",
    firstname: "",
    lastname: "",
    email: "",
    phonenumber: "",
    address: "",
    identificationNumber: "",
    companyCode: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [filterData, setFilterData] = useState<IClient[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; type: string }>({
    id: "",
    type: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = (await getClients()) as IClient[];
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);
  useEffect(() => {
    const fetchmovs = async () => {
      try {
        const { movs, total } = await getMovementsClient(
          selectedClient?._id,
          currentPage
        );
        totalDoubt(movs as IMovement[]);
        setMovements(movs as IMovement[]);
        setTotal(total);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchmovs();
  }, [selectedClient, research, currentPage]);

  useEffect(() => {
    if (showModal === false) {
      setFormData({
        _id: "",
        firstname: "",
        lastname: "",
        email: "",
        phonenumber: "",
        address: "",
        identificationNumber: "",
        companyCode: "",
      });
    }
  }, [showModal]);

  //Manejo selector de cliente
  const handlerSelectClient = (value: string) => {
    const cli = clients?.find((cli) => cli._id === value);
    setSelectedClient(cli);
  };

  //Calculo total deuda
  const totalDoubt = (movs: IMovement[]) => {
    let total = 0;
    for (const mov of movs) {
      if (mov.state == "debit") total += mov.totalAmount;
    }
    setDoubt(total);
  };

  const handleUpdate = (id?: string) => {
    const client = clients.find((u) => u._id === id);
    if (client) {
      setFormData(client);
      setShowModal(true);
    }
  };

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    const newUNArray = clients.filter(
      (client) =>
        client.firstname
          ?.toLocaleLowerCase()
          .includes(value.toLocaleLowerCase()) ||
        client.lastname?.toLocaleLowerCase().includes(value.toLocaleLowerCase())
    );
    setFilterData(newUNArray);
  };

  const deleteHandler = async () => {
    try {
      let res;
      res =
        deleteId.type === "movements"
          ? await deleteMovement(deleteId.id)
          : await deleteClient(deleteId.id);
      if (res.ack) {
        notifyError(res.message ? res.message : "error");
      } else {
        notify(res.message ? res.message : "ok");
      }
      setDeleteModalOpen(false);
      setResearch(!research);
    } catch (error) {
      notifyError(error ? error.toString() : "error");
    }
  };

  const handleAddClient = async () => {
    try {
      let res;
      !formData._id
        ? (res = await createClient(formData))
        : (res = await updateClient(formData));

      if (!res.ack) {
        notify(res.message ? res.message : "ok");
      } else {
        notifyError(res.message ? res.message : "Error");
      }
    } catch (error) {
      notifyError(error ? error.toString() : "Error");
    } finally {
      setShowModal(false);
      setResearch(!research);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/*  Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main>
          <div className="bg-gray-100 p-8">
            <div className="mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestión Clientes
                </h1>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    <UserPlus className="h-5 w-5" />
                    Nuevo
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="mb-4 flex gap-4">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Filtrar clientes..."
                        value={filter}
                        onChange={(e) => filterHandler(e)}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Apellido
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filter.length === 0
                        ? clients.map((cli) => (
                            <tr
                              key={cli._id}
                              className="hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlerSelectClient(cli._id ? cli._id : "");
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {cli.firstname}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {cli.lastname}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${
                                    cli.debt ? "red" : "green"
                                  }-100 text-${cli.debt ? "red" : "green"}-800`}
                                >
                                  {cli.debt === true ? "Debe" : "No Debe"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdate(cli._id ? cli._id : "");
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                  >
                                    <Pencil className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteId(
                                        cli._id
                                          ? { id: cli._id, type: "client" }
                                          : { id: "", type: "" }
                                      );
                                      setDeleteModalOpen(true);
                                    }}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        : filterData.map((cli) => (
                            <tr
                              key={cli._id}
                              className="hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlerSelectClient(cli._id ? cli._id : "");
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {cli.firstname}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {cli.lastname}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${
                                    cli.debt ? "red" : "green"
                                  }-100 text-${cli.debt ? "red" : "green"}-800`}
                                >
                                  {cli.debt === true ? "Debe" : "No Debe"}
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdate(cli._id ? cli._id : "");
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                  >
                                    <Pencil className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteId(
                                        cli._id
                                          ? { id: cli._id, type: "movements" }
                                          : { id: "", type: "" }
                                      );
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

                {/* Movements Display */}
                <div className="md:col-span-1">
                  {selectedClient ? (
                    <div className="bg-white rounded-lg shadow">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                              {selectedClient.firstname}
                            </h2>
                            <p className="text-gray-500">
                              {selectedClient.lastname}
                            </p>
                          </div>
                          <div
                            className={`text-right ${
                              (doubt ? doubt : 0) > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            <p className="text-sm font-medium">Deuda Total</p>
                            <p className="text-2xl font-bold">
                              ${doubt?.toFixed(2)}
                            </p>
                            {selectedClient.debt && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMethodModalOpen(true);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                <CreditCard className="h-4 w-4" />
                                <span>Procesar Pago</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pendiente
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedClient &&
                              movements?.map((movement) => (
                                <tr
                                  key={movement._id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    {new Date(
                                      movement.date
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        movement.state === "paid"
                                          ? "bg-green-100 text-green-800"
                                          : movement.state === "debit"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {movement.state === "paid" ? (
                                        <DollarSign className="h-3 w-3 mr-1" />
                                      ) : (
                                        <CreditCard className="h-3 w-3 mr-1" />
                                      )}
                                      {movement.state === "paid"
                                        ? "Pagado"
                                        : movement.state === "debit"
                                        ? "Impago"
                                        : "Parcial"}
                                    </span>
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-center ${
                                      movement.state === "paid"
                                        ? "text-green-600"
                                        : movement.state === "debit"
                                        ? "text-red-600"
                                        : "text-yellow-500"
                                    }`}
                                  >
                                    ${movement.totalAmount?.toFixed(2)}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-center ${
                                      movement.state === "paid"
                                        ? "text-green-600"
                                        : movement.state === "debit"
                                        ? "text-red-600"
                                        : "text-yellow-500"
                                    }`}
                                  >
                                    $
                                    {movement.totalAmount -
                                      (movement.amountPaid ?? 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium items-center">
                                    <div className="flex space-x-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMov(movement);
                                          setDetailModalOpen(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                      >
                                        <SquareMenu className="h-5 w-5" />
                                      </button>
                                      {movement.state != "paid" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedMov(movement);
                                            setMethodModalOpen(true);
                                          }}
                                          className="text-blue-600 hover:text-red-900 transition-colors"
                                        >
                                          <CreditCard className="h-5 w-5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteId(
                                            movement._id
                                              ? {
                                                  id: movement._id,
                                                  type: "movements",
                                                }
                                              : { id: "", type: "" }
                                          );
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
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                          <div className="flex-1 flex justify-between sm:hidden">
                            <button
                              onClick={prevPage}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={nextPage}
                              disabled={currentPage === totalPages}
                              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              Siguiente
                            </button>
                          </div>
                          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Mostrando{" "}
                                <span className="font-medium">
                                  {startIndex + 1}
                                </span>{" "}
                                a{" "}
                                <span className="font-medium">
                                  {Math.min(endIndex, total)}
                                </span>{" "}
                                de <span className="font-medium">{total}</span>{" "}
                                resultados
                              </p>
                            </div>
                            <div>
                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                  onClick={prevPage}
                                  disabled={currentPage === 1}
                                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                {Array.from(
                                  { length: totalPages },
                                  (_, i) => i + 1
                                ).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      currentPage === page
                                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                                <button
                                  onClick={nextPage}
                                  disabled={currentPage === totalPages}
                                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <h3 className="text-lg font-medium text-gray-500">
                        Seleccionar cliente para ver movimientos
                      </h3>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add/Edit Client Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 max-w-md w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Cliente</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={formData?.firstname}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstname: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Apellido
                      </label>
                      <input
                        type="text"
                        required
                        value={formData?.lastname}
                        onChange={(e) =>
                          setFormData({ ...formData, lastname: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData?.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Telefono
                      </label>
                      <input
                        type="text"
                        required
                        value={formData?.phonenumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phonenumber: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        DNI
                      </label>
                      <input
                        type="text"
                        required
                        value={formData?.identificationNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phonenumber: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Direccion
                      </label>
                      <input
                        type="text"
                        required
                        value={formData?.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        onClick={handleAddClient}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <ModalPaymentMethod
          id="detail-modal"
          setModalOpen={setMethodModalOpen}
          modalOpen={methodModalOpen}
          setResearch={setResearch}
          research={research}
          client={selectedClient}
          movement={selectedMov}
        />
        <FormClientModal
          id="form-modal"
          setModalOpen={setFormModalOpen}
          modalOpen={formModalOpen}
          clientUpdate={selectedClient}
        />
        <ModalDetailMovements
          id="method-modal"
          setModalOpen={setDetailModalOpen}
          modalOpen={detailModalOpen}
          movement={selectedMov}
        />
        <ModalDelete
          id="delete-modal"
          modalOpen={deleteModalOpen}
          setModalOpen={setDeleteModalOpen}
          deleteFn={deleteHandler}
        />
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default ClientView;
