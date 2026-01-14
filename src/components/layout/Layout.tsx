import { Outlet, Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export function Layout() {
    const { user, logout } = useAuth();

    return (
        <div className="layout-container">
            <header className="layout-header">
                <div className="header-content">
                    <Link to="/" className="header-logo">
                        <div className="logo-icon-wrapper">
                            <Dumbbell className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="header-title">
                            CF <span className="text-primary">Tracker</span>
                        </h1>
                    </Link>

                    {user && (
                        <div className="header-user-actions">
                            <div className="user-profile-mini">
                                {user.photoURL && (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="user-avatar-mini"
                                    />
                                )}
                                <span className="user-name-mini">
                                    {user.displayName?.split(' ')[0]}
                                </span>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="signout-button-mini"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="layout-main">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation Removed */}

        </div>
    );
}
