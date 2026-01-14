import { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import type { ScoreType } from '../../types/class';
import { saveScore } from '../../services/scoreService';

interface ScoreInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId?: string; // Add classId prop
    title: string;
    defaultType?: ScoreType;
    onSaveSuccess?: () => void; // Callback to refresh list
}

export function ScoreInputModal({ isOpen, onClose, classId, title, defaultType = 'time', onSaveSuccess }: ScoreInputModalProps) {
    const [scoreType, setScoreType] = useState<ScoreType>(defaultType);
    const [scoreValue, setScoreValue] = useState('');
    const [isRx, setIsRx] = useState(true);
    const [note, setNote] = useState('');
    const [showPR, setShowPR] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!classId) return;
        if (!scoreValue) return alert("Please enter a score");

        setIsSubmitting(true);
        try {
            await saveScore({
                classId,
                scoreType,
                scoreValue,
                isRx,
                note
            });
            onClose();
            if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to save score");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Mock PR Data
    const currentPR = "12:45";

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end', // Bottom sheet style
            justifyContent: 'center'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)'
                }}
            />

            {/* Modal Content */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                background: 'var(--color-bg)',
                borderRadius: '24px 24px 0 0',
                padding: 'var(--spacing-md)',
                position: 'relative',
                animation: 'slideUp 0.3s ease-out',
                borderTop: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: 0 }}>
                        {title}
                    </h2>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* PR Trophy Icon */}
                        <button
                            onClick={() => setShowPR(!showPR)}
                            style={{
                                background: showPR ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: 'none'
                            }}
                        >
                            <Trophy size={24} color={showPR ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                        </button>

                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--color-text)', boxShadow: 'none' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* PR Popup Card (Small) */}
                {showPR && (
                    <div style={{
                        position: 'absolute',
                        top: '70px',
                        right: '20px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-primary)',
                        padding: '1rem',
                        borderRadius: 'var(--border-radius)',
                        zIndex: 10,
                        boxShadow: 'var(--shadow-md)',
                        animation: 'fadeIn 0.2s',
                        minWidth: '150px'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>CURRENT PR</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
                            {currentPR}
                        </div>
                    </div>
                )}

                {/* Score Type Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--color-surface)',
                    padding: '4px',
                    borderRadius: '12px',
                    marginBottom: '2rem'
                }}>
                    {(['time', 'reps', 'weight'] as ScoreType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setScoreType(type)}
                            style={{
                                flex: 1,
                                background: scoreType === type ? 'var(--color-bg)' : 'transparent',
                                color: scoreType === type ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                textTransform: 'capitalize',
                                fontWeight: scoreType === type ? 700 : 500,
                                fontSize: '0.9rem',
                                boxShadow: scoreType === type ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Main Input Area */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={scoreType === 'time' ? "text" : "number"}
                            placeholder={
                                scoreType === 'time' ? "12:30" :
                                    scoreType === 'reps' ? "150" : "100"
                            }
                            value={scoreValue}
                            onChange={(e) => setScoreValue(e.target.value)}
                            style={{
                                width: '100%',
                                fontSize: '3rem',
                                fontFamily: 'var(--font-heading)',
                                textAlign: 'center',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid var(--color-border)',
                                borderRadius: 0,
                                padding: '10px',
                                color: 'var(--color-text)',
                                boxShadow: 'none'
                            }}
                            autoFocus
                        />
                        {scoreType === 'weight' && (
                            <span style={{
                                position: 'absolute',
                                right: '2rem',
                                bottom: '1.5rem',
                                fontSize: '1rem',
                                color: 'var(--color-text-muted)'
                            }}>kg</span>
                        )}
                    </div>
                </div>

                {/* Rx / Scaled Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                    <button
                        onClick={() => setIsRx(true)}
                        style={{
                            background: isRx ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: isRx ? 'var(--color-primary-foreground)' : 'var(--color-text-muted)',
                            border: '1px solid',
                            borderColor: isRx ? 'var(--color-primary)' : 'var(--color-border)',
                            minWidth: '100px',
                            boxShadow: 'none'
                        }}
                    >
                        Rx
                    </button>
                    <button
                        onClick={() => setIsRx(false)}
                        style={{
                            background: !isRx ? 'var(--color-secondary)' : 'var(--color-surface)',
                            color: !isRx ? 'white' : 'var(--color-text-muted)',
                            border: '1px solid',
                            borderColor: !isRx ? 'var(--color-secondary)' : 'var(--color-border)',
                            minWidth: '100px',
                            boxShadow: 'none'
                        }}
                    >
                        Scaled
                    </button>
                </div>

                {/* Optional Notes */}
                <div style={{ marginBottom: '2rem' }}>
                    <textarea
                        placeholder="Notes (optional)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            resize: 'none',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)'
                        }}
                    />
                </div>

                {/* Save Button */}
                <button
                    className="primary"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    style={{
                        width: '100%',
                        padding: '1.2rem',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        boxShadow: 'var(--shadow-glow)',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'SAVING...' : 'SAVE RESULT'}
                </button>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
