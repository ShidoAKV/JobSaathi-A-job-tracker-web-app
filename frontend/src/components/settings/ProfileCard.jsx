import { useState } from "react";
import { User, Camera } from "lucide-react";
import toast from "react-hot-toast";

const ProfileCard = () => {
const [image, setImage] = useState(null);

const handleImage = (e) => {
  const file = e.target.files[0];

  if (file) {
    setImage(URL.createObjectURL(file));
  }
};
const [profile, setProfile] = useState({
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
});

const handleChange = (e) => {
  setProfile({
    ...profile,
    [e.target.name]: e.target.value,
  });
};
const handleSave = () => {
  if (!profile.name || !profile.email) {
    toast.error("Name and Email are required");
    return;
  }

  toast.success("Profile Updated Successfully");

  console.log(profile);
};
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-slate-900/30 p-8 transition-colors duration-300">

      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">
        Profile Information
      </h2>

      {/* Profile Image */}

<div className="flex justify-center mb-10">
<div className="relative">

  <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-blue-100 dark:border-slate-600 overflow-hidden flex items-center justify-center">

    {image ? (
      <img
        src={image}
        alt="Profile"
        className="w-full h-full object-cover"
      />
    ) : (
      <User
        size={60}
        className="text-slate-400"
      />
    )}

  </div>

  <label
    className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition"
  >
    <Camera size={18} />

    <input
      type="file"
      accept="image/*"
      hidden
      onChange={handleImage}
    />
  </label>

</div>

      </div>

      {/* Form */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label className="block font-medium text-slate-700 mb-2">
            Full Name
          </label>

         <input
          type="text"
           name="name"
           value={profile.name}
           onChange={handleChange}
           placeholder="Khushi"
            className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-2">
            Email
          </label>

          <input
             type="email"
             name="email"
             value={profile.email}
             onChange={handleChange}
             placeholder="khushi@gmail.com"
             className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-2">
            Phone Number
          </label>

          <input
           type="tel"
            name="phone"
            value={profile.phone}
             onChange={handleChange}
             maxLength={10}
             placeholder="9876543210"
             className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-2">
            LinkedIn
          </label>

          <input
           type="url"
           name="linkedin"
           value={profile.linkedin}
           onChange={handleChange}
           placeholder="https://linkedin.com/in/username"
           className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
           />
        </div>

        <div className="md:col-span-2">
          <label className="block font-medium text-slate-700 mb-2">
            GitHub
          </label>

          <input
            type="url"
           name="github"
           value={profile.github}
           onChange={handleChange}
            placeholder="https://github.com/username"
            className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
           />
        </div>

      </div>

      <div className="flex justify-end mt-8">

        <button
        onClick={handleSave}
         className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:scale-105 transition"
         >
       Save Changes
      </button>

      </div>

    </div>
  );
};

export default ProfileCard;