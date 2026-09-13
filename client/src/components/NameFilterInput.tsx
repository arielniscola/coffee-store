import { User, X } from "lucide-react";

interface NameFilterInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function NameFilterInput({
  value,
  onChange,
  className = "",
}: NameFilterInputProps) {
  return (
    <div className={`relative ${className}`}>
      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Filtrar por nombre..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-9 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
          aria-label="Limpiar filtro por nombre"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
