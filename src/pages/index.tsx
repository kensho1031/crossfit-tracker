import { useAuth } from '../contexts/AuthContext';
import { LoginButton } from '../components/auth/LoginButton';
import { DashboardTabs } from '../components/dashboard/DashboardTabs';
import { BodyStatusCard } from '../components/dashboard/BodyStatusCard';
import { WeightTrendChart } from '../components/dashboard/WeightTrendChart';
import { PRCards } from '../components/dashboard/PRCards';
import { ScanWODButton } from '../components/dashboard/ScanWODButton';
import { QuoteOfTheDay } from '../components/dashboard/QuoteOfTheDay';
import { DraftLogsSection } from '../components/dashboard/DraftLogsSection';
import { WeeklySummarySimple } from '../components/dashboard/WeeklySummarySimple';
import { WeeklySummaryCompact } from '../components/dashboard/WeeklySummaryCompact';
import { useSearchParams } from 'react-router-dom';

export function Dashboard() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const setActiveTab = (tab: string) => setSearchParams({ tab });

    if (!user) {
        return (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>CrossFit Tracker</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                    Track your WODs, Monitor your stats, Evolve your avatar.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <LoginButton />
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Dashboard Content padding adjustment */}
            <div style={{ height: '1.5rem' }} />

            {/* Navigation Tabs */}
            <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Dashboard Content */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 var(--spacing-sm)' // Use sm for mobile-first consistency
            }}>
                {activeTab === 'overview' && (
                    <>
                        <DraftLogsSection />
                        <ScanWODButton />
                        <WeeklySummarySimple onDetailClick={() => setActiveTab('calendar')} />
                        <WeeklySummaryCompact />
                        <PRCards />
                        <QuoteOfTheDay />
                    </>
                )}

                {activeTab === 'stats' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '2rem',
                        alignItems: 'start'
                    }}>
                        <BodyStatusCard />
                        <WeightTrendChart />
                    </div>
                )}

                {activeTab === 'log' && <WorkoutLog />}

                {activeTab === 'calendar' && <WorkoutCalendar />}
                {activeTab === 'tools' && <Tools />}
            </div>
        </div>
    );
}

import { WorkoutLog } from './WorkoutLog';
import { Tools } from './Tools';
import { WorkoutCalendar } from '../components/dashboard/WorkoutCalendar';
export { WorkoutLog };
