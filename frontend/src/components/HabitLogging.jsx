import React, { useCallback, useEffect, useRef, useState } from "react";
import "./HabitLogging.css";
import api from "../api";

export default function HabitLogging({ onLogging, refresh }) {
const [habits, setHabits] = useState([]);
const [error, setError] = useState("");
const [selectedWeeklyHabit, setSelectedWeeklyHabit] = useState(null);

const habitListRef = useRef(null);

const getTodayDate = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}, []);

const parseDate = useCallback((dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}, []);

const getStartOfWeek = useCallback((date) => {
    const result = new Date(date);
    const day = result.getDay();
    const daysFromMonday = (day + 6) % 7;

    result.setDate(result.getDate() - daysFromMonday);
    result.setHours(0, 0, 0, 0);
    return result;
}, []);

const getEndOfWeek = useCallback((date) => {
    const result = getStartOfWeek(date);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);

    return result;
}, [getStartOfWeek]);

const isDateInCurrentWeek = useCallback((dateString) => {
    if (!dateString) {
        return false;
    }

    const date = parseDate(dateString);
    const today = new Date();
    const weekStart = getStartOfWeek(today);
    const weekEnd = getEndOfWeek(today);

    return (date >= weekStart && date <= weekEnd);
}, [parseDate, getStartOfWeek, getEndOfWeek]);

const formatDisplayDate = (dateString) => {
    if (!dateString) {
        return "";
    }

    const date = parseDate(dateString);
    return date.toLocaleDateString("default", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
};

const getWeekRangeLabel = () => {
    const today = new Date();

    const weekStart = getStartOfWeek(today);
    const weekEnd = getEndOfWeek(today);
    const startLabel = weekStart.toLocaleDateString("default", {
        month: "short",
        day: "numeric"
    });

    const endLabel = weekEnd.toLocaleDateString("default", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return `${startLabel} – ${endLabel}`;
};

const loadHabits = useCallback(async () => {
    try {
        setError("");

        const res = await api.get("/habits");
        const habitList = res.data;
        const today = getTodayDate();
        const habitsWithStatus = await Promise.all(
            habitList.map(async (habit) => {
                const logRes = await api.get(`/habits/${habit.id}/logs`);
                const logs = logRes.data;
                let activeLog = null;
                if (habit.frequency === "DAILY") {
                    // Daily habits are completed once per day.
                    activeLog = logs.find((log) => log.logDate === today);
                } else {
                    // Weekly habits are completed once
                    // during the Monday-Sunday week.
                    activeLog = logs.find(
                        (log) => isDateInCurrentWeek(log.logDate) && log.completed
                    );
                }

                return {
                    ...habit,
                    completedToday: activeLog?.completed || false,
                    todayLogId: activeLog?.id || null,
                    weeklyCompletedDate:
                        habit.frequency === "WEEKLY" && activeLog?.completed ? activeLog.logDate : null
                };
            })
        );
        setHabits(habitsWithStatus);
    } catch (err) {
        console.error("Failed to fetch Habits", err);
        setError("Failed to fetch Habits");
    }
}, [getTodayDate, isDateInCurrentWeek]);

useEffect(() => {
    loadHabits();
}, [loadHabits, refresh]);

useEffect(() => {
    if (!selectedWeeklyHabit) {
        return;
    }

    const handleEscape = (event) => {
        if (event.key === "Escape") {
            setSelectedWeeklyHabit(null);
        }
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
        document.removeEventListener("keydown", handleEscape);
    };
}, [selectedWeeklyHabit]);

const toggleHabit = async (habitId, completed, todayLogId) => {
    try {
        setError("");
        const today = getTodayDate();
        const habit = habits.find((item) => item.id === habitId);

        if (!habit) {
            return;
        }

        let logId = todayLogId;
        if (habit.frequency === "DAILY") {
            if (todayLogId) {
                await api.put(`/habit-logs/${todayLogId}`, {
                    logDate: today,
                    completed
                });
            } else {
                const res = await api.post(`/habits/${habitId}/logs`, {
                    logDate: today,
                    completed
                });
                logId = res.data?.id || null;
            }
        } else {
            if (todayLogId) {
                await api.put(`/habit-logs/${todayLogId}`, {
                    logDate: habits.find((item) => item.id === habitId)?.todayLogId ? undefined : today,
                    completed
                });
            } else {
                const res = await api.post(`/habits/${habitId}/logs`, {
                    logDate: today,
                    completed
                });
                logId = res.data?.id || null;
            }
        }

        setHabits((prev) => prev.map((item) =>
            item.id === habitId ? {
                ...item,
                completedToday: completed,
                todayLogId: logId,
                weeklyCompletedDate: item.frequency === "WEEKLY" && completed
                    ? today
                    : item.frequency === "WEEKLY"
                        ? null
                        : item.weeklyCompletedDate
            } : item
        ));
        onLogging && onLogging();
    } catch (err) {
        console.error("Failed to Log Habit", err);
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to Log Habit");
    }
};

const deleteHabit = async (habitId) => {
    try {
        setError("");
        await api.delete(`/habits/${habitId}`);

        setHabits((prev) => prev.filter(
            (habit) => habit.id !== habitId
        ));

        if (selectedWeeklyHabit?.id === habitId) {
            setSelectedWeeklyHabit(null);
        }
        onLogging && onLogging();
    } catch (err) {
        console.error("Failed to delete Habit", err);
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to delete Habit");
    }
};

const openWeeklyHistory = (habit) => {
    if (habit.frequency !== "WEEKLY") {
        return;
    }
    setSelectedWeeklyHabit(habit);
};

const closeWeeklyHistory = () => {
    setSelectedWeeklyHabit(null);
};

const scrollHabits = (direction) => {
    if (!habitListRef.current) {
        return;
    }

    const amount = 80;
    habitListRef.current.scrollBy({
        top: direction === "up" ? -amount : amount,
        behavior: "smooth"
    });
};

const completedCount = habits.filter(
    (habit) => habit.completedToday
).length;

return (
    <>
        <div className="habit-logging">

            <div className="habit-section-header">
                <div>
                    <h2>Today's Habits</h2>

                    <p>
                        Stay consistent with your daily routine.
                    </p>
                </div>

                <div className="habit-count">
                    {completedCount} / {habits.length}
                </div>
            </div>

            {habits.length === 0 ? (
                <div className="empty-habits">

                    <div className="empty-habits-icon">
                        ✓
                    </div>

                    <h3>No habits yet</h3>

                    <p>
                        Create your first habit to start
                        tracking your progress.
                    </p>

                </div>
            ) : (
                <>
                    <div
                        className="habit-list"
                        ref={habitListRef}
                    >
                        {habits.map((habit) => (
                            <div
                                key={habit.id}
                                className={`habit-log-row ${
                                    habit.completedToday
                                        ? "completed"
                                        : ""
                                }`}
                            >
                                <label className="habit-log-item">

                                    <input
                                        type="checkbox"
                                        checked={
                                            habit.completedToday
                                        }
                                        onChange={(e) =>
                                            toggleHabit(
                                                habit.id,
                                                e.target.checked,
                                                habit.todayLogId
                                            )
                                        }
                                    />

                                    <span className="habit-info">

                                        <span className="habit-name">
                                            {habit.name}
                                        </span>

                                        <span className="habit-frequency">
                                            {habit.frequency ===
                                            "DAILY"
                                                ? "Daily"
                                                : "Weekly"}
                                        </span>

                                    </span>

                                </label>

                                <div className="habit-row-actions">

                                    {habit.frequency ===
                                        "WEEKLY" && (
                                        <button
                                            type="button"
                                            className="weekly-history-btn"
                                            onClick={() =>
                                                openWeeklyHistory(
                                                    habit
                                                )
                                            }
                                            aria-label={`View weekly history for ${habit.name}`}
                                            title="View weekly completion"
                                        >
                                            ⓘ
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteHabit(
                                                habit.id
                                            )
                                        }
                                        className="delete-habit-btn"
                                        aria-label={`Delete ${habit.name}`}
                                        title="Delete habit"
                                    >
                                        ×
                                    </button>

                                </div>
                            </div>
                        ))}
                    </div>

                    {habits.length > 4 && (
                        <div className="habit-scroll-controls">

                            <button
                                type="button"
                                onClick={() =>
                                    scrollHabits(
                                        "up"
                                    )
                                }
                                aria-label="Previous habits"
                            >
                                ↑
                            </button>

                            <span>
                                Scroll to view more
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    scrollHabits(
                                        "down"
                                    )
                                }
                                aria-label="Next habits"
                            >
                                ↓
                            </button>

                        </div>
                    )}
                </>
            )}

            {habits.length > 0 && (
                <div className="habit-footer">

                    <span>
                        {completedCount ===
                        habits.length
                            ? "All habits completed today 🎉"
                            : `${
                                  habits.length -
                                  completedCount
                              } habit${
                                  habits.length -
                                      completedCount ===
                                  1
                                      ? ""
                                      : "s"
                              } remaining`}
                    </span>

                </div>
            )}

            {error && (
                <p className="error">
                    {error}
                </p>
            )}
        </div>

        {selectedWeeklyHabit && (
            <div
                className="weekly-history-overlay"
                onClick={closeWeeklyHistory}
            >
                <div
                    className="weekly-history-modal"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >
                    <div className="weekly-history-header">

                        <div>
                            <h3>
                                {selectedWeeklyHabit.name}
                            </h3>

                            <p>
                                Weekly Habit
                            </p>
                        </div>

                        <button
                            type="button"
                            className="weekly-history-close"
                            onClick={
                                closeWeeklyHistory
                            }
                            aria-label="Close weekly history"
                        >
                            ×
                        </button>

                    </div>

                    <div className="weekly-history-week">

                        <span>
                            Current week
                        </span>

                        <strong>
                            {getWeekRangeLabel()}
                        </strong>

                    </div>

                    <div
                        className={`weekly-history-status ${
                            selectedWeeklyHabit.weeklyCompletedDate
                                ? "completed"
                                : "not-completed"
                        }`}
                    >

                        <div className="weekly-history-status-icon">
                            {selectedWeeklyHabit.weeklyCompletedDate
                                ? "✓"
                                : "○"}
                        </div>

                        <div className="weekly-history-status-content">

                            <strong>
                                {selectedWeeklyHabit.weeklyCompletedDate
                                    ? "Completed this week"
                                    : "Not completed yet"}
                            </strong>

                            <span>
                                {selectedWeeklyHabit.weeklyCompletedDate
                                    ? formatDisplayDate(
                                          selectedWeeklyHabit.weeklyCompletedDate
                                      )
                                    : "Complete this habit once before the week ends."}
                            </span>

                        </div>

                    </div>

                    <div className="weekly-history-footer">
                        Weekly habits can be completed once
                        during the Monday–Sunday week.
                    </div>

                </div>
            </div>
        )}
    </>
);

}