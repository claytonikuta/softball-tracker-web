import { useTheme } from "@/context/ThemeContext";
import styles from "./layout.module.css";

import { ReactNode } from "react";

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* Your existing header content */}

        <button
          onClick={toggleDarkMode}
          className={styles.themeToggle}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>

      <main>{children}</main>
    </div>
  );
};

export default Layout;
