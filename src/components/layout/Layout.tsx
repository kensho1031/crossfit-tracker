import { Link, Outlet } from 'react-router-dom';
import { Dumbbell, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import './Layout.css';

export function Layout() {
    const { user, logout, myBoxes, currentBox, setCurrentBox } = useAuth();
    const { isDeveloper } = useRole();

    const switchBox = (boxId: string) => {
        if (!setCurrentBox) return;
        const selected = myBoxes.find(b => b.id === boxId);
        if (selected) {
            setCurrentBox(selected);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    return (
        <div className="layout-container">
            <header className="header">
                <div className="header-content">
                    {/* Left: Logo */}
                    <Link to="/" className="header-left">
                        <div className="logo-container">
                            <Dumbbell className="header-logo-icon" size={24} />
                        </div>
                    </Link>

                    {/* Center: Box Switcher */}
                    <div className="header-center">
                        {user && myBoxes.length > 0 && (
                            <>
                                {(myBoxes.length > 1 || isDeveloper) ? (
                                    <div className="box-selector-wrapper">
                                        <select
                                            value={currentBox?.id || ''}
                                            onChange={(e) => switchBox(e.target.value)}
                                            className="box-selector"
                                        >
                                            {myBoxes.map(box => (
                                                <option key={box.id} value={box.id}>
                                                    {box.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="box-selector-icon" size={16} />
                                    </div>
                                ) : (
                                    <div className="box-name-display">
                                        {currentBox?.name || myBoxes[0]?.name}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: User Menu */}
                    <div className="header-actions">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || 'User'}
                                className="user-avatar"
                                onClick={handleLogout}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    border: '2px solid rgba(255,255,255,0.1)'
                                }}
                            />
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="logout-button-icon"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="layout-main">
                <Outlet />
            </main>
        </div>
    );
}
