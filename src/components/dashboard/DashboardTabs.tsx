import { LayoutDashboard, Calendar, History, TrendingUp, Dumbbell } from 'lucide-react';

interface TabProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function DashboardTabs({ activeTab, setActiveTab }: TabProps) {
    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'stats', label: 'Stats', icon: TrendingUp },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'log', label: 'Log', icon: History },
        { id: 'tools', label: 'Tools', icon: Dumbbell },
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '1rem',
            paddingTop: '10px',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            overflowX: 'auto'
        }}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: isActive ? 'var(--color-surface)' : 'transparent',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            border: isActive ? '1px solid var(--color-accent)' : '1px solid transparent',
                            borderRadius: '20px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 600 : 500,
                            letterSpacing: 'var(--letter-spacing-wide)',
                            boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                            cursor: 'pointer'
                        }}
                    >
                        <Icon size={16} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
