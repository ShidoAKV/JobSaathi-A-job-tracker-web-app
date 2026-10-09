import { useEffect, useState } from "react";
import { Briefcase, ExternalLink, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import { deleteListingAdmin, getAdminListings } from "../../services/adminService";
import { getErrorMessage } from "../../services/api";

const ListingsTable = ({ onChanged }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    getAdminListings()
      .then(setListings)
      .catch((e) => toast.error(getErrorMessage(e, "Failed to load listings")))
      .finally(() => setLoading(false));
  }, []);

  const term = search.trim().toLowerCase();
  const visible = listings.filter(
    (l) =>
      !term ||
      l.company.toLowerCase().includes(term) ||
      l.role.toLowerCase().includes(term) ||
      (l.postedBy?.email || "").toLowerCase().includes(term)
  );

  const remove = async (l) => {
    if (!window.confirm(`Remove "${l.role}" at ${l.company}? Related conversations will be deleted too.`)) return;
    setBusyId(l._id);
    try {
      await deleteListingAdmin(l._id);
      setListings((prev) => prev.filter((x) => x._id !== l._id));
      onChanged?.();
      toast.success("Listing removed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove listing"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, role or poster email"
          className="input pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Briefcase} title="No listings" compact />
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-fg-muted border-b border-line">
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Company</th>
                <th className="px-4 py-2.5 font-semibold">Posted by</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Posted</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((l) => (
                <tr key={l._id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-semibold text-fg">{l.role}</td>
                  <td className="px-4 py-3 text-fg-muted">{l.company}</td>
                  <td className="px-4 py-3">
                    <p className="text-fg">{l.postedBy?.name || "—"}</p>
                    <p className="text-xs text-fg-muted">{l.postedBy?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{l.type}</td>
                  <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                    {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {l.applyLink && (
                        <a href={l.applyLink} target="_blank" rel="noreferrer" className="icon-btn w-8 h-8" title="Open link">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => remove(l)}
                        disabled={busyId === l._id}
                        className="icon-btn w-8 h-8 text-danger"
                        title="Remove listing"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListingsTable;
