import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "jobsaathi-theme";
const THEMES = ["dark", "light"];

const ThemeContext = createContext({ theme: "dark", setTheme: () => {}, toggleTheme: () => {} });

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : "dark";
  } catch {
    return "dark";
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  THEMES.forEach((t) => root.classList.remove(t));
  root.classList.add(theme);
  root.style.colorScheme = theme;
};

/** Dark-first theme provider. Persists the choice and toggles the `dark` / `light` class on <html>. */
export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore private-mode storage errors */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (THEMES.includes(next)) setThemeState(next);
  }, []);

  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
