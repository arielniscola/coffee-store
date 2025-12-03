import { useRef, useEffect, useState, FormEvent, ChangeEvent } from "react";
import Transition from "../utils/transitions";
import { IClient } from "../interfaces/client";
import toast, { Toaster } from "react-hot-toast";
import { createClient, updateClient } from "../services/clientService";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

interface FormModalClientProps {
  id: string;
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  clientUpdate?: IClient;
}

const FormClientModal: React.FC<FormModalClientProps> = ({
  id,
  modalOpen,
  setModalOpen,
  clientUpdate = null,
}) => {
  const modalContent = useRef<HTMLDivElement>(null);
  const [client, setClient] = useState<IClient>({
    firstname: "",
    lastname: "",
    identificationNumber: "",
    companyCode: "",
    email: "",
    phonenumber: "",
    address: "",
  });
  // Is a edit form
  useEffect(() => {
    if (clientUpdate) setClient(clientUpdate);
  }, [clientUpdate, modalOpen]);

  // close on click outside
  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const { target } = event;
      if (!modalOpen || modalContent.current?.contains(target as Node)) return;
      setModalOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      const { keyCode } = event;
      if (!modalOpen || keyCode !== 27) return;
      setModalOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const handleChangeClient = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    switch (id) {
      default:
        setClient({
          ...client,
          [id]: value,
        });
        break;
    }
  };
  const submintHandlerClient = async (e: FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (!client.companyCode) {
        res = await createClient(client);
      } else {
        res = await updateClient(client);
      }
      if (!res.ack) {
        notify(res.message ? res.message : "ok");
      } else {
        notifyError(res.message ? res.message : "Error");
      }
    } catch (error) {
      notifyError(error ? error.toString() : "Error");
    } finally {
      setTimeout(() => setModalOpen(false), 500);
    }
  };

  return (
    <>
      {/* Modal backdrop */}
      <Transition
        className="fixed inset-0 bg-slate-900 bg-opacity-30 z-50 transition-opacity"
        show={modalOpen}
        enter="transition ease-out duration-200"
        enterStart="opacity-0"
        enterEnd="opacity-100"
        leave="transition ease-out duration-100"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
        aria-hidden="true"
      />
      {/* Modal dialog */}
      <Transition
        id={id}
        className="fixed inset-0 z-50 overflow-hidden flex items-start top-20 mb-4 justify-center px-4 sm:px-6"
        role="dialog"
        aria-modal="true"
        show={modalOpen}
        enter="transition ease-in-out duration-200"
        enterStart="opacity-0 translate-y-4"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-in-out duration-200"
        leaveStart="opacity-100 translate-y-0"
        leaveEnd="opacity-0 translate-y-4"
      >
        <div
          ref={modalContent}
          className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 overflow-auto max-w-2xl w-full max-h-full rounded shadow-lg"
        >
          <div className="relative p-4 w-full  max-h-full">
            <h4 className="text-2x1 font-bold dark:text-white mb-3">
              {clientUpdate ? "Actualizar cliente" : "Crear Cliente"}
            </h4>
            <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700">
              <form className="mx-auto">
                <div className="grid w-full grid-flow-col gap-2">
                  <div>
                    <div className="mb-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="firstname"
                        value={client.firstname}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={handleChangeClient}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label
                        htmlFor="code"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="lastname"
                        value={client.lastname}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={handleChangeClient}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        DNI
                      </label>
                      <input
                        type="text"
                        id="identificationNumber"
                        value={client.identificationNumber}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={handleChangeClient}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2">
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Direccion
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={client.address}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        required
                        onChange={handleChangeClient}
                      />
                    </div>
                    <div className="mb-2">
                      <label
                        htmlFor="stock"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Telefono
                      </label>
                      <input
                        type="text"
                        id="phonenumber"
                        value={client.phonenumber}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={handleChangeClient}
                      />
                    </div>
                    <div className="mb-2">
                      <label
                        htmlFor="stock"
                        className="block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Correo
                      </label>
                      <input
                        type="text"
                        id="email"
                        value={client.email}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={handleChangeClient}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-white mt-5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={submintHandlerClient}
                >
                  Guardar
                </button>
              </form>
            </div>
          </div>
          <Toaster position="bottom-right" />
        </div>
      </Transition>
    </>
  );
};

export default FormClientModal;
