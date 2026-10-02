import React from 'react';
import { useAuth } from '../context/AuthContext';
import AuthWrapper from './AuthWrapper';
import DashboardWrapper from './DashboardWrapper';

export default function MainView() {
    const { auth } = useAuth();

    return (
        <div className="main-container">
            {!auth?.token ? (<AuthWrapper />) : (<DashboardWrapper name={auth.name} role={auth.role} />)}
        </div>
    );
}