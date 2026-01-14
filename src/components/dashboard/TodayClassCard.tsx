import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { getDailyClass } from '../../services/classService';
import type { DailyClass } from '../../types/class';

export function TodayClassCard() {
    const navigate = useNavigate();
    const [dailyClass, setDailyClass] = useState<DailyClass | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTodayClass = async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            try {
                const data = await getDailyClass(todayStr);
                setDailyClass(data);
            } catch (error) {
                console.error("Failed to fetch today's class:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTodayClass();
    }, []);

    const handleCardClick = () => {
        navigate('/class/today');
    };

    if (loading) {
        return (
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: 'var(--spacing-md)',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: 'var(--spacing-md)'
            }}>
                <div style={{ color: 'var(--color-text-muted)' }}>Loading class info...</div>
            </div>
        );
    }

    // Default empty state if no class registered today
    if (!dailyClass) {
        return (
            <div
                onClick={handleCardClick}
                style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: 'var(--spacing-md)',
                    border: '1px dashed var(--color-border)',
                    marginBottom: 'var(--spacing-md)',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
            >
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)' }}>NO CLASS TODAY</h2>
                <div style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Tap to check details or past classes
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={handleCardClick}
            style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 'var(--spacing-md)'
            }}
            className="today-class-card"
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.8rem',
                        color: 'var(--color-primary)',
                        marginBottom: '0.2rem',
                        letterSpacing: '1px'
                    }}>
                        TODAY'S CLASS
                    </h2>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}>
                        <Calendar size={14} />
                        {dailyClass.date}
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '50%',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ChevronRight size={20} color="var(--color-primary)" />
                </div>
            </div>

            {/* Content Preview */}
            <div style={{ padding: '0 0.5rem 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {dailyClass.sections && dailyClass.sections.length > 0 ? (
                    dailyClass.sections.slice(0, 3).map((section, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: section.type === 'wod' ? 'var(--color-neon)' :
                                    section.type === 'strength' ? 'var(--color-accent)' :
                                        section.type === 'skill' ? '#2196F3' : '#9E9E9E',
                                flexShrink: 0
                            }} />
                            <div style={{ overflow: 'hidden' }}>
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text-muted)',
                                    fontWeight: 'bold',
                                    marginRight: '8px',
                                    textTransform: 'uppercase'
                                }}>
                                    {section.type === 'warmup' ? 'WARMUP' : section.title || section.type}
                                </span>
                                {section.content && (
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                        {section.content.length > 30 ? section.content.substring(0, 30) + '...' : section.content}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    // Fallback for Legacy Data
                    <>
                        {dailyClass.strength && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'bold', marginRight: '8px' }}>STRENGTH</span>
                                    <span style={{ fontSize: '0.9rem' }}>{dailyClass.strength.title || "Strength"}</span>
                                </div>
                            </div>
                        )}
                        {dailyClass.wod && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-neon)', flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'bold', marginRight: '8px' }}>WOD</span>
                                    <span style={{ fontSize: '0.9rem' }}>{dailyClass.wod.title || "WOD"}</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Tap hint */}
            <div style={{
                marginTop: '0.5rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                opacity: 0.7
            }}>
                詳細を見る
            </div>
        </div>
    );
}
