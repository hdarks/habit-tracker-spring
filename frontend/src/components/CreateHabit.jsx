import React, { useState } from "react";
import "./CreateHabit.css";
import api from "../api";

export default function CreateHabit({ onCreated, onClose }) {
    const [name, setName] = useState("");
    const [frequency, setFrequency] = useState("DAILY");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/habits", {
                name,
                frequency
            });

            onCreated && onCreated(res.data);

            setName("");
            setFrequency("DAILY");
        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Failed to create Habit"
            );
        }
    };

    return (
        <div className="habit-modal-overlay">
            <div className="habit-modal">
                <button className="close-button" onClick={onClose}>
                    ❌
                </button>

                <h3>Create a Habit</h3>

                <form onSubmit={handleSubmit}>
                    <label>
                        Add Name

                        <input
                            type="text"
                            placeholder="Habit Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Frequency

                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                        >
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="create-button"
                    >
                        Add Habit
                    </button>

                    {error && (
                        <p className="error">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}