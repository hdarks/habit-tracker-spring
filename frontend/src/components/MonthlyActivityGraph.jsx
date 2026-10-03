import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import "./MonthlyActivityGraph.css";
import api from "../api";

export default function MonthlyActivityGraph({ refresh }) {
    const [data, setData] = useState([]);
    const [totalHabits, setTotalHabits] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState(
        new Date()
    );
    const [loading, setLoading] = useState(false);

    const getRegistrationDate = () => {
        try {
            const stored = localStorage.getItem("auth");

            if (!stored) {
                return null;
            }

            const auth = JSON.parse(stored);

            if (!auth?.createdAt) {
                return null;
            }

            return auth.createdAt.slice(0, 10);
        } catch (err) {
            console.error(
                "Failed to read registration date",
                err
            );

            return null;
        }
    };


    /*
     * -----------------------------------------
     * DATE HELPERS
     * -----------------------------------------
     */

    const formatDate = (date) => {
        const [year, month, day] =
            date.split("-").map(Number);

        const dateObject = new Date(
            year,
            month - 1,
            day
        );

        return dateObject.toLocaleDateString(
            "default",
            {
                month: "short",
                day: "numeric"
            }
        );
    };

    /*
     * -----------------------------------------
     * CURRENT MONTH
     * -----------------------------------------
     */

    const today = new Date();

    const currentMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    /*
     * -----------------------------------------
     * REGISTRATION MONTH
     * -----------------------------------------
     */

    const registrationDate = getRegistrationDate();

    const registrationMonth = registrationDate
        ? (() => {
              const [
                  year,
                  month
              ] = registrationDate
                  .split("-")
                  .map(Number);

              return new Date(
                  year,
                  month - 1,
                  1
              );
          })()
        : null;


    /*
     * -----------------------------------------
     * NAVIGATION
     * -----------------------------------------
     */

    const canGoToPreviousMonth =
        !registrationMonth ||
        selectedMonth > registrationMonth;

    const canGoToNextMonth =
        selectedMonth < currentMonth;


    const goToPreviousMonth = () => {
        if (!canGoToPreviousMonth) {
            return;
        }

        setSelectedMonth(
            new Date(
                selectedMonth.getFullYear(),
                selectedMonth.getMonth() - 1,
                1
            )
        );
    };


    const goToNextMonth = () => {
        if (!canGoToNextMonth) {
            return;
        }

        setSelectedMonth(
            new Date(
                selectedMonth.getFullYear(),
                selectedMonth.getMonth() + 1,
                1
            )
        );
    };


    /*
     * -----------------------------------------
     * LOAD MONTHLY ACTIVITY
     * -----------------------------------------
     */

    useEffect(() => {
        const fetchMonthlyActivity = async () => {
            try {
                setLoading(true);
                const year = selectedMonth.getFullYear();
                const month = selectedMonth.getMonth();
                const habitRes = await api.get("/habits");
                const habits = Array.isArray(habitRes.data) ? habitRes.data : [];

                setTotalHabits(habits.length);
                if (habits.length === 0) {
                    setData([]);
                    return;
                }
                /*
                 * -----------------------------------------
                 * FETCH LOGS
                 * -----------------------------------------
                 */

                const logResponses = await Promise.all(habits.map((habit) => api.get(`/habits/${habit.id}/logs`)));
                const dailyMap = {};
                /*
                 * -----------------------------------------
                 * BUILD MONTH DATA
                 * -----------------------------------------
                 */

                logResponses.forEach(
                    (response) => {
                        const logs = Array.isArray(response.data) ? response.data : [];
                        logs.forEach((log) => {
                            if (!log.logDate || !log.completed) {
                                return;
                            }

                            const dateKey = log.logDate.slice(0, 10);
                            const [logYear, logMonth] = dateKey.split("-").map(Number);

                            /*
                             * Only logs belonging to
                             * the selected month.
                             */

                            if (logYear !== year || logMonth !== month + 1) {
                                return;
                            }
                            /*
                             * Never show activity from
                             * before registration.
                             */

                            if (registrationDate && dateKey < registrationDate) {
                                return;
                            }

                            if (!dailyMap[dateKey]) {
                                dailyMap[dateKey] = 0;
                            }
                            dailyMap[dateKey]++;
                        })
                    }
                );
                /*
                 * -----------------------------------------
                 * CREATE EVERY DAY OF SELECTED MONTH
                 * -----------------------------------------
                 */

                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const formatted = [];
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const beforeRegistration = registrationDate && dateKey < registrationDate;

                    formatted.push({
                        date: dateKey,
                        completedCount:beforeRegistration
                            ? null
                            : dailyMap[dateKey] || 0
                    });
                }
                setData(formatted);
            } catch (err) {
                console.error("Error fetching monthly activity", err);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyActivity();
    }, [
        selectedMonth,
        registrationDate,
        refresh
    ]);


    /*
     * -----------------------------------------
     * MONTH LABEL
     * -----------------------------------------
     */

    const monthlyLabel =
        selectedMonth.toLocaleString(
            "default",
            {
                month: "long",
                year: "numeric"
            }
        );


    /*
     * -----------------------------------------
     * TOOLTIP
     * -----------------------------------------
     */

    const CustomTooltip = ({
        active,
        payload,
        label
    }) => {
        if (
            !active ||
            !payload ||
            !payload.length ||
            payload[0].value === null
        ) {
            return null;
        }

        return (
            <div className="activity-tooltip">
                <strong>
                    {formatDate(label)}
                </strong>

                <span>
                    {payload[0].value}{" "}
                    {payload[0].value === 1
                        ? "habit"
                        : "habits"}{" "}
                    completed
                </span>
            </div>
        );
    };


    /*
     * -----------------------------------------
     * MONTH TOTAL
     * -----------------------------------------
     */

    const completedTotal =
        data.reduce(
            (total, item) =>
                total +
                (item.completedCount ?? 0),
            0
        );


    /*
     * -----------------------------------------
     * RENDER
     * -----------------------------------------
     */

    return (
        <div className="chart-container">

            <div className="chart-header">

                <div className="chart-title">
                    <h3>
                        Monthly Activity
                    </h3>
                </div>


                <div className="chart-month-navigation">

                    <button
                        type="button"
                        onClick={
                            goToPreviousMonth
                        }
                        disabled={
                            !canGoToPreviousMonth
                        }
                        aria-label="Previous month"
                    >
                        ‹
                    </button>


                    <strong>
                        {monthlyLabel}
                    </strong>


                    <button
                        type="button"
                        onClick={
                            goToNextMonth
                        }
                        disabled={
                            !canGoToNextMonth
                        }
                        aria-label="Next month"
                    >
                        ›
                    </button>

                </div>


                <span className="chart-summary">
                    {completedTotal} completed
                </span>

            </div>


            {loading ? (
                <div className="empty-state">
                    Loading activity...
                </div>
            ) : data.length === 0 ? (
                <div className="empty-state">
                    No activity yet. Log your habits
                    to see progress.
                </div>
            ) : (
                <div className="activity-chart">

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <LineChart
                            data={data}
                            margin={{
                                top: 8,
                                right: 16,
                                left: 0,
                                bottom: 0
                            }}
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />


                            <XAxis
                                dataKey="date"
                                tickFormatter={
                                    formatDate
                                }
                                interval={
                                    data.length > 28
                                        ? 2
                                        : data.length >
                                          14
                                        ? 1
                                        : 0
                                }
                                tick={{
                                    fontSize: 11
                                }}
                                tickLine={false}
                                axisLine={false}
                            />


                            <YAxis
                                domain={[
                                    0,
                                    Math.max(
                                        totalHabits,
                                        1
                                    )
                                ]}
                                allowDecimals={false}
                                width={28}
                                tick={{
                                    fontSize: 11
                                }}
                                tickLine={false}
                                axisLine={false}
                            />


                            <Tooltip
                                content={
                                    <CustomTooltip />
                                }
                                cursor={{
                                    strokeDasharray:
                                        "4 4"
                                }}
                            />


                            <Line
                                type="monotone"
                                dataKey="completedCount"
                                stroke="#2445b8"
                                strokeWidth={3}
                                connectNulls={false}
                                dot={(props) => {
                                    const {
                                        cx,
                                        cy,
                                        payload
                                    } = props;

                                    if (
                                        payload.completedCount ===
                                            0 ||
                                        payload.completedCount ===
                                            null
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={5}
                                            fill="#ffffff"
                                            stroke="#2445b8"
                                            strokeWidth={
                                                3
                                            }
                                        />
                                    );
                                }}
                                activeDot={{
                                    r: 7
                                }}
                            />

                        </LineChart>
                    </ResponsiveContainer>

                </div>
            )}

        </div>
    );
}