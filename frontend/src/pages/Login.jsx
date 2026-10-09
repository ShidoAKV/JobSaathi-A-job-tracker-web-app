import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import Spinner from "../components/ui/Spinner";
import { loginUser } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { storeSession } from "../utils/auth";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(form);
      storeSession(data);
      toast.success(`Welcome back, ${data.user?.name?.split(" ")[0] || "there"}!`);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="card p-8 sm:p-10">
        <h1 className="text-2xl font-bold text-fg tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-fg-muted">
          Continue your job search where you left off.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <AuthInput
            label="Email address"
            icon={Mail}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <AuthInput
            label="Password"
            icon={Lock}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Spinner size={18} /> : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-fg-muted mt-6">
          New to JobSaathi?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
