import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Palette,
  Trash2,
  Pencil,
  AlertCircle,
  X,
  ImagePlus,
  Loader2,
  CalendarDays,
  Plus,
  Images,
} from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "../../partials/sidebar";
import Header from "../../partials/headers";
import { IWorkshop } from "../../interfaces/workshop";
import {
  createWorkshop,
  deleteWorkshop,
  getWorkshops,
  updateWorkshop,
} from "../../services/workshopService";
import {
  getWorkshopGallery,
  updateWorkshopGallery,
} from "../../services/workshopGalleryService";
import { compressImageToDataUrl } from "../../utils/compressImage";
import { formatShortDate, dayPart } from "../../utils/dates";

const MAX_GALLERY_IMAGES = 12;

const formatPrice = (n: number) =>
  n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

const emptyForm = (): IWorkshop => ({
  date: "",
  title: "",
  description: "",
  priceChild: 0,
  active: true,
});

/**
 * Talleres: días especiales en los que la reserva por niño tiene un precio
 * propio. Las imágenes son generales (una galería informativa para todos los
 * talleres), no una por taller.
 */
export default function Workshops() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [workshops, setWorkshops] = useState<IWorkshop[]>([]);
  const [form, setForm] = useState<IWorkshop>(emptyForm());
  const [formOpen, setFormOpen] = useState(false);

  // Galería general de talleres (informativa, se muestra en la landing).
  // Se guarda automáticamente al agregar/quitar imágenes.
  const [gallery, setGallery] = useState<string[]>([]);
  const [gallerySaving, setGallerySaving] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [ws, imgs] = await Promise.all([
        getWorkshops(),
        getWorkshopGallery(),
      ]);
      setWorkshops(ws);
      setGallery(imgs);
      setError(null);
    } catch (e) {
      console.error("Error loading workshops:", e);
      setError("No se pudieron cargar los talleres.");
    } finally {
      setLoading(false);
    }
  }

  const startCreate = () => {
    setForm(emptyForm());
    setFormOpen(true);
  };

  const startEdit = (w: IWorkshop) => {
    setForm({ ...w, date: dayPart(w.date) });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setForm(emptyForm());
    setFormOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const res = form._id
        ? await updateWorkshop(form)
        : await createWorkshop(form);
      if (res.ack) {
        toast.error(res.message || "No se pudo guardar el taller");
        return;
      }
      toast.success(form._id ? "Taller actualizado" : "Taller creado");
      closeForm();
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar el taller");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w: IWorkshop) => {
    if (!w._id || busyId) return;
    if (!window.confirm(`¿Eliminar el taller "${w.title}"?`)) return;
    try {
      setBusyId(w._id);
      const res = await deleteWorkshop(w._id);
      if (res.ack) {
        toast.error(res.message || "No se pudo eliminar el taller");
        return;
      }
      toast.success("Taller eliminado");
      if (form._id === w._id) closeForm();
      await loadData();
    } catch (e) {
      toast.error("Error al eliminar el taller");
    } finally {
      setBusyId("");
    }
  };

  // Persiste la galería al instante. Si falla, revierte al estado anterior.
  const persistGallery = async (images: string[]) => {
    const prev = gallery;
    setGallery(images);
    try {
      setGallerySaving(true);
      const res = await updateWorkshopGallery(images);
      if (res.ack) {
        toast.error(res.message || "No se pudo guardar la galería");
        setGallery(prev);
        return;
      }
      toast.success("Galería actualizada");
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar la galería");
      setGallery(prev);
    } finally {
      setGallerySaving(false);
    }
  };

  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_GALLERY_IMAGES - gallery.length;
    if (room <= 0) {
      toast.error(`Máximo ${MAX_GALLERY_IMAGES} imágenes`);
      return;
    }
    try {
      const selected = Array.from(files).slice(0, room);
      const dataUrls = await Promise.all(
        selected.map((f) => compressImageToDataUrl(f)),
      );
      await persistGallery([...gallery, ...dataUrls]);
      if (files.length > room) {
        toast.error(`Solo se agregaron ${room} (máximo ${MAX_GALLERY_IMAGES})`);
      }
    } catch (e) {
      console.error(e);
      toast.error("No se pudo procesar la imagen");
    } finally {
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (index: number) => {
    if (gallerySaving) return;
    persistGallery(gallery.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
              </div>
            ) : (
              <div className="max-w-3xl pb-32">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        Talleres
                      </h2>
                      <p className="text-sm text-gray-500">
                        Días especiales con precio de niño propio y una galería
                        informativa en la página pública
                      </p>
                    </div>
                  </div>
                  {!formOpen && (
                    <button
                      type="button"
                      onClick={startCreate}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo taller
                    </button>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 mb-5">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm text-red-700">{error}</div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Galería general de talleres */}
                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
                  <header className="bg-gradient-to-r from-blue-300 to-pink-300 text-white p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                        <Images className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Galería de talleres</h3>
                        <p className="text-xs text-white/80">
                          Imágenes generales que se muestran en la página
                          pública (informativas, para todos los talleres)
                        </p>
                      </div>
                    </div>
                    {gallerySaving && (
                      <span className="inline-flex items-center gap-2 text-sm text-white/90">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando…
                      </span>
                    )}
                  </header>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-3">
                      {gallery.map((img, i) => (
                        <div
                          key={i}
                          className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 group"
                        >
                          <img
                            src={img}
                            alt={`Taller ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(i)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                            aria-label={`Quitar imagen ${i + 1}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {gallery.length < MAX_GALLERY_IMAGES && (
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-300 hover:bg-pink-50 text-gray-400 hover:text-pink-400 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <ImagePlus className="w-6 h-6" />
                          <span className="text-[10px]">Agregar</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleGalleryFiles(e.target.files)}
                    />
                    <p className="text-xs text-gray-400 mt-3">
                      Se comprimen automáticamente y se guardan al instante.
                      Hasta {MAX_GALLERY_IMAGES} imágenes.
                      {gallery.length === 0
                        ? " Todavía no cargaste imágenes."
                        : ""}
                    </p>
                  </div>
                </section>

                {formOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
                    <header className="sticky top-0 z-10 bg-gradient-to-r from-pink-300 to-blue-300 text-white p-4 flex items-center justify-between rounded-t-2xl">
                      <h3 className="font-semibold">
                        {form._id ? "Editar taller" : "Nuevo taller"}
                      </h3>
                      <button
                        type="button"
                        onClick={closeForm}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        aria-label="Cerrar formulario"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </header>
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha *
                          </label>
                          <input
                            type="date"
                            required
                            value={form.date}
                            onChange={(e) =>
                              setForm({ ...form, date: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio por niño *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              $
                            </span>
                            <input
                              type="number"
                              required
                              min="0"
                              step="any"
                              value={form.priceChild}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  priceChild: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full pl-7 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.title}
                          placeholder="Ej: Taller de pintura con las manos"
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción
                        </label>
                        <textarea
                          rows={3}
                          value={form.description}
                          placeholder="Qué van a hacer los niños, edades sugeridas, qué incluye..."
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.active !== false}
                          onChange={(e) =>
                            setForm({ ...form, active: e.target.checked })
                          }
                          className="rounded border-gray-300 text-pink-400 focus:ring-pink-400"
                        />
                        Taller activo (aplica el precio y aparece en fechas
                        especiales)
                      </label>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={closeForm}
                          disabled={saving}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white py-2.5 rounded-lg font-bold hover:from-pink-300 hover:to-blue-300 transition-all disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Guardando...
                            </>
                          ) : form._id ? (
                            "Guardar cambios"
                          ) : (
                            "Crear taller"
                          )}
                        </button>
                      </div>
                    </form>
                    </div>
                  </div>
                )}

                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">
                      Talleres programados
                    </h3>
                    <span className="text-xs font-medium text-white bg-pink-400 rounded-full px-2 py-0.5">
                      {workshops.length}
                    </span>
                  </div>
                  <div className="p-5">
                    {workshops.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <Palette className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        Todavía no hay talleres cargados.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {workshops.map((w) => (
                          <li
                            key={w._id}
                            className={`flex items-center gap-4 p-3 rounded-lg border ${
                              w.active === false
                                ? "border-gray-200 bg-gray-50 opacity-70"
                                : "border-pink-100 bg-pink-50/50"
                            }`}
                          >
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-pink-200 to-blue-200 flex items-center justify-center flex-shrink-0">
                              <Palette className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">
                                {w.title}
                                {w.active === false && (
                                  <span className="ml-2 text-[10px] uppercase tracking-wide bg-gray-200 text-gray-500 rounded-full px-2 py-0.5">
                                    Inactivo
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {formatShortDate(w.date)}
                                <span className="text-pink-500 font-semibold ml-2">
                                  ${formatPrice(w.priceChild)} por niño
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(w)}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                aria-label={`Editar ${w.title}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={busyId === w._id}
                                onClick={() => handleDelete(w)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                aria-label={`Eliminar ${w.title}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
