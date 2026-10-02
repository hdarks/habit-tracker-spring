import { useState } from "react";
import MonthlyActivityGraph from "./MonthlyActivityGraph";
import Navbar from "./Navbar";
import CreateHabit from "./CreateHabit";
import CreateGoal from "./CreateGoal";
import GoalList from "./GoalList";
import HabitLogging from "./HabitLogging";
import "./DashboardWrapper.css";
import AnalyticsGrid from "./AnalyticsGrid";
import Calendar from "./Calendar";
import HighlightsMotivation from "./HighlightsMotivation";

export default function DashboardWrapper({ name, role }) {
    const [refresh, setRefresh] = useState(false);
    const [showHabitModel, setShowHabitModel] = useState(false);
    const [showGoalModel, setShowGoalModel] = useState(false);

    const handleRefresh = () => {
        setRefresh((prev) => !prev);
    };

    return (
        <>
            <Navbar role={role} />

            <main className="dashboard" id="dashboard">

                {/* Welcome */}
                <section className="dashboard-welcome">
                    <div className="dashboard-welcome-content">
                        <span className="dashboard-greeting">
                            Welcome back,
                        </span>

                        <h1>{name} 👋</h1>

                        <p>
                            Keep building your habits and stay consistent.
                        </p>
                    </div>

                    <div className="dashboard-actions">
                        <button
                            className="create-habit-btn"
                            onClick={() => setShowHabitModel(true)}
                        >
                            + Create Habit
                        </button>

                        <button
                            className="create-goal-btn"
                            onClick={() => setShowGoalModel(true)}
                        >
                            + Create Goal
                        </button>
                    </div>
                </section>


                {/* Highlights / Motivation */}
                <div className="dashboard-card highlights-card">
                    <HighlightsMotivation refresh={refresh} />
                </div>


                {/* Today's Habits */}
                <div className="dashboard-card habits-card">
                    <HabitLogging
                        onLogging={handleRefresh}
                        refresh={refresh}
                    />
                </div>


                {/* Analytics */}
                <div className="dashboard-card analytics-card">
                    <AnalyticsGrid refresh={refresh} />
                </div>


                {/* Calendar */}
                <div className="dashboard-card calendar-card">
                    <Calendar refresh={refresh} />
                </div>


                {/* Goals */}
                <div
                    className="dashboard-card goals-card"
                    id="goals"
                >
                    <GoalList refresh={refresh}/>
                </div>


                {/* Monthly Graph */}
                <div className="dashboard-card graph-card">
                    <MonthlyActivityGraph refresh={refresh} />
                </div>

            </main>


            {/* Create Habit Modal */}
            {showHabitModel && (
                <CreateHabit
                    onCreated={() => {
                        handleRefresh();
                        setShowHabitModel(false);
                    }}
                    onClose={() => setShowHabitModel(false)}
                />
            )}


            {/* Create Goal Modal */}
            {showGoalModel && (
                <CreateGoal
                    onCreated={() => {
                        handleRefresh();
                        setShowGoalModel(false);
                    }}
                    onClose={() => setShowGoalModel(false)}
                />
            )}
        </>
    );
}