import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

export function OneRepMaxCalculator() {
    const [weight, setWeight] = useState<string>('');
    const [reps, setReps] = useState<string>('');
    const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
    const [oneRepMax, setOneRepMax] = useState<number | null>(null);

    useEffect(() => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);

        if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
            if (r === 1) {
                setOneRepMax(w);
            } else {
                const max = w * (1 + r / 30);
                setOneRepMax(Math.round(max));
            }
        } else {
            setOneRepMax(null);
        }
    }, [weight, reps]);

    const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50];

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                        <Calculator className="text-primary" size={24} />
                    </div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                        1RM Calculator
                    </h3>
                </div>

                {/* Unit Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                    {(['kg', 'lbs'] as const).map((u) => (
                        <button
                            key={u}
                            onClick={() => setUnit(u)}
                            style={{
                                padding: '4px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: unit === u ? 'var(--color-primary)' : 'transparent',
                                color: unit === u ? 'white' : '#888'
                            }}
                        >
                            {u.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        重量 (Weight)
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="0"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                paddingRight: '3.5rem',
                                borderRadius: '8px',
                                background: '#111',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                boxSizing: 'border-box'
                            }}
                        />
                        <span style={{ position: 'absolute', right: '35px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '0.8rem', pointerEvents: 'none' }}>
                            {unit}
                        </span>
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        回数 (Reps)
                    </label>
                    <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="1-10"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: '#111',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {oneRepMax && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        color: 'white',
                        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
                    }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>推定 1RM (Estimated Max)</div>
                        <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
                            {oneRepMax}<span style={{ fontSize: '1.2rem', fontWeight: 400, marginLeft: '4px', verticalAlign: 'middle' }}>{unit}</span>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
                        gap: '0.5rem'
                    }}>
                        {percentages.map(pct => (
                            <div key={pct} style={{
                                background: pct === 100 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                border: pct === 100 ? '1px solid var(--color-primary)20' : '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: pct === 100 ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: '2px', fontWeight: pct === 100 ? 700 : 400 }}>
                                    {pct}%
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: pct === 100 ? 'white' : 'inherit' }}>
                                    {Math.round(oneRepMax * (pct / 100))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
