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
  Landmark,
} from "lucide-react";
import { ICompany } from "../../interfaces/company";
import { getCompany, updateCompany } from "../../services/company";
import toast from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string | undefined;
  onChange: (v: string) => void;
  type?: string;
}

const Field = ({ label, icon, value, onChange, type = "text" }: FieldProps) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
      {icon}
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
    />
  </div>
);

const emptyForm: ICompany = {
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
  alias: "",
  accountName: "",
  cuit: "",
};

export function CompanyProfile() {
  const [profile, setProfile] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ICompany>(emptyForm);

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
      if (!res.ack) notify("Perfil actualizado con éxito");
      else throw new Error(res.message);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Perfil de la Compañía
          </h2>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Datos generales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Nombre de la Compañía"
                icon={<Building2 className="w-4 h-4 text-gray-400" />}
                value={formData.companyName}
                onChange={(v) =>
                  setFormData({ ...formData, companyName: v })
                }
              />
              <Field
                label="Email"
                icon={<Mail className="w-4 h-4 text-gray-400" />}
                value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
                type="email"
              />
              <Field
                label="Teléfono"
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                value={formData.cellphone}
                onChange={(v) =>
                  setFormData({ ...formData, cellphone: v })
                }
                type="tel"
              />
              <Field
                label="Dirección"
                icon={<MapPin className="w-4 h-4 text-gray-400" />}
                value={formData.address}
                onChange={(v) => setFormData({ ...formData, address: v })}
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Redes sociales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Instagram"
                icon={<Instagram className="w-4 h-4 text-pink-400" />}
                value={formData.instagram}
                onChange={(v) =>
                  setFormData({ ...formData, instagram: v })
                }
              />
              <Field
                label="Facebook"
                icon={<Facebook className="w-4 h-4 text-blue-500" />}
                value={formData.facebook}
                onChange={(v) =>
                  setFormData({ ...formData, facebook: v })
                }
              />
              <Field
                label="Twitter"
                icon={<Twitter className="w-4 h-4 text-blue-400" />}
                value={formData.twitter}
                onChange={(v) =>
                  setFormData({ ...formData, twitter: v })
                }
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Datos bancarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="CUIT"
                icon={<Landmark className="w-4 h-4 text-gray-400" />}
                value={formData.cuit}
                onChange={(v) => setFormData({ ...formData, cuit: v })}
              />
              <Field
                label="Nombre de la Cuenta"
                icon={<Landmark className="w-4 h-4 text-gray-400" />}
                value={formData.accountName}
                onChange={(v) =>
                  setFormData({ ...formData, accountName: v })
                }
              />
              <Field
                label="Alias"
                icon={<Landmark className="w-4 h-4 text-gray-400" />}
                value={formData.alias}
                onChange={(v) => setFormData({ ...formData, alias: v })}
              />
            </div>
          </section>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-lg font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
