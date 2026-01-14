import { useState, useEffect } from 'react';
import { X, Info, TrendingUp } from 'lucide-react';

interface StatEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    label: string;
    currentValue: number;
    onSave: (newValue: number) => Promise<void>;
    color: string;
}

export function StatEditModal({ isOpen, onClose, label, currentValue, onSave, color }: StatEditModalProps) {
    const [value, setValue] = useState(currentValue || 60);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setValue(currentValue || 60);
    }, [isOpen, currentValue]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(value);
            onClose();
        } catch (error) {
            console.error('Failed to save stat:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Reference data (Mock: Average beginner weights)
    const getRefInfo = () => {
        if (label.includes('BENCH')) return { beginner: '40-60kg', intermediate: '80-100kg', text: '体重と同程度が最初の大目標です。' };
        if (label.includes('DEADLIFT')) return { beginner: '60-80kg', intermediate: '120-150kg', text: '正しいフォームで体重の1.5倍を目指しましょう。' };
        if (label.includes('SQUAT')) return { beginner: '50-70kg', intermediate: '100-130kg', text: 'フルスクワットでの記録を目指しましょう。' };
        return { beginner: '??', intermediate: '??', text: '' };
    };

    const info = getRefInfo();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                width: '100%',
                maxWidth: '450px',
                borderRadius: 'var(--border-radius-lg)',
                border: `1px solid ${color}33`,
                padding: '2rem',
                position: 'relative',
                boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${color}11`
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <h3 style={{
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <TrendingUp size={24} color={color} />
                    {label} 更新
                </h3>

                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'baseline',
                        gap: '8px',
                        marginBottom: '1rem'
                    }}>
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(Number(e.target.value))}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: `2px solid ${color}`,
                                color: 'var(--color-text)',
                                fontSize: '3.5rem',
                                fontWeight: 800,
                                textAlign: 'center',
                                width: '160px',
                                outline: 'none',
                                fontFamily: 'var(--font-heading)'
                            }}
                        />
                        <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>kg</span>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max="300"
                        step="2.5"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        style={{
                            width: '100%',
                            accentColor: color,
                            cursor: 'pointer'
                        }}
                    />
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '1.5rem',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: '2rem',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: color, marginBottom: '0.5rem', fontWeight: 600 }}>
                        <Info size={16} />
                        参考: 初心者の目安
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>一般初心者:</span>
                            <span style={{ color: 'var(--color-text)' }}>{info.beginner}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>中級レベル:</span>
                            <span style={{ color: 'var(--color-text)' }}>{info.intermediate}</span>
                        </div>
                        <p style={{ margin: 0, opacity: 0.8 }}>{info.text}</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        width: '100%',
                        padding: '1.2rem',
                        background: color,
                        border: 'none',
                        borderRadius: 'var(--border-radius)',
                        color: '#000',
                        fontSize: '1rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    {isSaving ? '保存中...' : '記録を保存する'}
                </button>
            </div>
        </div>
    );
}
