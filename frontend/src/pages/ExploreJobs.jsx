import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Compass, SlidersHorizontal, Lock, Clock } from "lucide-react";
import toast from "react-hot-toast";
import ListingCard from "../components/listings/ListingCard";
import PostJobModal from "../components/listings/PostJobModal";
import EmptyState from "../components/ui/EmptyState";
import useAuthUser from "../hooks/useAuthUser";
import { getListings, deleteListing } from "../services/listingService";
import { startConversation } from "../services/conversationService";
import { getErrorMessage } from "../services/api";
import { canPostJobs, isAdmin } from "../utils/auth";

const TYPES = ["All", "Full-time", "Part-time", "Internship", "Contract", "Remote"];

const ExploreJobs = () => {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get("highlight");

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [onlyMine, setOnlyMine] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [connectingId, setConnectingId] = useState(null);

  const allowedToPost = canPostJobs(user);
  const requestPending = user?.recruiterRequest === "pending";

  const load = async () => {
    try {
      setListings(await getListings());
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load jobs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!highlight || loading) return;
    const el = document.getElementById(`listing-${highlight}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight, loading]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesTerm =
        !term ||
        l.company.toLowerCase().includes(term) ||
        l.role.toLowerCase().includes(term) ||
        (l.location || "").toLowerCase().includes(term) ||
        (l.skills || []).some((s) => s.toLowerCase().includes(term));
      const matchesType = type === "All" || l.type === type;
      const matchesMine = !onlyMine || l.postedBy?._id === user?.id;
      return matchesTerm && matchesType && matchesMine;
    });
  }, [listings, search, type, onlyMine, user]);

  const handleConnect = async (listing) => {
    setConnectingId(listing._id);
    try {
      const conversation = await startConversation(listing._id);
      navigate(`/messages?c=${conversation._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not start conversation"));
    } finally {
      setConnectingId(null);
    }
  };

  const handleDelete = async (listing) => {
    if (!window.confirm(`Remove the ${listing.role} listing at ${listing.company}?`)) return;
    try {
      await deleteListing(listing._id);
      setListings((prev) => prev.filter((l) => l._id !== listing._id));
      toast.success("Listing removed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove listing"));
    }
  };

  const PostControl = () => {
    if (allowedToPost) {
      return (
        <button onClick={() => setPostOpen(true)} className="btn-primary whitespace-nowrap">
          <Plus size={16} /> Post a job
        </button>
      );
    }
    if (requestPending) {
      return (
        <span className="btn-secondary cursor-default whitespace-nowrap text-warning border-warning/30 bg-warning-soft">
          <Clock size={15} /> Employer access pending
        </span>
      );
    }
    return (
      <button
        onClick={() => navigate("/settings")}
        className="btn-secondary whitespace-nowrap"
        title="Only approved employers can post jobs"
      >
        <Lock size={15} /> Request employer access
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, companies, skills or locations…"
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="input w-auto pl-9">
              {TYPES.map((t) => (
                <option key={t} value={t}>{t === "All" ? "All types" : t}</option>
              ))}
            </select>
          </div>

          {allowedToPost && (
            <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
                className="accent-[var(--primary)] w-4 h-4"
              />
              My listings
            </label>
          )}

          <PostControl />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-fg-muted">
        <span>{loading ? "Loading…" : `${filtered.length} open role${filtered.length === 1 ? "" : "s"}`}</span>
        <span className="hidden sm:inline">Newest first</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Compass}
            title={listings.length === 0 ? "No jobs listed yet" : "No jobs match your filters"}
            description={
              listings.length === 0
                ? allowedToPost
                  ? "Be the first to post a role. Every member gets notified instantly."
                  : "Check back soon, employers are onboarding."
                : "Try a different keyword or clear the filters."
            }
            action={
              listings.length === 0 && allowedToPost ? (
                <button onClick={() => setPostOpen(true)} className="btn-primary">
                  <Plus size={16} /> Post a job
                </button>
              ) : listings.length > 0 ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setType("All");
                    setOnlyMine(false);
                  }}
                  className="btn-secondary"
                >
                  Clear filters
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filtered.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              isOwner={listing.postedBy?._id === user?.id}
              canModerate={isAdmin(user)}
              highlighted={listing._id === highlight}
              connecting={connectingId === listing._id}
              onConnect={handleConnect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {allowedToPost && (
        <PostJobModal
          open={postOpen}
          onClose={() => setPostOpen(false)}
          defaultCompany={user?.company || ""}
          onCreated={(listing) => setListings((prev) => [listing, ...prev])}
        />
      )}
    </div>
  );
};

export default ExploreJobs;
