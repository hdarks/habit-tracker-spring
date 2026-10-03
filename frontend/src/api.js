import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "/api"
});

api.interceptors.request.use((config) => {
    const stored = localStorage.getItem("auth");
    if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;