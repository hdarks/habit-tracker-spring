import React, { useEffect, useState } from "react";
import "./CreateGoal.css";
import api from "../api";

export default function CreateGoal({ onCreated, onClose }) {
    const [title, setTitle] = useState("");
    const [deadline, setDeadline] = useState("");
    const [habits, setHabits] = useState([]);
    const [selectedHabits, setSelectedHabits] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHabits = async () => {
            try {
                const res = await api.get("/habits");
                setHabits(res.data);
            } catch (err) {
                console.error("Failed to load Habits", err);
            }
        };

        fetchHabits();
    }, []);

    const toggleHabit = (habitId) => {
        setSelectedHabits((prev) =>
            prev.includes(habitId)
                ? prev.filter((id) => id !== habitId)
                : [...prev, habitId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/goals", {
                title,
                deadline: deadline || null,
                targetHabitIds: selectedHabits
            });

            onCreated && onCreated(res.data);

            setTitle("");
            setDeadline("");
            setSelectedHabits([]);
        } catch (err) {
            console.error("Failed to create goal", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to create goal"
            );
        }
    };

    return (
        <div className="goal-modal-overlay">
            <div className="goal-modal">
                <button
                    className="close-button"
                    onClick={onClose}
                >
                    ❌
                </button>

                <h3>Create Goal</h3>

                <form onSubmit={handleSubmit}>
                    <label>
                        Goal Title

                        <input
                            type="text"
                            placeholder="Goal Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Deadline

                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </label>

                    <h4>Select Habits</h4>

                    <div className="habit-list">
                        {habits.length === 0 && (
                            <p>
                                No habits yet. Create one first!!!
                            </p>
                        )}

                        {habits.map((habit) => (
                            <label
                                key={habit.id}
                                className="habit-checkbox"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedHabits.includes(habit.id)}
                                    onChange={() =>
                                        toggleHabit(habit.id)
                                    }
                                />

                                {habit.name}
                            </label>
                        ))}
                    </div>

                    <button type="submit" className="create-button">
                        Create Goal
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