import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { getDailyClass } from '../../services/classService';
import { useRole } from '../../hooks/useRole';
import type { DailyClass } from '../../types/class';

export function TodayClassCard() {
    const navigate = useNavigate();
    const { boxId } = useRole();
    const [dailyClass, setDailyClass] = useState<DailyClass | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTodayClass = async () => {
            if (!boxId) {
                setLoading(false);
                return;
            }

            const todayStr = new Date().toISOString().split('T')[0];
            try {
                const data = await getDailyClass(todayStr, boxId);
                setDailyClass(data);
            } catch (error) {
                console.error("Failed to fetch today's class:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTodayClass();
    }, [boxId]);

    const handleCardClick = () => {
        navigate('/class/today');
    };

    if (loading) {
        return (
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '1.2rem',
                maxWidth: '600px',
                margin: '0 auto',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: 'var(--spacing-md)'
            }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading...</div>
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
                    borderRadius: '12px',
                    padding: '1.2rem',
                    maxWidth: '600px',
                    margin: '0 auto',
                    border: '1px dashed var(--color-border)',
                    marginBottom: 'var(--spacing-md)',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
            >
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)', fontSize: '1.2rem', margin: 0 }}>NO CLASS TODAY</h2>
                <div style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Tap to check details
                </div>
            </div>
        );
    }

    // Get section names
    const getSectionDisplay = () => {
        if (dailyClass.sections && dailyClass.sections.length > 0) {
            return dailyClass.sections.map(section => {
                // For WOD sections, prioritize wodName or title
                if (section.type === 'wod' && (section.wodName || section.title)) {
                    return section.wodName || section.title;
                }
                // For other sections, use title or type
                return section.title || section.type.toUpperCase();
            });
        }
        // Fallback for legacy data
        const sections = [];
        if (dailyClass.warmup) sections.push('WARMUP');
        if (dailyClass.strength) sections.push(dailyClass.strength.title || 'STRENGTH');
        if (dailyClass.wod) sections.push(dailyClass.wod.title || 'WOD');
        return sections;
    };

    const sections = getSectionDisplay();

    return (
        <div
            onClick={handleCardClick}
            style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '1.2rem',
                maxWidth: '600px',
                margin: '0 auto',
                border: '1px solid var(--color-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: 'var(--spacing-md)'
            }}
            className="today-class-card"
        >
            {/* Header - Title and Date on same line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.2rem',
                        color: 'var(--color-primary)',
                        margin: 0,
                        letterSpacing: '1px'
                    }}>
                        TODAY'S CLASS
                    </h2>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 500
                    }}>
                        <Calendar size={12} />
                        {dailyClass.date}
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '50%',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ChevronRight size={16} color="var(--color-primary)" />
                </div>
            </div>

            {/* Sections - Compact horizontal display */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                flexWrap: 'wrap',
                fontSize: '0.85rem'
            }}>
                {sections.map((section, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {idx > 0 && <span style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>•</span>}
                        <span style={{
                            color: 'var(--color-text)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            fontSize: '0.8rem',
                            letterSpacing: '0.5px'
                        }}>
                            {section}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
