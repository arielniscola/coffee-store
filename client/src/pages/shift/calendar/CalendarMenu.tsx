import { Calendar as CalendarIcon } from "lucide-react";
import Calendar from "./Calendar";
import ShiftModal from "./ShiftModal";
import type { IShift } from "../../../interfaces/shift";
import { useEffect, useState } from "react";

import {
  createShift,
  deleteShift,
  getShifts,
  updateShift,
} from "../../../services/shiftService";
import toast, { Toaster } from "react-hot-toast";
import moment from "moment";
import UpdateModalConfirm from "../../../components/updateModalConfirm";
import { IUnitBusiness } from "../../../interfaces/unitBusiness";
import { getUnitBusiness } from "../../../services/unitBusinessService";
import ModalDelete from "../../../components/DeleteModal";
const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

function CalendarMenu() {
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedShift, setSelectedShift] = useState<IShift | undefined>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [researchShifts, setResearchShifts] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectDragShift, setSelectDragShift] = useState<IShift>();
  const [unitBusiness, setUnitBusiness] = useState<IUnitBusiness[]>([]);
  const [selectedUnitBusiness, setSelectedUnitBusiness] =
    useState<IUnitBusiness>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  useEffect(() => {
    const fetchUnitBusiness = async () => {
      try {
        const unitBusinessData = (await getUnitBusiness(
          true
        )) as IUnitBusiness[];
        setUnitBusiness(unitBusinessData);
        setSelectedUnitBusiness(unitBusinessData[0]);
      } catch (error) {
        console.error("Error fetching unit business:", error);
      }
    };
    fetchUnitBusiness();
  }, []);
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const clientsData = (await getShifts(
          selectedDate
            ? selectedDate
            : moment(currentDate).format("YYYY-MM-DD"),
          selectedUnitBusiness?.code
        )) as IShift[];
        setShifts(clientsData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchShifts();
  }, [researchShifts, selectedUnitBusiness, selectedDate, currentDate]);

  const handleAddShift = (date: string, time: string) => {
    setSelectedStartTime(time);
    setSelectedDate(date);
    setSelectedShift(undefined);
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: IShift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleUpdateShift = (
    shiftId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => {
    //buscar turno a modificar
    const shiftFound = shifts.find((shift) => shift._id === shiftId);
    //Modificar turno
    if (shiftFound)
      setSelectDragShift({
        ...shiftFound,
        date,
        timeStart: startTime,
        timeEnd: endTime,
      });
    setUpdateModalOpen(true);
  };

  const handleSaveShift = async (shiftData?: Partial<IShift>) => {
    try {
      let res;
      if (selectDragShift) {
        res = await updateShift(selectDragShift);
      } else if (selectedShift) {
        // Editar turno existente
        if (shiftData) res = await updateShift(shiftData);
      } else if (shiftData) {
        // Agregar nuevo turno
        res = await createShift(shiftData);
      }
      if (res?.ack) {
        notifyError(res.message ? res.message : "error");
      } else {
        notify(res?.message ? res.message : "ok");
        setResearchShifts(!researchShifts);
      }
    } catch (error) {
      notifyError(error ? error.toString() : "Error");
    } finally {
      setUpdateModalOpen(false);
      setSelectDragShift(undefined);
    }
  };

  const deleteOpen = (id: string) => {
    setDeleteModalOpen(true);
    setDeleteId(id);
  };
  const deleteHandler = async () => {
    try {
      const res = await deleteShift(deleteId);
      if (res.ack) {
        notifyError(res.message ? res.message : "error");
      } else {
        notify(res.message ? res.message : "ok");
      }
      setDeleteModalOpen(false);
      setResearchShifts(!researchShifts);
    } catch (error) {
      notifyError(error ? error.toString() : "error");
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto">
          <div className="flex items-right mb-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-medium text-gray-900">
                {currentDate.toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <Calendar
            shifts={shifts}
            onAddShift={handleAddShift}
            onEditShift={handleEditShift}
            selectedDate={currentDate}
            onDateChange={setCurrentDate}
            onUpdateShift={handleUpdateShift}
            selectedUN={selectedUnitBusiness}
            setSelectedUN={setSelectedUnitBusiness}
            unitBusiness={unitBusiness}
            deleteShift={deleteOpen}
          />

          <ShiftModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveShift}
            initialShift={selectedShift}
            date={selectedDate}
            time={selectedStartTime}
            selectedUnitBusiness={selectedUnitBusiness?.code}
          />

          <UpdateModalConfirm
            id="update-modal"
            modalOpen={updateModalOpen}
            setModalOpen={setUpdateModalOpen}
            updateFn={handleSaveShift}
          />
        </div>
      </div>
      <ModalDelete
        id="delete-modal"
        modalOpen={deleteModalOpen}
        setModalOpen={setDeleteModalOpen}
        deleteFn={deleteHandler}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default CalendarMenu;
