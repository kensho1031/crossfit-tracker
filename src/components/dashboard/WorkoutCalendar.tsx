import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface LogData {
    id: string;
    date: string;
    memo: string;
    photoUrl: string | null;
}

export function WorkoutCalendar() {
    const { user } = useAuth();
    const [value, onChange] = useState(new Date());
    const [logs, setLogs] = useState<{ [key: string]: LogData[] }>({});

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'logs'),
            where('uid', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logMap: { [key: string]: LogData[] } = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Omit<LogData, 'id'>;
                const dateKey = data.date;
                if (!logMap[dateKey]) logMap[dateKey] = [];
                logMap[dateKey].push({ id: doc.id, ...data } as LogData);
            });
            setLogs(logMap);
        });

        return () => unsubscribe();
    }, [user]);

    const tileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            const dateString = localDate.toISOString().split('T')[0];
            if (logs[dateString]) {
                return (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                        <div className="activity-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                    </div>
                );
            }
        }
        return null;
    };

    // Find logs for selected date
    const localSelectedDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    const selectedDateString = localSelectedDate.toISOString().split('T')[0];
    const dailyLogs = logs[selectedDateString] || [];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="calendar-container" style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <Calendar
                    onChange={(val) => onChange(val as Date)}
                    value={value}
                    tileContent={tileContent}
                    locale="ja-JP"
                    prevLabel={<ChevronLeft size={24} />}
                    nextLabel={<ChevronRight size={24} />}
                    next2Label={null}
                    prev2Label={null}
                    formatDay={(_, date) => new Date(date).getDate().toString()}
                    className="custom-calendar"
                />
            </div>

            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <Activity size={20} color="var(--color-primary)" />
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{selectedDateString} の記録</h3>
                </div>

                {dailyLogs.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {dailyLogs.map(log => (
                            <div key={log.id} style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                {log.photoUrl && (
                                    <img src={log.photoUrl} alt="WOD" style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
                                )}
                                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', margin: 0 }}>{log.memo}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>ワークアウトの記録はありません。</p>
                )}
            </div>

            <style>{`
                .custom-calendar {
                    width: 100% !important;
                    border: none !important;
                    font-family: var(--font-body) !important;
                    background: transparent !important;
                }
                
                /* Month view styling */
                .react-calendar__month-view__days__day {
                    font-family: var(--font-body);
                    font-weight: 500;
                    color: var(--color-text) !important;
                    font-size: 1.1rem; /* Larger numbers */
                }
                
                /* Neighbor month days (translucent) */
                .react-calendar__month-view__days__day--neighboringMonth {
                    color: var(--color-text-muted) !important;
                    opacity: 0.3;
                }
                
                /* Weekdays header */
                .react-calendar__month-view__weekdays__weekday {
                    text-transform: none;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                    text-decoration: none !important;
                }
                .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none !important;
                    cursor: default;
                }
                
                /* Remove default red color for weekends */
                .react-calendar__month-view__weekdays__weekday--weekend {
                    color: var(--color-text-muted) !important;
                }
                .react-calendar__month-view__days__day--weekend {
                    color: var(--color-text) !important;
                }
                .react-calendar__month-view__days__day--weekend.react-calendar__month-view__days__day--neighboringMonth {
                    color: var(--color-text-muted) !important;
                }

                /* Active tile (selected) */
                .react-calendar__tile--active {
                    background: var(--color-primary) !important;
                    color: black !important; /* Black text on Yellow */
                    border-radius: 12px; /* Rounded shape */
                    font-weight: 800;
                    box-shadow: 0 4px 10px rgba(255, 215, 0, 0.3);
                }
                
                /* Change dot color when selected */
                .react-calendar__tile--active .activity-dot {
                    background: black !important;
                }

                /* Hover state */
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                    background-color: var(--color-border) !important;
                    border-radius: 12px;
                }
                
                /* Today highlight */
                .react-calendar__tile--now {
                    background: transparent !important;
                    color: var(--color-primary) !important;
                    border: 2px solid var(--color-primary) !important;
                    border-radius: 12px;
                    font-weight: 800;
                }
                .react-calendar__tile--now.react-calendar__tile--active {
                    background: var(--color-primary) !important;
                    color: black !important;
                }
                
                .react-calendar__navigation button {
                    color: var(--color-text);
                    font-size: 1.5rem; /* Larger nav icons */
                }
                
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                    background-color: var(--color-surface) !important;
                    border-radius: 8px;
                }
                
                .react-calendar__tile {
                    padding: 1.25rem 0.5rem !important; /* Larger touch target */
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                    height: 80px; /* Fixed height for consistency */
                }
            `}</style>
        </div>
    );
}
