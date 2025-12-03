import { useRef, useEffect, ChangeEvent, useState } from "react";
import { Link } from "react-router-dom";
import Transition from "../utils/transitions";
import { IProduct } from "../interfaces/producto";

interface ModalSearchProps {
  id: string;
  searchId: string;
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  produts: IProduct[];
  addProduct: (prod: IProduct) => void;
}

const ModalSearch: React.FC<ModalSearchProps> = ({
  id,
  searchId,
  modalOpen,
  setModalOpen,
  produts,
  addProduct,
}) => {
  const modalContent = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("");
  const [filterProds, setFilterProds] = useState<IProduct[]>([]);
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

  useEffect(() => {
    modalOpen && searchInput.current?.focus();
  }, [modalOpen]);

  const selectHandler = (prod: IProduct) => {
    setModalOpen(!modalOpen);
    addProduct(prod);
  };

  const filterHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    const newProdArray = produts.filter((prod) =>
      prod.name.toLocaleLowerCase().includes(value)
    );
    setFilterProds(newProdArray);
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
          {/* Search form */}
          <form className="border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <label htmlFor={searchId} className="sr-only">
                Search
              </label>
              <input
                id={searchId}
                className="w-full dark:text-slate-300 bg-white dark:bg-slate-800 border-0 focus:ring-transparent placeholder-slate-400 dark:placeholder-slate-500 appearance-none py-3 pl-10 pr-4"
                type="search"
                placeholder="Seleccionar productos..."
                ref={searchInput}
                onChange={filterHandler}
              />
              <button
                className="absolute inset-0 right-auto group"
                type="submit"
                aria-label="Search"
              >
                <svg
                  className="w-4 h-4 shrink-0 fill-current text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 ml-4 mr-2"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                  <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
                </svg>
              </button>
            </div>
          </form>
          <div className="py-4 px-2">
            {/* Productos */}
            <div className="mb-3 last:mb-0">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase px-2 mb-2">
                Productos
              </div>
              <ul className="text-sm">
                {filter.length == 0
                  ? produts &&
                    produts.map((prod) => (
                      <li key={prod._id}>
                        <Link
                          className="flex items-center p-2 text-slate-800 dark:text-slate-100 hover:text-white hover:bg-indigo-500 rounded group"
                          to="#0"
                          onClick={() => selectHandler(prod)}
                        >
                          <div className="grow flex justify-between items-center">
                            <div>
                              {" "}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#5f6368"
                              >
                                <path d="M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" />
                              </svg>
                            </div>
                            <div>
                              {" "}
                              <span className="col-span-3 text-lg font-sans">
                                {prod.name}
                              </span>
                            </div>
                            <div>
                              {" "}
                              <span className="font-bold text-green-600 text-base">
                                $ {prod.price}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  : filterProds.map((prod) => (
                      <li>
                        <Link
                          className="flex items-center p-2 text-slate-800 dark:text-slate-100 hover:text-white hover:bg-indigo-500 rounded group"
                          to="#0"
                          onClick={() => selectHandler(prod)}
                        >
                          <div className="grow flex justify-between items-center">
                            <div>
                              {" "}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#5f6368"
                              >
                                <path d="M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" />
                              </svg>
                            </div>
                            <div>
                              {" "}
                              <span className="col-span-3 text-lg font-sans">
                                {prod.name}
                              </span>
                            </div>
                            <div>
                              {" "}
                              <span className="font-bold text-green-600 text-base">
                                $ {prod.price}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
};

export default ModalSearch;
