import { LayoutDashboard, Calendar, History, TrendingUp, Dumbbell } from 'lucide-react';
import './DashboardTabs.css';

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
        <div className="dashboard-tabs-container">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={isActive ? 20 : 18} style={{ transition: 'all 0.3s' }} />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
