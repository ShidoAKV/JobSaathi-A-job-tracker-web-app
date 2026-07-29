import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";




const SecurityCard = () => {
    const [passwords, setPasswords] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const [showCurrent, setShowCurrent] = useState(false);
const [showNew, setShowNew] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);

const handleChange = (e) => {
  setPasswords({
    ...passwords,
    [e.target.name]: e.target.value,
  });
};

const handleUpdate = () => {

  if (
    !passwords.currentPassword ||
    !passwords.newPassword ||
    !passwords.confirmPassword
  ) {
    toast.error("Please fill all fields");
    return;
  }

  if (passwords.newPassword.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }

  if (passwords.newPassword !== passwords.confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  toast.success("Password Updated Successfully");

  setPasswords({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
};
    
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-slate-900/30 p-8 transition-colors duration-300">

      <div className="flex items-center gap-3 mb-8">
        <Lock className="text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Security
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6">

        <div>
          <label className="font-medium text-slate-700 dark:text-slate-300">
            Current Password
          </label>

          <div className="relative">

  <input
    type={showCurrent ? "text" : "password"}
    name="currentPassword"
    value={passwords.currentPassword}
    onChange={handleChange}
    placeholder="••••••••"
    className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
  />

  <button
    type="button"
    onClick={() => setShowCurrent(!showCurrent)}
   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition"
  >
    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>

</div>
        </div>

        <div>
          <label className="font-medium text-slate-700 dark:text-slate-300">
            New Password
          </label>

          <div className="relative">

  <input
    type={showNew ? "text" : "password"}
    name="newPassword"
    value={passwords.newPassword}
    onChange={handleChange}
    placeholder="••••••••"
    className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
  />

  <button
    type="button"
    onClick={() => setShowNew(!showNew)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition"
  >
    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>

</div>
        </div>

        <div>
          <label className="font-medium text-slate-700 dark:text-slate-300">
            Confirm Password
          </label>

         <div className="relative">

  <input
    type={showConfirm ? "text" : "password"}
    name="confirmPassword"
    value={passwords.confirmPassword}
    onChange={handleChange}
    placeholder="••••••••"
    className="w-full mt-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
  />

  <button
    type="button"
    onClick={() => setShowConfirm(!showConfirm)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition"
  >
    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>

</div>
        </div>

      </div>

      <div className="flex justify-end mt-8">

<button
  type="button"
  onClick={handleUpdate}
  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:scale-105 transition-all duration-300"
>
  Update Password
</button>

      </div>

    </div>
  );
};

export default SecurityCard;