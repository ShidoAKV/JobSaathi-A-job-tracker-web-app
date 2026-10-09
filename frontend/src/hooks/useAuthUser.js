import { useEffect, useState } from "react";
import { getStoredUser } from "../utils/auth";

/** Returns the logged-in user from localStorage and re-renders on auth changes. */
export default function useAuthUser() {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener("jobsaathi:auth", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("jobsaathi:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return user;
}
