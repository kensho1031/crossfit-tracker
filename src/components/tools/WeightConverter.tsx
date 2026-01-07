import { useState } from 'react';
import { Scale, ArrowLeftRight } from 'lucide-react';

export function WeightConverter() {
    const [kg, setKg] = useState('');
    const [lbs, setLbs] = useState('');

    const handleKgChange = (value: string) => {
        setKg(value);
        if (value === '') {
            setLbs('');
        } else {
            const num = parseFloat(value);
            setLbs((num * 2.20462).toFixed(2));
        }
    };

    const handleLbsChange = (value: string) => {
        setLbs(value);
        if (value === '') {
            setKg('');
        } else {
            const num = parseFloat(value);
            setKg((num / 2.20462).toFixed(2));
        }
    };

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                    <Scale className="text-secondary" size={24} style={{ color: '#10b981' }} />
                </div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                    Weight Converter (kg ↔ lbs)
                </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        Kilograms (kg)
                    </label>
                    <input
                        type="number"
                        value={kg}
                        onChange={(e) => handleKgChange(e.target.value)}
                        placeholder="0"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: '#111',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ paddingTop: '1.5rem', color: 'var(--color-text-muted)' }}>
                    <ArrowLeftRight size={20} />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        Pounds (lbs)
                    </label>
                    <input
                        type="number"
                        value={lbs}
                        onChange={(e) => handleLbsChange(e.target.value)}
                        placeholder="0"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: '#111',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', opacity: 0.6 }}>
                1 kg ≈ 2.20462 lbs
            </div>

            {(kg || lbs) && (
                <div style={{ marginTop: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
                        PERCENTAGE BREAKDOWN
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem'
                    }}>
                        {[100, 95, 90, 85, 80, 75, 70, 65, 60, 50].map(pct => {
                            const valKg = kg ? parseFloat(kg) * (pct / 100) : 0;
                            const valLbs = lbs ? parseFloat(lbs) * (pct / 100) : 0;

                            return (
                                <div key={pct} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                        {pct}%
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {kg ? `${valKg.toFixed(1)}kg` : `${valLbs.toFixed(1)}lbs`}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {kg ? `${(valKg * 2.20462).toFixed(1)}lbs` : `${(valLbs / 2.20462).toFixed(1)}kg`}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
