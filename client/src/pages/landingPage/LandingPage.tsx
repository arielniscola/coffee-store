import {
  Coffee,
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
import { useState } from "react";

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coffee className="w-10 h-10" />
              <h1 className="text-3xl font-bold tracking-tight">
                Café Wichiwi
              </h1>
            </div>
            <ReservationButton onClick={() => setIsModalOpen(true)} />
          </div>
        </nav>
      </header>

      <main>
        <section className="relative h-[600px] overflow-hidden">
          <img
            src="https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Café interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h2 className="text-6xl font-bold mb-4 tracking-tight">
                Bienvenido a WichiWi Café Kids
              </h2>
              <p className="text-2xl mb-8 font-light">
                Donde cada taza cuenta una historia
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl"
              >
                Reservar Mesa
              </button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-amber-900 mb-4">
              Nuestra Historia
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Desde 2010, hemos estado sirviendo el mejor café artesanal de la
              ciudad. Cada grano es seleccionado cuidadosamente y tostado a la
              perfección para ofrecerte una experiencia única en cada sorbo.
            </p>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-amber-900 mb-4">
                Galería
              </h2>
              <div className="w-24 h-1 bg-amber-600 mx-auto mb-8"></div>
              <p className="text-xl text-gray-700">
                Descubre nuestro acogedor espacio
              </p>
            </div>
            <Gallery />
          </div>
        </section>

        <section className="bg-gradient-to-b from-amber-50 to-stone-100 py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-amber-900 mb-4">
                Visítanos
              </h2>
              <div className="w-24 h-1 bg-amber-600 mx-auto mb-8"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="bg-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  Ubicación
                </h3>
                <p className="text-gray-700">
                  Calle Principal 123
                  <br />
                  Centro, Ciudad
                </p>
              </div>
              <div className="text-center">
                <div className="bg-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  Teléfono
                </h3>
                <p className="text-gray-700">
                  +34 123 456 789
                  <br />
                  Lun-Dom: 8AM - 10PM
                </p>
              </div>
              <div className="text-center">
                <div className="bg-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">Email</h3>
                <p className="text-gray-700">
                  info@cafearoma.com
                  <br />
                  reservas@cafearoma.com
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-amber-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-3">
                <Coffee className="w-8 h-8" />
                <span className="text-2xl font-bold">Café Aroma</span>
              </div>
              <p className="text-amber-200">El sabor que te acompaña</p>
            </div>
            <div>
              <p className="text-amber-200 mb-4 text-center md:text-left">
                Síguenos en redes sociales
              </p>
              <div className="flex space-x-6">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition-colors transform hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-7 h-7" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition-colors transform hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-7 h-7" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition-colors transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="w-7 h-7" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-amber-700 mt-8 pt-8 text-center text-amber-200">
            <p>&copy; 2024 Café Aroma. Todos los derechos reservados.</p>
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
