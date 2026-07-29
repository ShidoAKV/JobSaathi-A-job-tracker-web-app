import AuthLayout from "../components/auth/AuthLayout";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const data = await loginUser(formData);

    // JWT Token Save
    localStorage.setItem("token", data.token);

    // User Info Save
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login Successful ✅");

    navigate("/dashboard");
  } catch (error) {
    alert(error.response?.data?.message || "Login Failed");
  }
};

 const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
};

  return (
    <AuthLayout>
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-12 hover:shadow-blue-200 transition-all duration-500">
        <h2 className="text-4xl font-extrabold text-slate-800">
          Welcome Back 
        </h2>

        <p className="mt-3 text-slate-500 text-lg">
          Sign in to continue your job search journey.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mt-8">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>

            <div className="flex items-center border border-slate-300 rounded-xl px-4 py-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition">
              <Mail size={20} className="text-slate-400" />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                 className="w-full ml-3 outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>

            <div className="flex items-center border border-slate-300 rounded-xl px-4 py-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 transition">
              <Lock size={20} className="text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                 className="w-full ml-3 outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-slate-400" />
                ) : (
                  <Eye size={20} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between mt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600"
              />

              <span className="text-sm text-slate-600">
                Remember Me
              </span>
            </label>

            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg"
          >
            Sign In
          </button>

          {/* Signup Link */}
          <p className="text-center text-slate-600 mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 font-semibold hover:underline"
            >
              Create Account
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;