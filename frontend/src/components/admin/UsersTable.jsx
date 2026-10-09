import { useCallback, useEffect, useState } from "react";
import { Check, Search, Trash2, UserCheck, X } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import useAuthUser from "../../hooks/useAuthUser";
import {
  deleteUserAdmin,
  getAdminUsers,
  handleRecruiterRequest,
  setUserRole,
} from "../../services/adminService";
import { getErrorMessage } from "../../services/api";
import { getInitials, roleLabel } from "../../utils/auth";

const roleTone = {
  candidate: "badge bg-surface-3 text-fg-muted",
  recruiter: "badge bg-info-soft text-info",
  admin: "badge bg-danger-soft text-danger",
};

const requestTone = {
  pending: "badge bg-warning-soft text-warning",
  approved: "badge bg-success-soft text-success",
  rejected: "badge bg-danger-soft text-danger",
};

/** mode="requests" lists pending employer requests; mode="all" lists everyone with role controls. */
const UsersTable = ({ mode, onChanged }) => {
  const me = useAuthUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = mode === "requests" ? { request: "pending" } : { search, role };
      setUsers(await getAdminUsers(params));
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [mode, search, role]);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  const patch = (updated) => {
    setUsers((prev) =>
      mode === "requests"
        ? prev.filter((u) => u._id !== updated._id)
        : prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u))
    );
    onChanged?.();
  };

  const review = async (user, action) => {
    setBusyId(user._id);
    try {
      const updated = await handleRecruiterRequest(user._id, action);
      patch(updated);
      toast.success(action === "approve" ? `${user.name} is now an employer` : "Request declined");
    } catch (error) {
      toast.error(getErrorMessage(error, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (user, nextRole) => {
    if (nextRole === user.role) return;
    setBusyId(user._id);
    try {
      const updated = await setUserRole(user._id, nextRole);
      patch(updated);
      toast.success(`${user.name} is now ${roleLabel(nextRole).toLowerCase()}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to change role"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name} (${user.email}) and all their data? This cannot be undone.`)) return;
    setBusyId(user._id);
    try {
      await deleteUserAdmin(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      onChanged?.();
      toast.success("User deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete user"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {mode === "all" && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="input pl-10"
            />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input w-auto">
            <option value="">All roles</option>
            <option value="candidate">Job seekers</option>
            <option value="recruiter">Employers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={mode === "requests" ? "No pending requests" : "No users found"}
          description={mode === "requests" ? "Employer access requests will show up here." : "Try another search."}
          compact
        />
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-fg-muted border-b border-line">
                <th className="px-4 py-2.5 font-semibold">User</th>
                <th className="px-4 py-2.5 font-semibold">Company</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Request</th>
                <th className="px-4 py-2.5 font-semibold">Joined</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const isMe = u._id === me?.id;
                const busy = busyId === u._id;
                return (
                  <tr key={u._id} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-3 text-fg flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-fg truncate">
                            {u.name} {isMe && <span className="text-xs text-fg-subtle">(you)</span>}
                          </p>
                          <p className="text-xs text-fg-muted truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{u.company || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={roleTone[u.role] || roleTone.candidate}>{roleLabel(u.role)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.recruiterRequest && u.recruiterRequest !== "none" ? (
                        <span className={requestTone[u.recruiterRequest]}>{u.recruiterRequest}</span>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                      {u.createdAt ? format(new Date(u.createdAt), "d MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {u.recruiterRequest === "pending" && (
                          <>
                            <button
                              onClick={() => review(u, "approve")}
                              disabled={busy}
                              className="btn-primary px-3 py-1.5 text-xs"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => review(u, "reject")}
                              disabled={busy}
                              className="btn-secondary px-3 py-1.5 text-xs"
                            >
                              <X size={14} /> Decline
                            </button>
                          </>
                        )}
                        {mode === "all" && !isMe && (
                          <>
                            <select
                              value={u.role}
                              disabled={busy}
                              onChange={(e) => changeRole(u, e.target.value)}
                              className="input w-auto py-1.5 text-xs"
                              title="Change role"
                            >
                              <option value="candidate">Job seeker</option>
                              <option value="recruiter">Employer</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => remove(u)}
                              disabled={busy}
                              className="icon-btn w-8 h-8 text-danger"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
