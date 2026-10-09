import { useEffect } from "react";
import { getProfile } from "../services/userService";
import { onSocket } from "../services/socket";
import { updateStoredUser } from "../utils/auth";

/**
 * Keeps the cached user (role, employer-request status, company) in sync with the server.
 * Runs on mount and whenever the server pushes a system notification (e.g. request approved),
 * so role changes take effect without re-logging in.
 */
export default function useProfileSync() {
  useEffect(() => {
    let active = true;

    const sync = async () => {
      try {
        const p = await getProfile();
        if (!active || !p) return;
        updateStoredUser({
          name: p.name,
          email: p.email,
          role: p.role,
          recruiterRequest: p.recruiterRequest,
          company: p.company,
        });
      } catch {
        /* 401 is handled by the api interceptor */
      }
    };

    sync();
    const off = onSocket("notification:new", (n) => {
      if (n?.type === "system") sync();
    });

    return () => {
      active = false;
      off();
    };
  }, []);
}
