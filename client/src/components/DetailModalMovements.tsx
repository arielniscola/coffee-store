import { useRef, useEffect } from "react";
import Transition from "../utils/transitions";
import { IMovement } from "../interfaces/movement";

interface DatailModalMovementsProps {
  id: string;
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  movement?: IMovement;
}

const ModalDetailMovements: React.FC<DatailModalMovementsProps> = ({
  id,
  modalOpen,
  setModalOpen,
  movement,
}) => {
  const modalContent = useRef<HTMLDivElement>(null);

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
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
                  Cliente:{" "}
                  {movement?.client && typeof movement.client == "object"
                    ? `${movement.client.firstname} ${movement.client.lastname}`
                    : "Sin cliente"}
                </h5>
                {movement?.state === "paid" ? (
                  <span className="bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                    Pagado
                  </span>
                ) : (
                  <span className="bg-pink-100 text-pink-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-pink-900 dark:text-pink-300">
                    No cancelado
                  </span>
                )}
              </div>
              <div className="flow-root">
                <ul
                  role="list"
                  className="divide-y divide-gray-200 dark:divide-gray-700"
                >
                  {movement &&
                    movement.details.map((det) => (
                      <li key={det._id} className="py-3 sm:py-4">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0 ms-4">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                              {det.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                              Cantidad: {det.units}
                            </p>
                          </div>
                          <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                            $ {det.units * det.price}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
};

export default ModalDetailMovements;
