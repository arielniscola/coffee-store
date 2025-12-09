import {
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import Gallery from "../../components/Gallery";
import ReservationButton from "../../components/ReservationButton";
import ReservationModal from "../../components/ReservationModal";
import FloorPlan from "../../components/FloorPlan";
import { useState } from "react";

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-gradient-to-r from-pink-300 to-blue-300 text-white shadow-lg">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-10 h-10" />
              <h1 className="text-3xl font-bold tracking-tight">
                WichiWi Cafe Kids
              </h1>
            </div>
            <ReservationButton onClick={() => setIsModalOpen(true)} />
          </div>
        </nav>
      </header>

      <main>
        <section className="relative h-[600px] overflow-hidden">
          <img
            src="https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Café para familias"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h2 className="text-6xl font-bold mb-4 tracking-tight">
                Bienvenido a WichiWi
              </h2>
              <p className="text-2xl mb-8 font-light">
                Un café especial para la familia
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-pink-400 hover:bg-pink-300 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl"
              >
                Reservar Mesa
              </button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-pink-400 mb-4">
              Nuestra Historia
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              WichiWi es un café especial diseñado para familias con niños.
              Ofrecemos un espacio acogedor y seguro donde los pequeños pueden
              disfrutar de deliciosas bebidas y comidas mientras los padres se
              relajan. ¡Cada visita es una nueva aventura!
            </p>
          </div>
        </section>

        <section className="bg-gradient-to-b from-blue-50 to-pink-50 py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-blue-400 mb-4">Galería</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
              <p className="text-xl text-gray-700">
                Descubre nuestro acogedor espacio
              </p>
            </div>
            <Gallery />
          </div>
        </section>

        <section className="bg-gradient-to-b from-pink-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-pink-400 mb-4">
                Plano del Café
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
              <p className="text-xl text-gray-700">
                Consulta la disponibilidad de mesas para familias
              </p>
            </div>
            <FloorPlan />
          </div>
        </section>

        <section className="bg-gradient-to-b from-blue-50 to-pink-50 py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-blue-400 mb-4">
                Visítanos
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="bg-gradient-to-r from-pink-300 to-pink-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-pink-400 mb-3">
                  Ubicación
                </h3>
                <p className="text-gray-700">
                  Calle Principal 123
                  <br />
                  Centro, Ciudad
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-300 to-orange-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-400 mb-3">
                  Teléfono
                </h3>
                <p className="text-gray-700">
                  +34 123 456 789
                  <br />
                  Lun-Dom: 9AM - 7PM
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-300 to-blue-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-400 mb-3">Email</h3>
                <p className="text-gray-700">
                  info@wichiwi.com
                  <br />
                  reservas@wichiwi.com
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-pink-300 to-blue-300 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-3">
                <Sparkles className="w-8 h-8" />
                <span className="text-2xl font-bold">WichiWi Cafe Kids</span>
              </div>
              <p className="text-white/90">Un café para toda la familia</p>
            </div>
            <div>
              <p className="text-white/90 mb-4 text-center md:text-left">
                Síguenos en redes sociales
              </p>
              <div className="flex space-x-6">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-7 h-7" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-7 h-7" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="w-7 h-7" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/30 mt-8 pt-8 text-center text-white/90">
            <p>&copy; 2024 WichiWi Cafe Kids. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default LandingPage;
