import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        const storedTheme = localStorage.getItem("theme");

        if (storedTheme === "dark") {
            return true;
        }

        if (storedTheme === "light") {
            return false;
        }

        return false;
    });

    useEffect(() => {
        document.body.classList.toggle("dark-theme", darkMode);

        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode((current) => !current);
    };

    return (
        <ThemeContext.Provider
            value={{
                darkMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}