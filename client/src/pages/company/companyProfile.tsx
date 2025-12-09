import { useState, useEffect } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import { ICompany } from "../../interfaces/company";
import { getCompany, updateCompany } from "../../services/company";
import toast, { Toaster } from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

export function CompanyProfile() {
  const [profile, setProfile] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ICompany>({
    code: "",
    companyName: "",
    address: "",
    companyNumber: "",
    type: "",
    cellphone: "",
    active: true,
    instagram: "",
    facebook: "",
    twitter: "",
    email: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = (await getCompany()) as ICompany;
      if (data) {
        setProfile(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await updateCompany(formData);
      if (!res.ack) {
        notify("Perfil actualizado con éxito");
      } else {
        throw new Error(res.message);
      }
      loadProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      notifyError("Error al actualizar el perfil: " + error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            Perfil de la Compañía
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Compañía
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Teléfono
              </label>
              <input
                type="tel"
                value={formData.cellphone}
                onChange={(e) =>
                  setFormData({ ...formData, cellphone: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Facebook className="w-4 h-4" /> Facebook
              </label>
              <input
                type="url"
                value={formData.facebook}
                onChange={(e) =>
                  setFormData({ ...formData, facebook: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Instagram className="w-4 -4" /> Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Twitter className="w-4 h-4" /> Twitter
              </label>
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) =>
                  setFormData({ ...formData, twitter: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
