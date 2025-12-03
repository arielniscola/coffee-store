import { Calendar } from "lucide-react";

interface ReservationButtonProps {
  onClick: () => void;
}

export default function ReservationButton({ onClick }: ReservationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 bg-white text-amber-900 px-6 py-3 rounded-full font-semibold hover:bg-amber-50 transition-all transform hover:scale-105 shadow-lg"
    >
      <Calendar className="w-5 h-5" />
      <span>Reservar</span>
    </button>
  );
}
