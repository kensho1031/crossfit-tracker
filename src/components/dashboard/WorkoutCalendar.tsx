import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Activity, Trash2 } from 'lucide-react';
import { WeeklySummaryDetailed } from './WeeklySummaryDetailed';
import { TodayClassCard } from './TodayClassCard';

interface LogData {
    id: string;
    date: string;
    raw_text: string;
    photoUrl: string | null;
    source?: 'scan' | 'log';
    type?: string;
}

export function WorkoutCalendar() {
    const { user, currentBox } = useAuth();
    const [value, onChange] = useState(new Date());
    const [logs, setLogs] = useState<{ [key: string]: LogData[] }>({});

    useEffect(() => {
        if (!user) return;

        // Query for User's WOD logs
        const wodQuery = query(
            collection(db, 'calendar_entries'),
            where('uid', '==', user.uid),
            where('type', '==', 'wod'),
            where('boxId', '==', currentBox?.id || null)
        );

        // Query for Box's Classes (Shared)
        const classQuery = query(
            collection(db, 'calendar_entries'),
            where('type', '==', 'class'),
            where('boxId', '==', currentBox?.id || null)
        );

        const unsubWod = onSnapshot(wodQuery, (snapshot) => {
            const wodMap: { [key: string]: LogData[] } = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Omit<LogData, 'id'>;
                if (!wodMap[data.date]) wodMap[data.date] = [];
                wodMap[data.date].push({ id: doc.id, ...data } as LogData);
            });

            // Need to merge with existing classes or just update state carefully
            setLogs(prev => {
                const updated = { ...prev };
                // Clear existing WODs for this new snapshot
                Object.keys(updated).forEach(date => {
                    updated[date] = updated[date].filter(l => l.type !== 'wod');
                });
                // Add new WODs
                Object.entries(wodMap).forEach(([date, items]) => {
                    if (!updated[date]) updated[date] = [];
                    updated[date].push(...items);
                });
                return updated;
            });
        });

        const unsubClass = onSnapshot(classQuery, (snapshot) => {
            const classMap: { [key: string]: LogData[] } = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Omit<LogData, 'id'>;
                if (!classMap[data.date]) classMap[data.date] = [];
                classMap[data.date].push({ id: doc.id, ...data } as LogData);
            });

            setLogs(prev => {
                const updated = { ...prev };
                // Clear existing classes
                Object.keys(updated).forEach(date => {
                    updated[date] = updated[date].filter(l => l.type !== 'class');
                });
                // Add new classes
                Object.entries(classMap).forEach(([date, items]) => {
                    if (!updated[date]) updated[date] = [];
                    updated[date].push(...items);
                });
                return updated;
            });
        });

        return () => {
            unsubWod();
            unsubClass();
        };
    }, [user, currentBox?.id]);

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

    const handleDelete = async (logId: string) => {
        if (!confirm('このWOD記録を削除しますか？')) return;
        try {
            await deleteDoc(doc(db, 'calendar_entries', logId));
        } catch (error) {
            console.error('削除エラー:', error);
            alert('削除に失敗しました');
        }
    };


    // Find logs for selected date
    const localSelectedDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    const selectedDateString = localSelectedDate.toISOString().split('T')[0];
    const dailyLogs = logs[selectedDateString] || [];

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="calendar-container" style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    height: 'fit-content'
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {/* 1. Class Card for Selected Date */}
                    <TodayClassCard date={value} />

                    {/* 2. User Logs for Selected Date */}
                    {dailyLogs.length > 0 && (
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

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {dailyLogs.map(log => (
                                    <div key={log.id} style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                style={{
                                                    background: 'rgba(255,0,0,0.1)',
                                                    border: '1px solid rgba(255,0,0,0.3)',
                                                    borderRadius: '6px',
                                                    color: '#ff6b6b',
                                                    cursor: 'pointer',
                                                    padding: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="削除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        {log.photoUrl && (
                                            <img src={log.photoUrl} alt="WOD" style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
                                        )}
                                        <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', margin: 0 }}>{log.raw_text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <WeeklySummaryDetailed />

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
                    font-size: 1.1rem; /* Smaller nav icons */
                }

                .react-calendar__navigation__label {
                    font-size: 0.85rem !important;
                    font-weight: 700 !important;
                    color: var(--color-text) !important;
                }
                
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                    background-color: var(--color-surface) !important;
                    border-radius: 8px;
                }
                
                .react-calendar__tile {
                    padding: 1rem 0.25rem !important; /* Larger touch target */
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                    aspect-ratio: 1 / 1;
                }
            `}</style>
        </>
    );
}
