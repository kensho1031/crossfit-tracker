import { Outlet, Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export function Layout() {
    const { user, logout } = useAuth();

    return (
        <div className="layout-container">
            <header className="layout-header">
                <div className="header-top">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div className="flex items-center gap-2">
                            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <Dumbbell className="h-6 w-6 text-primary" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">
                                    CrossFit <span className="text-primary">Tracker</span>
                                </h1>
                            </Link>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {user && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {user.photoURL && (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || 'User'}
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                        )}
                                        <span style={{ fontSize: '0.9rem', color: '#ccc', fontWeight: 500 }}>
                                            {user.displayName}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => logout()}
                                        style={{
                                            fontSize: '0.75rem',
                                            color: '#888',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        Sign Out
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="layout-main">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation Removed */}

        </div>
    );
}
