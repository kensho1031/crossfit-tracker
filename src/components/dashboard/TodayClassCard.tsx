import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { getDailyClass } from '../../services/classService';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { DailyClass } from '../../types/class';

interface TodayClassCardProps {
    date?: Date;
}

export function TodayClassCard({ date }: TodayClassCardProps) {
    const navigate = useNavigate();
    const { boxId } = useRole();
    const { user } = useAuth();
    const [dailyClass, setDailyClass] = useState<DailyClass | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasScore, setHasScore] = useState(false);

    // Use provided date or default to today (local time)
    const targetDate = date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000) : new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0];

    useEffect(() => {
        const fetchClass = async () => {
            if (!boxId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const data = await getDailyClass(targetDateStr, boxId);
                setDailyClass(data);
                setHasScore(false); // Reset score state on date change

                // Check for score if class exists and user is logged in
                if (data && user) {
                    const q = query(
                        collection(db, 'calendar_entries'),
                        where('uid', '==', user.uid),
                        where('date', '==', targetDateStr),
                        where('type', '==', 'wod')
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        setHasScore(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch class or score:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClass();
    }, [boxId, user, targetDateStr]);

    const handleCardClick = () => {
        navigate(`/class/${targetDateStr}`);
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
                /* Plan B Style: Glassmorphism & Neon */
                background: 'rgba(20, 20, 25, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '1.75rem',
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: 'var(--spacing-md)',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}
            className="today-class-card"
        >
            {/* Ambient Neon Glow */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.03), transparent 60%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Header: Date & Title */}
            <div style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                }}>
                    <span style={{
                        color: 'var(--color-primary)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.9rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontWeight: 600
                    }}>
                        {dailyClass.date}
                    </span>

                    {/* Score Entered Badge */}
                    {hasScore && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(0, 255, 0, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 255, 0, 0.3)'
                        }}>
                            <CheckCircle2 size={12} color="#4ade80" />
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.5px' }}>
                                COMPLETED
                            </span>
                        </div>
                    )}
                </div>

                <h2 style={{
                    fontSize: '1.75rem',
                    color: '#fff',
                    margin: 0,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 20px rgba(0,0,0,0.5)'
                }}>
                    {dailyClass.title || "Daily WOD"}
                </h2>
            </div>

            {/* Content: Sections as Tags/Chips for Plan A clarity */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.6rem'
            }}>
                {sections.length > 0 ? sections.map((section, idx) => (
                    <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                        flex: '1 1 auto' // Grow to fill space
                    }}>
                        <span style={{
                            fontSize: '0.7rem',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-body)',
                            letterSpacing: '0.05em'
                        }}>
                            SECTION {idx + 1}
                        </span>
                        <span style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#e0e0e0'
                        }}>
                            {section}
                        </span>
                    </div>
                )) : (
                    <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No workout details available.</span>
                )}
            </div>

            {/* Action / Footer */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: '0.5rem',
                gap: '0.5rem',
                color: 'var(--color-neon)',
                fontSize: '0.9rem',
                fontWeight: 600
            }}>
                <span>View Details</span>
                <div style={{
                    background: 'rgba(0, 255, 255, 0.1)',
                    borderRadius: '50%',
                    padding: '4px',
                    display: 'flex'
                }}>
                    <ChevronRight size={16} />
                </div>
            </div>

            <style>{`
                .today-class-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(0, 255, 255, 0.05);
                    border-color: rgba(0, 255, 255, 0.2);
                }
                .today-class-card:active {
                    transform: scale(0.98);
                }

                @media (max-width: 600px) {
                    .today-class-card {
                        padding: 1.5rem !important;
                        min-height: auto !important;
                        border-radius: 20px !important;
                        margin-bottom: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
