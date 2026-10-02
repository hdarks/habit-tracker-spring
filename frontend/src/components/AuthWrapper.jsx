import { useState } from "react";
import LoginComponent from "./LoginComponent";
import RegisterComponent from "./RegisterComponent";
import "./auth.css";

export default function AuthWrapper() {
    const [isLogin, setIsLogin] = useState(true);

    const toggleAuthMode = () => {
        setIsLogin((prev) => !prev);
    };

    return (
        <div className={`auth-page ${isLogin ? "login-mode" : "register-mode"}`}>
            {/* Illustration / Branding */}
            <div className="auth-visual">
                <img
                    src={
                        isLogin
                            ? "/habittrack-login-illustration.png"
                            : "/habittrack-register-illustration.png"
                    }
                    alt={
                        isLogin
                            ? "Habit tracking illustration"
                            : "Create your HabitTrack account"
                    }
                    className="auth-illustration"
                />

                <div className="auth-visual-content">
                    <div className="auth-brand">
                        Habit<span>Track</span>
                    </div>

                    <h1>
                        {isLogin
                            ? "Build better habits, one day at a time."
                            : "Start building better habits today."}
                    </h1>

                    <p>
                        {isLogin
                            ? "Stay consistent, track your progress, and keep moving toward your goals."
                            : "Create your account and turn your daily routines into lasting progress."}
                    </p>
                </div>
            </div>

            {/* Authentication Form */}
            <div className="auth-panel">
                <div className="auth-panel-inner">
                    {isLogin ? (
                        <LoginComponent />
                    ) : (
                        <RegisterComponent />
                    )}

                    <div className="auth-switch">
                        <span>
                            {isLogin
                                ? "Don't have an account?"
                                : "Already have an account?"}
                        </span>

                        <button
                            type="button"
                            className="auth-switch-button"
                            onClick={toggleAuthMode}
                        >
                            {isLogin ? "Create an account" : "Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}