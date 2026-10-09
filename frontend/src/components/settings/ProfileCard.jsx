import { useEffect, useState } from "react";
import { User, Mail, Phone, Link2, Code2 } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../ui/Spinner";
import { getProfile, updateProfile } from "../../services/userService";
import { getErrorMessage } from "../../services/api";
import { getInitials, updateStoredUser } from "../../utils/auth";

const fields = [
  { name: "name", label: "Full name", icon: User, placeholder: "Your name", type: "text" },
  { name: "email", label: "Email", icon: Mail, placeholder: "you@example.com", type: "email" },
  { name: "phone", label: "Phone", icon: Phone, placeholder: "10-digit number", type: "tel" },
  { name: "linkedin", label: "LinkedIn", icon: Link2, placeholder: "https://linkedin.com/in/username", type: "url" },
  { name: "github", label: "GitHub", icon: Code2, placeholder: "https://github.com/username", type: "url", full: true },
];

const ProfileCard = () => {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", linkedin: "", github: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) =>
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          linkedin: data.linkedin || "",
          github: data.github || "",
        })
      )
      .catch((e) => toast.error(getErrorMessage(e, "Failed to load profile")))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(profile);
      updateStoredUser({ name: updated.name, email: updated.email });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card p-6 sm:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center text-xl font-bold">
          {getInitials(profile.name)}
        </div>
        <div>
          <h2 className="card-title">Profile information</h2>
          <p className="text-sm text-fg-muted">Shown to companies when you message them.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map(({ name, label, icon: Icon, placeholder, type, full }) => (
            <div key={name} className={full ? "md:col-span-2" : ""}>
              <label className="label">{label}</label>
              <div className="relative">
                <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
                <input
                  type={type}
                  name={name}
                  value={profile[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  maxLength={name === "phone" ? 10 : undefined}
                  className="input pl-10"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-8">
        <button type="submit" disabled={saving || loading} className="btn-primary">
          {saving ? <Spinner size={16} /> : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default ProfileCard;
