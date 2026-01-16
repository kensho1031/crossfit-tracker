import { Link, Outlet } from 'react-router-dom';
import { Dumbbell, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import { useState, useRef, useEffect } from 'react';
import './Layout.css';

export function Layout() {
    const { user, logout, myBoxes, currentBox, setCurrentBox } = useAuth();
    const { isDeveloper } = useRole();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

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
                    <div className="header-actions" ref={menuRef}>
                        <div className="user-menu-container">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'User'}
                                    className="user-avatar"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                />
                            ) : (
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="logout-button-icon"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}

                            {showUserMenu && (
                                <div className="user-dropdown-menu">
                                    <div className="user-dropdown-header">
                                        <div className="user-dropdown-name">{user?.displayName || 'User'}</div>
                                        <div className="user-dropdown-email">{user?.email}</div>
                                    </div>
                                    <div className="user-dropdown-divider"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="user-dropdown-logout"
                                    >
                                        <LogOut size={16} />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="layout-main">
                <Outlet />
            </main>
        </div>
    );
}
