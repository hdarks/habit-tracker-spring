import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        const stored = localStorage.getItem('auth');

        if (!stored) {
            return null;
        }

        try {
            return JSON.parse(stored);
        } catch {
            localStorage.removeItem('auth');
            return null;
        }
    });

    useEffect(() => {
        if (auth) {
            localStorage.setItem('auth', JSON.stringify(auth));
        } else {
            localStorage.removeItem('auth');
        }
    }, [auth]);

    const login = async (credentials) => {
        const res = await api.post('/users/login', credentials);
        const user = res.data;
        setAuth(user);
        return user;
    };

    const register = async (credentials) => {
        const res = await api.post('/users/register', credentials);
        return res.data;
    };

    const logout = () => {
        setAuth(null);
    };

    return (
        <AuthContext.Provider value={{ auth, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);