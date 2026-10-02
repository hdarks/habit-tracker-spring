import React, { useEffect, useState } from "react";
import api from "../api";
import "./Calendar.css";

export default function Calendar({ refresh }) {
const [currentDate, setCurrentDate] = useState(new Date());
const [habits, setHabits] = useState([]);
const [logs, setLogs] = useState([]);
const [loading, setLoading] = useState(true);
const [selectedDate, setSelectedDate] = useState(null);

const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

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
        console.error("Failed to read registration date", err);
        return null;
    }
};

useEffect(() => {
    const fetchCalendarData = async () => {
        try {
            setLoading(true);
            const habitResponse = await api.get("/habits");
            const habitList = Array.isArray(habitResponse.data) ? habitResponse.data : [];
            setHabits(habitList);

            if (habitList.length === 0) {
                setLogs([]);
                return;
            }

            const logResponses = await Promise.all(
                habitList.map((habit) => api.get(`/habits/${habit.id}/logs`))
            );

            const allLogs = [];
            logResponses.forEach((response, index) => {
                const habit = habitList[index];
                const habitLogs = Array.isArray(response.data) ? response.data : [];

                habitLogs.forEach((log) => {
                    if (log.logDate) {
                        allLogs.push({
                            habitId: habit.id,
                            logDate: log.logDate.slice(0, 10),
                            completed: Boolean(log.completed)
                        });
                    }
                });
            });
            setLogs(allLogs);
        } catch (err) {
            console.error("Failed to fetch calendar data", err);
            setHabits([]);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };
    fetchCalendarData();
}, [refresh]);

useEffect(() => {
    if (!selectedDate) {
        return;
    }
    const handleEscape = (event) => {
        if (event.key === "Escape") {
            setSelectedDate(null);
        }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
        document.removeEventListener("keydown", handleEscape);
    };
}, [selectedDate]);

const year = currentDate.getFullYear();
const month = currentDate.getMonth();
const monthName = currentDate.toLocaleString("default", {
    month: "long"
});

const firstDayOfMonth = new Date(year, month, 1);
const daysInMonth = new Date(year, month + 1, 0).getDate();
const startingDay = firstDayOfMonth.getDay();
const registrationDate = getRegistrationDate();
const dailyHabits = habits.filter(
    (habit) => habit.frequency === "DAILY"
);
const weeklyHabits = habits.filter(
    (habit) => habit.frequency === "WEEKLY"
);

const getStartOfWeek = (dateKey) => {
    const [selectedYear, selectedMonth, selectedDay] = dateKey.split("-").map(Number);
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    const day = date.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    date.setDate(date.getDate() - daysFromMonday);
    return formatDate(date);
};

const getEndOfWeek = (dateKey) => {
    const startOfWeek = getStartOfWeek(dateKey);
    const [weekYear, weekMonth, weekDay] = startOfWeek.split("-").map(Number);
    const endOfWeek = new Date(weekYear, weekMonth - 1, weekDay);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return formatDate(endOfWeek);
};

const formatDisplayDate = (dateKey) => {
    if (!dateKey) {
        return "";
    }

    const [selectedYear, selectedMonth, selectedDay] = dateKey.split("-").map(Number);
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    return date.toLocaleDateString("default", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

const getHabitLogForDate = (habitId, dateKey) => {
    return logs.find((log) => log.habitId === habitId && log.logDate === dateKey && log.completed);
};

const getWeeklyCompletionForWeek = (habitId, dateKey) => {
    const weekStart = getStartOfWeek(dateKey);
    const weekEnd = getEndOfWeek(dateKey);
    return (
        logs.filter((log) => log.habitId === habitId && log.completed &&
            log.logDate >= weekStart && log.logDate <= weekEnd
        ).sort((a, b) => a.logDate.localeCompare(b.logDate))[0] || null
    );
};

const getHabitActivityForSelectedDate = (habit, dateKey) => {
    if (habit.frequency === "WEEKLY") {
        const weeklyCompletion = getWeeklyCompletionForWeek(habit.id, dateKey);
        if (!weeklyCompletion) {
            return {
                completed: false,
                completionDate: null
            };
        }

        return {
            completed: true,
            completionDate: weeklyCompletion.logDate
        };
    }
    const dailyLog = getHabitLogForDate(habit.id, dateKey);

    return {
        completed: Boolean(dailyLog),
        completionDate: dailyLog ? dailyLog.logDate : null
    };
};

const getDailyCompletedCount = (dateKey) => {
    return dailyHabits.filter((habit) =>
        getHabitLogForDate(habit.id, dateKey)
    ).length;
};

const getDateStatus = (dateKey) => {
    const today = getTodayDate();
    if (registrationDate && dateKey < registrationDate) {
        return "before-registration";
    }
    if (dateKey > today) {
        return "future";
    }
    if (dailyHabits.length === 0) {
        return "no-daily-habits";
    }

    const completedCount = getDailyCompletedCount(dateKey);
    const percentage = (completedCount / dailyHabits.length) * 100;
    if (percentage >= 100) {
        return "complete";
    }
    if (percentage >= 67) {
        return "high";
    }
    if (percentage >= 34) {
        return "medium";
    }
    return "low";
};

const getMonthWeeks = () => {
    const weeks = [];
    const seenWeeks = new Set();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDate(date);
        const weekStart = getStartOfWeek(dateKey);

        if (!seenWeeks.has(weekStart)) {
            seenWeeks.add(weekStart);
            weeks.push({
                start: weekStart,
                end: getEndOfWeek(weekStart)
            });
        }
    }
    return weeks;
};

const getWeeklyWeekStatus = (weekStart, weekEnd) => {
    if (registrationDate && weekEnd < registrationDate) {
        return "before-registration";
    }

    const today = getTodayDate();
    if (weekStart > today) {
        return "future";
    }
    if (weeklyHabits.length === 0) {
        return "no-weekly-habits";
    }

    const completedCount = weeklyHabits.filter(
        (habit) => getWeeklyCompletionForWeek(habit.id, weekStart) !== null
    ).length;

    const percentage = (completedCount / weeklyHabits.length) * 100;
    if (percentage >= 100) {
        return "complete";
    }
    if (percentage >= 67) {
        return "high";
    }
    if (percentage >= 34) {
        return "medium";
    }
    return "low";
};

const monthWeeks = getMonthWeeks();

const handleDateClick = (dateKey) => {
    const status = getDateStatus(dateKey);
    if (status === "before-registration" || status === "future") {
        return;
    }

    if (habits.length === 0) {
        return;
    }
    setSelectedDate(dateKey);
};

const closeActivityModal = () => {
    setSelectedDate(null);
};

const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
};

const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
};

const selectedDateActivities = selectedDate ? habits.map((habit) => ({
    habit,
    activity: getHabitActivityForSelectedDate(habit, selectedDate)
})) : [];

const selectedDateCompletedCount = selectedDateActivities.filter(
    ({ activity }) => activity.completed
).length;
const calendarCells = [];

for (let i = 0; i < startingDay; i++) {
    calendarCells.push(
        <div key={`empty-${i}`}
            className="calendar-day empty-cell"
        />
    );
}

for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = formatDate(date);
    const today = getTodayDate();
    const completedCount = getDailyCompletedCount(dateKey);
    const status = getDateStatus(dateKey);
    const isToday = dateKey === today;
    const isBeforeRegistration = status === "before-registration";
    const isSelectable = status !== "before-registration" && status !== "future" && habits.length > 0;

    calendarCells.push(
        <button key={dateKey} type="button"
            className={`calendar-day ${status} ${isToday ? "today" : ""} ${isSelectable ? "selectable" : ""}`}
            title={ isBeforeRegistration ? "Before registration"
                : status === "future" ? "Future date"
                : dailyHabits.length === 0 ? "No daily habits"
                : `${completedCount} / ${dailyHabits.length} daily habits completed`
            }
            onClick={() => handleDateClick(dateKey)}
            disabled={!isSelectable}
        >
            <span className="calendar-date-number">
                {day}
            </span>

            {!isBeforeRegistration && status !== "future" && dailyHabits.length > 0 && (
                <span className="calendar-completion">
                    {completedCount}/
                    {dailyHabits.length}
                </span>
            )}
        </button>
    );
}

return (
    <>
        <div className="calendar-container">
            <div className="calendar-header">
                <div>
                    <h2>Calendar</h2>
                    <span>Daily Activity</span>
                </div>

                <div className="calendar-navigation">
                    <button type="button"
                        onClick={goToPreviousMonth}
                        aria-label="Previous month"
                    >
                        ‹
                    </button>

                    <strong>
                        {monthName} {year}
                    </strong>

                    <button type="button"
                        onClick={goToNextMonth}
                        aria-label="Next month"
                    >
                        ›
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="calendar-loading">
                    Loading calendar...
                </div>
            ) : (
                <>
                    <div className="calendar-weekdays">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                    </div>

                    <div className="calendar-grid">
                        {calendarCells}
                    </div>

                    <div className="weekly-summary">
                        <div className="weekly-summary-header">
                            <div>
                                <h3>
                                    Weekly Habits
                                </h3>
                                <p>
                                    Each weekly habit can be completed once per Monday–Sunday week.
                                </p>
                            </div>
                        </div>

                        {weeklyHabits.length === 0 ? (
                            <div className="weekly-empty">
                                No weekly habits yet.
                            </div>
                        ) : (
                            <div className="weekly-summary-grid">
                                {monthWeeks.map((week, index) => {
                                    const completedCount = weeklyHabits.filter((habit) =>
                                        getWeeklyCompletionForWeek(habit.id, week.start) !== null
                                    ).length;
                                    const status = getWeeklyWeekStatus(week.start, week.end);
                                    const isBeforeRegistration = status === "before-registration";
                                    const isFuture = status === "future";
                                    return (
                                        <div key={week.start}
                                            className={`weekly-summary-card ${status}`}
                                        >
                                            <div className="weekly-summary-card-top">
                                                <strong>
                                                    Week{" "}{index + 1}
                                                </strong>

                                                <span>
                                                    {formatDisplayDate(week.start)}{" "}
                                                    –{" "}
                                                    {formatDisplayDate(week.end)}
                                                </span>
                                            </div>
                                            {isBeforeRegistration ? (
                                                <div className="weekly-summary-count">
                                                    Before registration
                                                </div>
                                            ) : isFuture ? (
                                                <div className="weekly-summary-count">
                                                    Upcoming
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="weekly-summary-progress">
                                                        <span>
                                                            {completedCount}/{weeklyHabits.length}
                                                        </span>
                                                        <strong>
                                                            {Math.round(
                                                                (completedCount / weeklyHabits.length) * 100
                                                            )}
                                                            %
                                                        </strong>
                                                    </div>
                                                    <div className="weekly-summary-bar">
                                                        <span
                                                            style={{
                                                                width: `${Math.round(
                                                                    (completedCount / weeklyHabits.length) * 100
                                                                )}%`
                                                            }}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
            <div className="calendar-legend">
                <div>
                    <span className="legend-dot low" />
                    Low
                </div>
                <div>
                    <span className="legend-dot medium" />
                    Medium
                </div>
                <div>
                    <span className="legend-dot high" />
                    High
                </div>
                <div>
                    <span className="legend-dot complete" />
                    Complete
                </div>
                <div>
                    <span className="legend-dot before-registration" />
                    Before registration
                </div>
            </div>
        </div>

        {selectedDate && (
            <div className="calendar-modal-overlay"
                onClick={closeActivityModal}
            >
                <div className="calendar-activity-modal"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="calendar-modal-header">
                        <div>
                            <h3>{formatDisplayDate(selectedDate)}</h3>
                            <p>Habit Activity</p>
                        </div>

                        <button type="button"
                            className="calendar-modal-close"
                            onClick={closeActivityModal}
                            aria-label="Close activity details"
                        >
                            ×
                        </button>
                    </div>

                    <div className="calendar-modal-summary">
                        <strong>{selectedDateCompletedCount}</strong>
                        <span>of {habits.length} habits completed</span>
                    </div>

                    <div className="calendar-habit-list">
                        {selectedDateActivities.map(({ habit, activity }) => {
                            const completed = activity.completed;
                            const isWeekly = habit.frequency === "WEEKLY";
                            return (
                                <div key={habit.id}
                                    className={`calendar-habit-item ${
                                        completed ? "completed" : "not-completed"
                                    }`}
                                >
                                    <div className={`calendar-habit-status ${
                                            completed ? "completed" : "not-completed"
                                        }`}
                                    >
                                        {completed ? "✓" : "○"}
                                    </div>

                                    <div className="calendar-habit-info">
                                        <strong>{habit.name}</strong>
                                        <span>
                                            {isWeekly ? completed
                                                ? `Weekly · Completed on ${formatDisplayDate(
                                                        activity.completionDate
                                                )}` : "Weekly · Not completed this week"
                                            : "Daily"}
                                        </span>
                                    </div>

                                    <div className={`calendar-habit-result ${
                                            completed ? "completed" : "not-completed"
                                        }`}
                                    >
                                        {completed ? "Completed" : "Not completed"}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}
    </>
);
}