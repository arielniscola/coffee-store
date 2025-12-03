import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function MonthYearPicker({
  selectedDate,
  onChange,
}: {
  selectedDate: Date;
  onChange: (date: Date) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() - 1);
    onChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + 1);
    onChange(newDate);
  };

  const handlePrevYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(selectedDate.getFullYear() - 1);
    onChange(newDate);
  };

  const handleNextYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(selectedDate.getFullYear() + 1);
    onChange(newDate);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">
          {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevYear}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium w-14 text-center">
                {selectedDate.getFullYear()}
              </span>
              <button
                onClick={handleNextYear}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium w-20 text-center">
                {months[selectedDate.getMonth()]}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-blue-500 text-white rounded py-1 text-sm hover:bg-blue-600 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export default MonthYearPicker;
