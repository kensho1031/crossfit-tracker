import { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

type WODType = 'AMRAP' | 'EMOM' | 'For Time';

interface WODTemplate {
    type: WODType;
    duration: string;
    movements: string[];
}

const templates: WODTemplate[] = [
    { type: 'AMRAP', duration: '20 mins', movements: ['400m Run', '15 Pull-ups', '20 Push-ups', '25 Squats'] },
    { type: 'EMOM', duration: '15 mins', movements: ['Min 1: 15 Wall Balls', 'Min 2: 12 Burpees', 'Min 3: 15 Box Jumps'] },
    { type: 'For Time', duration: '5 Rounds', movements: ['10 Deadlifts (100kg/70kg)', '20 Double Unders'] },
    { type: 'AMRAP', duration: '12 mins', movements: ['9 Kettlebell Swings', '12 Goblet Squats', '15 Sit-ups'] },
    { type: 'AMRAP', duration: '15 mins', movements: ['5 Handstand Push-ups', '10 One-legged Squats', '15 Pull-ups'] }, // Mary-ish
    { type: 'For Time', duration: '1 Mile Run', movements: ['Then: 100 Pull-ups', '200 Push-ups', '300 Squats', 'Finally: 1 Mile Run'] }, // Murph
];

export function RandomWODGenerator() {
    const [wod, setWod] = useState<WODTemplate | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateWOD = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * templates.length);
            setWod(templates[randomIndex]);
            setIsGenerating(false);
        }, 600);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(92, 124, 250, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)'
                    }}>
                        <Activity size={32} />
                    </div>
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Random WOD Generator</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    今日のメニューに迷ったらこれ。AMRAP, EMOMなどからランダムに生成します。
                </p>

                <button
                    onClick={generateWOD}
                    className="primary"
                    disabled={isGenerating}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        margin: '0 auto 2rem'
                    }}
                >
                    <RefreshCw size={20} className={isGenerating ? 'spin' : ''} />
                    {isGenerating ? '生成中...' : 'WODを生成する'}
                </button>

                {wod && (
                    <div style={{
                        textAlign: 'left',
                        background: 'var(--color-bg)',
                        borderRadius: 'var(--border-radius)',
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)',
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{
                                background: 'var(--color-primary)',
                                color: 'var(--color-primary-foreground)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                {wod.type}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                {wod.duration}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {wod.movements.map((move, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 0',
                                    borderBottom: i === wod.movements.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)'
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{move}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
