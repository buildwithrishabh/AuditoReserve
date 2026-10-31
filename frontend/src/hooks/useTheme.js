import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return (
      document.documentElement.getAttribute("data-theme") ||
      localStorage.getItem("ar-theme") ||
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ar-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, isDark: theme === "dark", toggleTheme, setTheme };
}

