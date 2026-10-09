import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import AuthInput from "../auth/AuthInput";
import Spinner from "../ui/Spinner";
import { changePassword } from "../../services/userService";
import { getErrorMessage } from "../../services/api";

const SecurityCard = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Password updated");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="card p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-success-soft text-success flex items-center justify-center">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h2 className="card-title">Security</h2>
          <p className="text-sm text-fg-muted">Change your account password.</p>
        </div>
      </div>

      <div className="space-y-5">
        <AuthInput label="Current password" icon={Lock} type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} placeholder="••••••••" autoComplete="current-password" />
        <AuthInput label="New password" icon={Lock} type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} placeholder="At least 6 characters" autoComplete="new-password" />
        <AuthInput label="Confirm new password" icon={Lock} type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} placeholder="Repeat new password" autoComplete="new-password" />
      </div>

      <div className="flex justify-end mt-8">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner size={16} /> : "Update password"}
        </button>
      </div>
    </form>
  );
};

export default SecurityCard;
