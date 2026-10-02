import React, { useEffect, useState } from "react";
import api from "../api";
import "./HighlightsMotivation.css";

export default function HighlightsMotivation({ refresh }) {
    const [topHabit, setTopHabit] = useState(null);
    const [longestStreak, setLongestStreak] = useState(0);
    const [streakHabit, setStreakHabit] = useState(null);
    const [loading, setLoading] = useState(true);

    const calculateLongestStreak = (logs) => {
        const completedDates = logs
            .filter((log) => log.completed && log.logDate)
            .map((log) => log.logDate)
            .sort();

        if (completedDates.length === 0) {
            return 0;
        }

        const uniqueDates = [...new Set(completedDates)];

        let longest = 1;
        let current = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const previous = new Date(`${uniqueDates[i - 1]}T00:00:00`);
            const currentDate = new Date(`${uniqueDates[i]}T00:00:00`);
            const difference = (currentDate - previous) / (1000 * 60 * 60 * 24);

            if (difference === 1) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 1;
            }
        }
        return longest;
    };

    useEffect(() => {
        const loadHighlights = async () => {
            try {
                setLoading(true);
                const habitRes = await api.get("/habits");
                const habits = Array.isArray(habitRes.data) ? habitRes.data : [];

                if (habits.length === 0) {
                    setTopHabit(null);
                    setLongestStreak(0);
                    setStreakHabit(null);
                    return;
                }

                const habitData = await Promise.all(
                    habits.map(async (habit) => {
                        const logRes = await api.get(`/habits/${habit.id}/logs`);
                        const logs = Array.isArray(logRes.data) ? logRes.data : [];
                        const completedCount = logs.filter(
                            (log) => log.completed
                        ).length;
                        const streak = calculateLongestStreak(logs);

                        return {
                            habit,
                            completedCount,
                            streak
                        };
                    })
                );
                const sortedByCompletion = [...habitData].sort(
                    (a, b) => b.completedCount - a.completedCount
                );
                const sortedByStreak = [...habitData].sort(
                    (a, b) => b.streak - a.streak
                );

                const top = sortedByCompletion[0];
                const streak = sortedByStreak[0];

                setTopHabit(top.completedCount > 0 ? top : null);
                setLongestStreak(streak.streak > 0 ? streak.streak : 0);
                setStreakHabit(
                    streak.streak > 0
                        ? streak.habit
                        : null
                );
            } catch (err) {
                console.error("Failed to load highlights", err);
                setTopHabit(null);
                setLongestStreak(0);
                setStreakHabit(null);
            } finally {
                setLoading(false);
            }
        };

        loadHighlights();
    }, [refresh]);

    const getMotivation = () => {
        if (!topHabit && longestStreak === 0) {
            return {
                title: "Start your streak",
                message: "Small consistent actions turn into meaningful progress."
            };
        }

        if (longestStreak >= 30) {
            return {
                title: "Amazing consistency!",
                message: "You've built a habit that keeps showing up. Keep going!"
            };
        }

        if (longestStreak >= 7) {
            return {
                title: "You're on a roll!",
                message: "A full week of consistency is a great foundation."
            };
        }

        if (longestStreak >= 3) {
            return {
                title: "Keep the momentum!",
                message: "You're building consistency one day at a time."
            };
        }

        return {
            title: "Keep showing up!",
            message: "Every completed habit is another step forward."
        };
    };

    const motivation = getMotivation();

    return (
        <section className="highlights">

            <div className="highlights-header">
                <div>
                    <h3>Highlights</h3>
                    <p>Your progress at a glance.</p>
                </div>

                <span className="highlights-icon">
                    ✨
                </span>
            </div>

            {loading ? (
                <div className="highlights-loading">
                    Loading highlights...
                </div>
            ) : (
                <>
                    <div className="highlight-stats">

                        <div className="highlight-stat">
                            <div className="highlight-stat-icon">
                                🏆
                            </div>

                            <div className="highlight-stat-content">
                                <span className="highlight-label">
                                    Most Completed
                                </span>

                                <strong>
                                    {topHabit
                                        ? topHabit.habit.name
                                        : "No completed habits"}
                                </strong>

                                {topHabit && (
                                    <small>
                                        {topHabit.completedCount} completed
                                    </small>
                                )}
                            </div>
                        </div>

                        <div className="highlight-stat">
                            <div className="highlight-stat-icon">🔥</div>
                            <div className="highlight-stat-content">
                                <span className="highlight-label">
                                    Longest Streak
                                </span>
                                <strong>
                                    {longestStreak > 0
                                        ? `${longestStreak} ${longestStreak === 1 ? "day" : "days"}`
                                        : "No streak yet"}
                                </strong>
                                {streakHabit && (
                                    <small>{streakHabit.name}</small>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="motivation">
                        <span className="motivation-mark">💡</span>
                        <div>
                            <strong>{motivation.title}</strong>
                            <p>{motivation.message}</p>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}