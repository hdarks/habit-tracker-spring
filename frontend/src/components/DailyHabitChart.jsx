import React, { useEffect, useState } from "react";
import api from "../api";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function DailyHabitChart({ refresh }) {
    const [completedToday, setCompletedToday] = useState(0);
    const [totalHabits, setTotalHabits] = useState(0);

    const getTodayDate = () => {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchTodayHabits = async () => {
            try {
                const res = await api.get("/habits");
                const habits = Array.isArray(res.data) ? res.data : [];

                setTotalHabits(habits.length);

                const today = getTodayDate();

                const logResponses = await Promise.all(
                    habits.map((habit) =>
                        api.get(`/habits/${habit.id}/logs`)
                    )
                );

                let completed = 0;

                logResponses.forEach((response) => {
                    const logs = response.data;

                    const todayLog = logs.find(
                        (log) => log.logDate === today
                    );

                    if (todayLog?.completed) {
                        completed++;
                    }
                });

                setCompletedToday(completed);
            } catch (err) {
                console.error("Error loading daily habits", err);
                setCompletedToday(0);
                setTotalHabits(0);
            }
        };

        fetchTodayHabits();
    }, [refresh]);

    const percentage =
        totalHabits === 0
            ? 0
            : Math.round((completedToday / totalHabits) * 100);

    return (
        <div className="chart-container">
            <h3>Today's Habits</h3>

            {totalHabits === 0 ? (
                <p className="empty-state">
                    No Habits yet. Create one to start tracking progress.
                </p>
            ) : (
                <div style={{ width: 200, margin: "0 auto" }}>
                    <CircularProgressbar
                        value={percentage}
                        text={`${percentage}%`}
                        styles={buildStyles({
                            textSize: "16px",
                            pathColor: "#4caf50",
                            textColor: "#333",
                            trailColor: "#eee",
                            strokeLinecap: "round"
                        })}
                    />
                </div>
            )}
        </div>
    );
}