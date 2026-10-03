import React, { useEffect, useState } from "react";
import api from "../api";
import "./AnalyticsGrid.css";

export default function AnalyticsGrid({ refresh }) {
    const [todayProgress, setTodayProgress] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [completedThisMonth, setCompletedThisMonth] = useState(0);
    const [completionRate, setCompletionRate] = useState(0);
    const [totalHabits, setTotalHabits] = useState(0);

    const getTodayDate = () => {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const fetchAnalytics = async () => {
        try {
            const habitResponse = await api.get("/habits");

            const habits = Array.isArray(habitResponse.data)
                ? habitResponse.data
                : [];

            setTotalHabits(habits.length);

            if (habits.length === 0) {
                setTodayProgress(0);
                setCurrentStreak(0);
                setCompletedThisMonth(0);
                setCompletionRate(0);
                return;
            }

            const today = new Date();
            const todayDate = getTodayDate();

            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();

            const logResponses = await Promise.all(
                habits.map((habit) =>
                    api.get(`/habits/${habit.id}/logs`)
                )
            );

            const allLogs = [];

            logResponses.forEach((response) => {
                const logs = Array.isArray(response.data)
                    ? response.data
                    : [];

                logs.forEach((log) => {
                    if (log.logDate) {
                        allLogs.push({
                            ...log,
                            completed: Boolean(log.completed)
                        });
                    }
                });
            });

            /*
             * -----------------------------------------
             * TODAY'S PROGRESS
             * -----------------------------------------
             */

            const todayCompleted = allLogs.filter(
                (log) =>
                    log.logDate === todayDate &&
                    log.completed
            ).length;

            const todayProgressValue = Math.round(
                (todayCompleted / habits.length) * 100
            );

            setTodayProgress(todayProgressValue);


            /*
             * -----------------------------------------
             * COMPLETED THIS MONTH
             * -----------------------------------------
             */

            const monthLogs = allLogs.filter((log) => {
                const [year, month] =
                    log.logDate.split("-").map(Number);

                return (
                    year === currentYear &&
                    month === currentMonth + 1 &&
                    log.completed
                );
            });

            setCompletedThisMonth(monthLogs.length);


            /*
             * -----------------------------------------
             * COMPLETION RATE
             * -----------------------------------------
             */

            const daysElapsed = today.getDate();

            let expectedOccurrences = 0;

            habits.forEach((habit) => {
                if (habit.frequency === "WEEKLY") {
                    expectedOccurrences += Math.ceil(
                        daysElapsed / 7
                    );
                } else {
                    expectedOccurrences += daysElapsed;
                }
            });

            const completionRateValue =
                expectedOccurrences === 0
                    ? 0
                    : Math.min(
                          100,
                          Math.round(
                              (monthLogs.length /
                                  expectedOccurrences) *
                                  100
                          )
                      );

            setCompletionRate(completionRateValue);


            /*
             * -----------------------------------------
             * CURRENT STREAK
             * -----------------------------------------
             */

            const completedDates = new Set(
                allLogs
                    .filter((log) => log.completed)
                    .map((log) => log.logDate)
            );

            let streak = 0;

            const streakDate = new Date(today);

            while (true) {
                const year = streakDate.getFullYear();

                const month = String(
                    streakDate.getMonth() + 1
                ).padStart(2, "0");

                const day = String(
                    streakDate.getDate()
                ).padStart(2, "0");

                const dateKey =
                    `${year}-${month}-${day}`;

                if (!completedDates.has(dateKey)) {
                    break;
                }

                streak++;

                streakDate.setDate(
                    streakDate.getDate() - 1
                );
            }

            setCurrentStreak(streak);

        } catch (err) {
            console.error(
                "Failed to fetch analytics",
                err
            );

            setTodayProgress(0);
            setCurrentStreak(0);
            setCompletedThisMonth(0);
            setCompletionRate(0);
            setTotalHabits(0);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);


    return (
        <div className="analytics-grid">

            {/* Header */}

            <div className="analytics-header">
                <h2>Analytics</h2>

                <span className="analytics-overview">
                    Overview
                </span>
            </div>


            {/* 2 × 2 Analytics */}

            <div className="analytics-boxes">

                {/* Today's Progress */}

                <div className="analytics-box">
                    <div className="analytics-icon progress-icon">
                        ✓
                    </div>

                    <span className="analytics-label">
                        Today's Progress
                    </span>

                    <span className="analytics-value">
                        {todayProgress}%
                    </span>

                    <span className="analytics-unit">
                        {Math.round(
                            (todayProgress / 100) *
                            totalHabits
                        )}{" "}
                        / {totalHabits} habits
                    </span>
                </div>


                {/* Current Streak */}

                <div className="analytics-box">
                    <div className="analytics-icon streak-icon">
                        ⚡
                    </div>

                    <span className="analytics-label">
                        Current Streak
                    </span>

                    <span className="analytics-value">
                        {currentStreak}
                    </span>

                    <span className="analytics-unit">
                        {currentStreak === 1
                            ? "day"
                            : "days"}
                    </span>
                </div>


                {/* Completed This Month */}

                <div className="analytics-box">
                    <div className="analytics-icon month-icon">
                        ✓
                    </div>

                    <span className="analytics-label">
                        Completed This Month
                    </span>

                    <span className="analytics-value">
                        {completedThisMonth}
                    </span>

                    <span className="analytics-unit">
                        completed habits
                    </span>
                </div>


                {/* Completion Rate */}

                <div className="analytics-box">
                    <div className="analytics-icon rate-icon">
                        ◎
                    </div>

                    <span className="analytics-label">
                        Completion Rate
                    </span>

                    <span className="analytics-value">
                        {completionRate}%
                    </span>

                    <span className="analytics-unit">
                        this month
                    </span>
                </div>

            </div>

        </div>
    );
}