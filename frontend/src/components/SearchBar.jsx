import { Search, Plus } from "lucide-react";

const SearchBar = ({
  setOpenModal,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  total,
}) => (
  <div className="card p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
    <div className="relative flex-1">
      <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
      <input
        type="text"
        placeholder="Search by company, role or location…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input pl-10"
      />
    </div>

    <div className="flex gap-3 items-center">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="input w-auto"
      >
        <option value="All">All statuses</option>
        <option value="Applied">Applied</option>
        <option value="Interview">Interview</option>
        <option value="Offer">Offer</option>
        <option value="Rejected">Rejected</option>
      </select>

      {typeof total === "number" && (
        <span className="hidden sm:inline text-sm text-fg-muted whitespace-nowrap">
          {total} application{total === 1 ? "" : "s"}
        </span>
      )}

      <button onClick={() => setOpenModal(true)} className="btn-primary whitespace-nowrap">
        <Plus size={16} />
        Add application
      </button>
    </div>
  </div>
);

export default SearchBar;
