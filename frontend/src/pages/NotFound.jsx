import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { isAuthenticated } from "../utils/auth";

const NotFound = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center p-6">
    <div className="card p-10 max-w-md w-full text-center animate-rise">
      <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-5">
        <Compass size={26} />
      </div>
      <h1 className="text-2xl font-bold text-fg">Page not found</h1>
      <p className="text-fg-muted mt-2">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to={isAuthenticated() ? "/dashboard" : "/login"}
        className="btn-primary mt-6"
      >
        Go home
      </Link>
    </div>
  </div>
);

export default NotFound;
