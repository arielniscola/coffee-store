import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";
interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | "";
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  onBlur?: (field: string) => void;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar una opcion...",
  className = "",
  name = "",
  onBlur,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex-1 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                name={name}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
                onBlur={onBlur ? () => onBlur(name) : undefined}
              />
              {searchTerm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    option.value === value
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
