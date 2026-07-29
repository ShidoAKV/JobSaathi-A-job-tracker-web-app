import { Search, Plus } from "lucide-react";

const SearchBar = ({
  setOpenModal,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-slate-900/30 p-5 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between transition-colors duration-300">

      {/* Search */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 flex-1">

        <Search
          size={20}
          className="text-slate-400 dark:text-slate-300"
        />

        <input
          type="text"
          placeholder="Search by company, role or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ml-3 w-full bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

      </div>

      {/* Right Section */}
      <div className="flex gap-3 flex-wrap">

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-5 py-3 outline-none"
        >
          <option value="All">All Status</option>
          <option value="Applied">Applied</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-xl hover:scale-105 transition"
        >
          <Plus size={18} />
          Add Job
        </button>

      </div>

    </div>
  );
};

export default SearchBar;