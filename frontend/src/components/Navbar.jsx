import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ role }) {
    const { auth, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    if (!auth?.token) return null;

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <h2>Habit Tracker</h2>
            </div>

            <div className="nav-right">
                {role === "USER" && (
                    <>
                        <Link to="/">Dashboard</Link>
                        <Link to="/">Goals</Link>
                    </>
                )}

                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    type="button"
                    aria-label={
                        darkMode
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                    }
                    title={
                        darkMode
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                    }
                >
                    {darkMode ? "☀️ Light" : "🌙 Dark"}
                </button>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}