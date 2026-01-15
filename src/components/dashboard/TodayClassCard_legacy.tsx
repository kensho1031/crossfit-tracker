import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.06) 0%, rgba(0, 255, 255, 0.04) 100%)',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                maxWidth: '400px',
                margin: '0 auto',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 20px rgba(255, 215, 0, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: 'var(--spacing-md)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
            }}
            className="today-class-card"
        >
            {/* Decorative top border */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
                opacity: 0.6
            }} />

            {/* Title */}
            <h2 style={{
                fontSize: '1.4rem',
                color: 'var(--color-primary)',
                margin: '0 0 0.5rem 0',
                letterSpacing: '1.5px',
                fontWeight: 800
            }}>
                TODAY'S CLASS
            </h2>

            {/* Date */}
            <div style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '1.25rem',
                opacity: 0.8
            }}>
                {dailyClass.date}
            </div>

            {/* Class Title */}
            {dailyClass.title && (
                <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '1rem',
                    lineHeight: 1.4
                }}>
                    {dailyClass.title}
                </div>
            )}

            {/* Sections */}
            {sections.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                }}>
                    {sections.map((section, idx) => (
                        <span
                            key={idx}
                            style={{
                                background: 'rgba(0, 255, 255, 0.1)',
                                color: 'var(--color-primary)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                border: '1px solid rgba(0, 255, 255, 0.2)'
                            }}
                        >
                            {section}
                        </span>
                    ))}
                </div>
            )}

            {/* Tappable Cue - Icon Only */}
            <div style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                opacity: 0.6,
                transform: 'translateY(4px)'
            }}>
                <ChevronRight size={20} color="var(--color-primary)" />
            </div>

            <style>{`
                .today-class-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2), 0 0 30px rgba(255, 215, 0, 0.1);
                }
                .today-class-card:active {
                    transform: scale(0.98);
                }

                @media (max-width: 600px) {
                    .today-class-card {
                        padding: 1.75rem 1.25rem !important;
                        min-height: 260px !important;
                        max-width: 90% !important;
                    }
                }
            `}</style>
        </div>
    );
}
