import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Building2, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import Spinner from "../components/ui/Spinner";
import { signupUser } from "../services/authService";
import { getErrorMessage } from "../services/api";

const ACCOUNT_TYPES = [
  { value: "candidate", label: "Job seeker", desc: "Track applications & chat with companies", icon: UserRound },
  { value: "employer", label: "Employer", desc: "Post jobs after admin approval", icon: Building2 },
];

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "candidate",
    company: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.accountType === "employer" && !form.company.trim()) {
      toast.error("Please enter your company name");
      return;
    }

    setLoading(true);
    try {
      await signupUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        accountType: form.accountType,
        company: form.accountType === "employer" ? form.company.trim() : "",
      });
      toast.success(
        form.accountType === "employer"
          ? "Account created. Employer access will be enabled once an admin approves it."
          : "Account created. Please sign in."
      );
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="card p-8 sm:p-10">
        <h1 className="text-2xl font-bold text-fg tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-fg-muted">Free forever. Start tracking in under a minute.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="label">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {ACCOUNT_TYPES.map(({ value, label, desc, icon: Icon }) => {
                const active = form.accountType === value;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setForm({ ...form, accountType: value })}
                    className={`text-left p-3.5 rounded-xl border transition-colors ${
                      active
                        ? "border-primary bg-primary-soft"
                        : "border-line bg-surface-2 hover:border-line-strong"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-primary" : "text-fg-muted"} />
                    <p className={`text-sm font-semibold mt-2 ${active ? "text-primary" : "text-fg"}`}>{label}</p>
                    <p className="text-[11px] text-fg-muted mt-0.5 leading-snug">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <AuthInput label="Full name" icon={User} name="name" value={form.name} onChange={handleChange} placeholder="Your name" autoComplete="name" required />

          {form.accountType === "employer" && (
            <AuthInput label="Company" icon={Building2} name="company" value={form.company} onChange={handleChange} placeholder="Company you hire for" autoComplete="organization" required />
          )}

          <AuthInput label="Email address" icon={Mail} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required />
          <AuthInput label="Password" icon={Lock} type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" autoComplete="new-password" required />
          <AuthInput label="Confirm password" icon={Lock} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" required />

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Spinner size={18} /> : <>Create account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-fg-muted mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Signup;
