import { Link, Outlet } from 'react-router-dom';
import { Dumbbell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import './Layout.css';

export function Layout() {
    const { user, logout, myBoxes, currentBox, setCurrentBox } = useAuth();
    const { isDeveloper } = useRole();

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
                            {/* Box Switcher */}
                            {myBoxes.length > 0 && (
                                <div className="box-selector-wrapper">
                                    <span className="box-selector-label">GYM:</span>
                                    {(myBoxes.length > 1 || isDeveloper) ? (
                                        <select
                                            className="box-selector-select"
                                            value={currentBox?.id || ''}
                                            onChange={(e) => {
                                                const selected = myBoxes.find(b => b.id === e.target.value);
                                                if (selected) setCurrentBox(selected);
                                            }}
                                        >
                                            {myBoxes.map(box => (
                                                <option key={box.id} value={box.id}>
                                                    {box.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="box-selector-single">
                                            {currentBox?.name || myBoxes[0].name}
                                        </span>
                                    )}
                                </div>
                            )}

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
                                title="Sign Out"
                            >
                                <X size={14} />
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
