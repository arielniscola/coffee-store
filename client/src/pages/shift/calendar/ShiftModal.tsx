import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { IShift } from "../../../interfaces/shift";
import { ta } from "date-fns/locale";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Partial<IShift>) => void;
  initialShift?: IShift;
  date: string;
  time: string;
  selectedUnitBusiness: string | undefined;
}

interface FormErrors {
  client?: string;
  timeEnd?: string;
}

const addDurationshift = (time: string) => {
  const [hours, minutes = 0] = time.split(":").map(Number);
  let endTime = hours + 2;
  return `${String(endTime).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

const STATUS = [
  { value: "paid", description: "Pagado" },
  { value: "confirmed", description: "Confirmado" },
  { value: "debt", description: "No Pagado" },
  { value: "toConfirm", description: "A Confirmar" },
  { value: "cancelled", description: "Cancelado" },
];

export default function ShiftModal({
  isOpen,
  onClose,
  onSave,
  initialShift,
  date,
  time,
  selectedUnitBusiness,
}: ShiftModalProps) {
  const [formData, setFormData] = useState({
    _id: initialShift?._id || "",
    client: initialShift?.client || "",
    timeStart: initialShift?.timeStart || time,
    timeEnd: initialShift?.timeEnd || time,
    status: initialShift?.status || "toConfirm",
    unitBusiness: initialShift?.unitBusiness || selectedUnitBusiness,
    date: initialShift?.date || date,
    description: initialShift?.description || "",
    phoneNumber: initialShift?.phoneNumber || "",
    email: initialShift?.email || "",
    tableNumber: initialShift?.tableNumber || 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setFormData({
      _id: initialShift?._id || "",
      client: initialShift?.client || "",
      unitBusiness: initialShift?.unitBusiness || selectedUnitBusiness,
      status: initialShift?.status || "toConfirm",
      timeStart: initialShift?.timeStart || time,
      timeEnd: initialShift?.timeEnd || addDurationshift(time),
      date: initialShift?.date || date,
      description: initialShift?.description || "",
      phoneNumber: initialShift?.phoneNumber || "",
      email: initialShift?.email || "",
      tableNumber: initialShift?.tableNumber || 1,
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: FormErrors = {
      client: validateField(
        "client",
        typeof formData.client == "string"
          ? formData.client
          : formData.client || ""
      ),
      timeEnd: validateField("timeEnd", formData.timeEnd),
    };
    setErrors(validationErrors);
    setTouched({ company: true, email: true, password: true });

    // Check if there are any errors
    if (!Object.values(validationErrors).some((error) => error)) {
      onSave(formData);
      onClose();
    }
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "client":
        if (!value.trim()) return "Cliente es requerido";
        return undefined;
      case "timeEnd":
        if (!value) return "Hora de finalización es requerida";
        if (value < formData.timeStart) return "Hora de finalización inválida";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(
      field,
      field === "client"
        ? formData.client
        : field === "timeEnd"
        ? formData.timeEnd
        : ""
    );
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const getInputClassName = (name: string) => {
    const baseClasses =
      "block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200";
    const fieldName: keyof FormErrors = name as keyof FormErrors;
    const hasError = touched[fieldName] && errors[fieldName];
    return `${baseClasses} ${
      hasError ? "border-red-500 bg-red-50" : "border-gray-300"
    }`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialShift ? "Editar Turno" : "Nuevo Turno"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="shiftForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="client"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Cliente
            </label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={(e) => handleChange(e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Inicio
              </label>
              <input
                type="time"
                name="timeStart"
                value={formData.timeStart}
                onChange={(e) => handleChange(e)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de finalización
              </label>
              <input
                type="time"
                name="timeEnd"
                onBlur={() => handleBlur("timeEnd")}
                className={getInputClassName("timeEnd")}
                value={formData.timeEnd}
                onChange={(e) => handleChange(e)}
                required
              />
              {touched.timeEnd && errors.timeEnd && (
                <p className="mt-1 text-sm text-red-600">{errors.timeEnd}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correo Electronico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleChange(e)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Celular
            </label>
            <input
              type="phone"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleChange(e)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              N° de Mesa
            </label>
            <input
              type="number"
              step={1}
              min={1}
              name="tableNumber"
              value={formData.tableNumber}
              onChange={(e) => handleChange(e)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.description}
                </option>
              ))}
            </select>
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-blue-500"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div> */}

          <div className="mt-6">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
