import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const AuthInput = ({ label, icon: Icon, type = "text", ...props }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
        )}
        <input
          type={isPassword && show ? "text" : type}
          className={`input ${Icon ? "pl-10" : ""} ${isPassword ? "pr-11" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthInput;
