import { useState } from "react";
import { BadgeCheck, Building2, Clock, ShieldCheck, UserRound, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../ui/Spinner";
import useAuthUser from "../../hooks/useAuthUser";
import { requestRecruiterAccess } from "../../services/userService";
import { getErrorMessage } from "../../services/api";
import { canPostJobs, isAdmin, roleLabel, updateStoredUser } from "../../utils/auth";

/**
 * Shows the user's role and lets job seekers request employer (recruiter) access.
 * Admins approve requests from the Admin page.
 */
const AccountTypeCard = () => {
  const user = useAuthUser();
  const [company, setCompany] = useState(user?.company || "");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!company.trim()) {
      toast.error("Please enter your company name");
      return;
    }
    setSaving(true);
    try {
      const updated = await requestRecruiterAccess(company.trim());
      updateStoredUser({
        role: updated.role,
        recruiterRequest: updated.recruiterRequest,
        company: updated.company,
      });
      toast.success("Request sent. An admin will review it shortly.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not send request"));
    } finally {
      setSaving(false);
    }
  };

  const status = user?.recruiterRequest || "none";

  const RoleIcon = isAdmin(user) ? ShieldCheck : canPostJobs(user) ? Building2 : UserRound;

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
          <RoleIcon size={20} />
        </div>
        <div>
          <h2 className="card-title">Account type</h2>
          <p className="text-sm text-fg-muted">Controls what you can do on JobSaathi.</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-line">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Current role</p>
          <p className="font-semibold text-fg mt-0.5">{roleLabel(user?.role)}</p>
          {user?.company && <p className="text-sm text-fg-muted">{user.company}</p>}
        </div>
        <span className="badge bg-primary-soft text-primary">{user?.role || "candidate"}</span>
      </div>

      <ul className="mt-4 text-sm text-fg-muted space-y-1.5">
        <li>• Job seekers track applications, browse listings and message companies.</li>
        <li>• Employers can additionally post job listings and receive candidate messages.</li>
        <li>• Admins review employer requests and moderate listings.</li>
      </ul>

      {!canPostJobs(user) && (
        <div className="mt-6 pt-6 border-t border-line">
          {status === "pending" ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-soft text-warning">
              <Clock size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Employer access requested</p>
                <p className="text-sm opacity-90">
                  Your request for <span className="font-medium">{user?.company}</span> is awaiting admin
                  approval. You'll get a notification once it's reviewed.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              {status === "rejected" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-soft text-danger mb-4">
                  <XCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-sm">
                    Your previous request was declined. You can submit a new one with updated details.
                  </p>
                </div>
              )}
              <label className="label">Request employer access</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company you hire for"
                  className="input"
                  maxLength={80}
                />
                <button type="submit" disabled={saving} className="btn-primary whitespace-nowrap">
                  {saving ? <Spinner size={16} /> : <><BadgeCheck size={16} /> Send request</>}
                </button>
              </div>
              <p className="text-xs text-fg-subtle mt-2">
                Only approved employers can post jobs, which keeps the board free of spam.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountTypeCard;
