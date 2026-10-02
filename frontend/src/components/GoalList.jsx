import React, { useEffect, useState } from "react";
import "./GoalList.css";
import api from "../api";

export default function GoalList({ refresh }) {
    const [goals, setGoals] = useState([]);
    const [habits, setHabits] = useState([]);
    const [habitLogs, setHabitLogs] = useState({});
    const [loading, setLoading] = useState(true);

    const parseCalendarDate = (dateString) => {
        if (!dateString) {
            return null;
        }

        const [year, month, day] = dateString
            .slice(0, 10)
            .split("-")
            .map(Number);

        if (!year || !month || !day) {
            return null;
        }

        return new Date(year, month - 1, day);
    };

    const getGoalDurationDays = (createdAt, deadline) => {
        const startDate = parseCalendarDate(createdAt);
        const endDate = parseCalendarDate(deadline);

        if (!startDate || !endDate) {
            return 0;
        }

        const millisecondsPerDay =
            1000 * 60 * 60 * 24;

        const difference =
            Math.round(
                (endDate.getTime() - startDate.getTime()) /
                    millisecondsPerDay
            ) + 1;

        return Math.max(difference, 1);
    };

    /*
     * Get the Monday of the week containing
     * the supplied date.
     *
     * Week:
     * Monday -> Sunday
     */
    const getStartOfWeek = (date) => {
        const result = new Date(date);
        const day = result.getDay();

        // Sunday = 0
        // Monday = 1
        // ...
        // Saturday = 6

        const daysFromMonday =
            (day + 6) % 7;

        result.setDate(
            result.getDate() - daysFromMonday
        );

        result.setHours(0, 0, 0, 0);

        return result;
    };

    /*
     * Create a unique identifier for the
     * Monday-Sunday week containing a date.
     *
     * Example:
     * 2026-09-16 -> 2026-09-14
     *
     * Therefore every date in that week
     * belongs to the same weekly bucket.
     */
    const getWeekKey = (dateString) => {
        const date = parseCalendarDate(dateString);

        if (!date) {
            return null;
        }

        const weekStart = getStartOfWeek(date);

        const year = weekStart.getFullYear();
        const month = String(
            weekStart.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            weekStart.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    /*
     * Count how many Monday-Sunday weeks are
     * touched by the goal period.
     *
     * Example:
     *
     * Goal:
     * Wednesday Sep 16 -> Tuesday Sep 29
     *
     * Weeks touched:
     * Sep 14
     * Sep 21
     * Sep 28
     *
     * Result = 3 weekly opportunities.
     */
    const getGoalDurationWeeks = (createdAt, deadline) => {
        const startDate = parseCalendarDate(createdAt);
        const endDate = parseCalendarDate(deadline);
        if (!startDate || !endDate) {
            return 0;
        }
        if (endDate < startDate) {
            return 0;
        }

        const startWeek = getStartOfWeek(startDate);
        const endWeek = getStartOfWeek(endDate);
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const difference = Math.round((endWeek.getTime() - startWeek.getTime()) / millisecondsPerDay);
        return (Math.floor(difference / 7) + 1);
    };

    useEffect(() => {
        const fetchGoalData = async () => {
            try {
                setLoading(true);

                const [goalsRes, habitsRes] = await Promise.all([
                    api.get("/goals"),
                    api.get("/habits")
                ]);

                const goalList = goalsRes.data;
                const habitList = habitsRes.data;

                setGoals(goalList);
                setHabits(habitList);

                const goalHabitIds = [...new Set(
                    goalList.flatMap((goal) => goal.targetHabitIds || [])
                )];

                const logResponses = await Promise.all(
                    goalHabitIds.map(async (habitId) => {
                        const response = await api.get(`/habits/${habitId}/logs`);
                        return {
                            habitId,
                            logs: response.data
                        };
                    })
                );

                const logsByHabit = {};

                logResponses.forEach(({habitId, logs}) => {
                    logsByHabit[habitId] = logs;
                });
                setHabitLogs(logsByHabit);
            } catch (err) {
                console.error("Failed to fetch goal data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGoalData();
    }, [refresh]);

    const deleteGoal = async (goalId) => {
        try {
            await api.delete(`/goals/${goalId}`);
            setGoals((prev) => prev.filter(
                (goal) => goal.id !== goalId
            ));
        } catch (err) {
            console.error("Failed to delete Goal", err);
        }
    };

    const getHabitById = (habitId) => {
        return habits.find((habit) => habit.id === habitId);
    };

    /*
     * Calculate overall goal progress
     * according to habit frequency.
     *
     * DAILY:
     *     1 expected completion per day.
     *
     * WEEKLY:
     *     1 expected completion per
     *     Monday-Sunday week.
     *
     * Completed weekly logs are counted
     * by distinct weeks.
     */
    const getGoalProgressData = (goal) => {
        const targetHabitIds = goal.targetHabitIds || [];

        if (
            targetHabitIds.length === 0 || !goal.createdAt || !goal.deadline) {
            return {
                percentage: 0,
                completedCount: 0,
                expectedCount: 0,
                durationDays: 0,
                durationWeeks: 0
            };
        }

        const startDateString = goal.createdAt.slice(0, 10);
        const deadlineString = goal.deadline.slice(0, 10);
        const startDate = parseCalendarDate(startDateString);

        const deadlineDate = parseCalendarDate(deadlineString);

        if (!startDate || !deadlineDate || deadlineDate < startDate) {
            return {
                percentage: 0,
                completedCount: 0,
                expectedCount: 0,
                durationDays: 0,
                durationWeeks: 0
            };
        }

        const durationDays = getGoalDurationDays(startDateString, deadlineString);
        const durationWeeks = getGoalDurationWeeks(startDateString, deadlineString);

        let expectedCount = 0;
        let completedCount = 0;

        targetHabitIds.forEach((habitId) => {
            const habit = getHabitById(habitId);
            const logs = habitLogs[habitId] || [];

            if (habit?.frequency === "DAILY") {
                expectedCount += durationDays;
                logs.forEach((log) => {
                    if (!log.logDate || !log.completed) {
                        return;
                    }
                    const logDate = parseCalendarDate(log.logDate);
                    if (!logDate) {
                        return;
                    }
                    if (logDate >= startDate && logDate <= deadlineDate) {
                        completedCount++;
                    }
                });
                return;
            }

            if (habit?.frequency === "WEEKLY") {
                expectedCount += durationWeeks;
                const completedWeeks = new Set();
                logs.forEach((log) => {
                    if (!log.logDate || !log.completed) {
                        return;
                    }
                    const logDate = parseCalendarDate(log.logDate);
                    if (!logDate) {
                        return;
                    }
                    if (logDate >= startDate && logDate <= deadlineDate) {
                        const weekKey = getWeekKey(log.logDate);
                        if (weekKey) {
                            completedWeeks.add(weekKey);
                        }
                    }
                });
                completedCount += completedWeeks.size;
            }
        });

        const percentage = expectedCount === 0 ? 0
            : Math.min(100, Math.round((completedCount / expectedCount) * 100));

        return {
            percentage,
            completedCount,
            expectedCount,
            durationDays,
            durationWeeks
        };
    };

    const getProgressLevel = (percentage) => {
        if (percentage >= 100) {
            return "complete";
        }
        if (percentage >= 80) {
            return "high";
        }
        if (percentage >= 50) {
            return "medium";
        }
        return "low";
    };

    if (loading) {
        return (
            <div className="goal-section">
                <div className="goal-section-header">
                    <div>
                        <h3 className="goal-heading">
                            Your Goals
                        </h3>

                        <p className="goal-subheading">
                            Keep track of what you're working toward.
                        </p>
                    </div>

                    <span className="goal-count">
                        ...
                    </span>
                </div>

                <div className="goal-loading">
                    Loading goals...
                </div>
            </div>
        );
    }

    return (
        <div className="goal-section">
            <div className="goal-section-header">
                <div>
                    <h3 className="goal-heading">
                        Your Goals
                    </h3>

                    <p className="goal-subheading">
                        Keep track of what you're working toward.
                    </p>
                </div>

                <span className="goal-count">
                    {goals.length}
                </span>
            </div>

            <div className="goal-list">
                {goals.length === 0 && (
                    <div className="goal-empty-state">
                        <span className="goal-empty-icon">
                            🎯
                        </span>

                        <strong>
                            No goals yet
                        </strong>

                        <p>
                            Create a goal to start tracking your progress.
                        </p>
                    </div>
                )}

                {goals.map((goal) => {
                    const targetHabitIds = goal.targetHabitIds || [];
                    const progressData = getGoalProgressData(goal);
                    const progressLevel = getProgressLevel(progressData.percentage);

                    return (
                        <article key={goal.id}
                            className={`goal-item progress-${progressLevel}`}
                        >
                            <div className="goal-header">
                                <h4>{goal.title}</h4>

                                <button type="button" className="delete-goal-btn" onClick={() => deleteGoal(goal.id)}
                                    aria-label={`Delete goal ${goal.title}`} title="Delete goal"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="goal-deadline">
                                <span className="goal-label">
                                    Deadline
                                </span>

                                <span className="goal-value">
                                    {goal.deadline
                                        ? parseCalendarDate(goal.deadline).toDateString()
                                        : "No deadline"}
                                </span>
                            </div>

                            <div className="goal-habits">
                                <div className="goal-habits-header">
                                    <span className="goal-label">
                                        Habits
                                    </span>

                                    {targetHabitIds.length > 0 && (
                                        <span className="goal-habit-count">
                                            {targetHabitIds.length}
                                        </span>
                                    )}
                                </div>

                                {targetHabitIds.length > 0 ? (
                                    <div className="goal-habit-list">
                                        {targetHabitIds.map(
                                            (habitId) => {
                                                const habit = getHabitById(habitId);

                                                return (
                                                    <span key={habitId}
                                                        className="goal-habit-chip"
                                                    >
                                                        {habit ? habit.name : `Habit #${habitId}`}
                                                    </span>
                                                );
                                            }
                                        )}
                                    </div>
                                ) : (
                                    <span className="goal-no-habits">
                                        No habits assigned
                                    </span>
                                )}
                            </div>

                            <div className="goal-progress">
                                <div className="goal-progress-header">
                                    <span className="goal-label">
                                        Overall Progress
                                    </span>

                                    <span className="goal-progress-value">
                                        {progressData.percentage}%
                                    </span>
                                </div>

                                <div className="goal-progress-track">
                                    <div className="goal-progress-fill"
                                        style={{ width: `${progressData.percentage}%` }} />
                                </div>

                                {targetHabitIds.length > 0 && goal.deadline && (
                                    <span className="goal-progress-detail">
                                        {progressData.completedCount}{" "}
                                        of{" "}
                                        {progressData.expectedCount}{" "}
                                        habit completions
                                    </span>
                                )}

                                {targetHabitIds.length > 0 && !goal.deadline && (
                                    <span className="goal-progress-detail">
                                        Add a deadline to track overall progress.
                                    </span>
                                )}
                            </div>

                            <div className={`goal-status ${goal.achieved ? "achieved" : "in-progress"}`}>
                                <span className="goal-label">
                                    Status
                                </span>

                                <span className="goal-status-value">
                                    {goal.achieved ? "✓ Achieved" : "⌛ In Progress"}
                                </span>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}