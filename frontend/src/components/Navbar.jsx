import { Search, Bell, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const Navbar = ({ setSidebarOpen, title, subtitle, showSearch = true, }) => {
const { theme, setTheme } = useTheme();
const [mounted, setMounted] = useState(false);



  
  return (
    
    <header className="h-auto lg:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-colors duration-300">

<div className="flex items-center gap-4">

  <button
    onClick={() => setSidebarOpen(true)}
    className="lg:hidden"
  >
   <Menu size={28} className="text-slate-800 dark:text-white" />
  </button>

  <div>
 <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white" >
  {title}
</h1>

<p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
  {subtitle}
</p>
  </div>

</div>

      {/* Right */}
     <div className="flex flex-wrap items-center gap-3">

  {/* Search */}
  {showSearch && (
  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 flex-1 min-w-[220px] lg:w-80">
    <Search size={20} className="text-slate-400" />

    <input
      type="text"
      placeholder="Search jobs..."
      className="bg-transparent outline-none ml-3 w-full text-slate-900 dark:text-white placeholder:text-slate-400"
    />
  </div>
  )}

  {/* Theme */}
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"
>
  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
</button>

  {/* Notification */}
  <button className="relative w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition">
    <Bell size={20} />

    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
  </button>

  {/* Profile */}
  <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">

    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold">
      K
    </div>

    <div>
      <p  className="font-semibold text-slate-900 dark:text-white">Khushi</p>
      <p className="text-xs text-slate-500">
        Software Engineer
      </p>
    </div>

  </div>

</div>

    </header>
    

  );
};

export default Navbar;