import { useState } from 'react';
import { Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ImageUploader } from '../log/ImageUploader';
import { analyzeWODImage } from '../../services/geminiService';
import type { AnalyzedWOD } from '../../types/draftLog';

interface WODAnalysisFlowProps {
    onComplete: (imageUrl: string, analyzedData: AnalyzedWOD) => void;
    onCancel: () => void;
}

export function WODAnalysisFlow({ onComplete, onCancel }: WODAnalysisFlowProps) {
    const [step, setStep] = useState<'upload' | 'analyzing' | 'preview'>('upload');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [analyzedData, setAnalyzedData] = useState<AnalyzedWOD | null>(null);
    const [error, setError] = useState<string>('');

    const handleUploadSuccess = async (url: string) => {
        setImageUrl(url);
        setStep('analyzing');
        setError('');

        try {
            const data = await analyzeWODImage(url);
            setAnalyzedData(data);
            setStep('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : '解析に失敗しました');
            setStep('upload');
        }
    };

    const handleSaveDraft = () => {
        if (analyzedData) {
            onComplete(imageUrl, analyzedData);
        }
    };

    if (step === 'upload') {
        return (
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: 'var(--spacing-lg)',
                maxWidth: '600px',
                margin: '0 auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <Camera size={48} color="var(--color-neon)" style={{ marginBottom: 'var(--spacing-sm)' }} />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        WODボードを撮影
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        ホワイトボードの写真をアップロードしてください
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 0, 0, 0.3)',
                        borderRadius: 'var(--border-radius)',
                        padding: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={20} color="#ff4444" />
                        <span style={{ color: '#ff4444', fontSize: '0.9rem' }}>{error}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'var(--spacing-md)' }}>
                    <ImageUploader onUploadSuccess={handleUploadSuccess} />
                    <button
                        onClick={onCancel}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            padding: '1rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'analyzing') {
        return (
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: 'var(--spacing-xl)',
                maxWidth: '600px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <Loader2 size={64} color="var(--color-neon)" style={{ animation: 'spin 1s linear infinite', marginBottom: 'var(--spacing-md)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    AI解析中...
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Gemini AIがWODを解析しています
                </p>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (step === 'preview' && analyzedData) {
        const hasAnyExercise =
            analyzedData.sections.warmup.length > 0 ||
            analyzedData.sections.strength.length > 0 ||
            analyzedData.sections.wod.length > 0;

        return (
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: 'var(--spacing-lg)',
                maxWidth: '700px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {analyzedData.manualModeRecommended ? (
                            <AlertCircle size={24} color="#f59e0b" />
                        ) : (
                            <CheckCircle size={24} color="var(--color-accent)" />
                        )}
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: 0 }}>
                            {analyzedData.manualModeRecommended ? '手動入力推奨' : '解析完了'}
                        </h3>
                    </div>
                </div>

                {analyzedData.manualModeRecommended && (
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--border-radius)',
                        padding: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '0.9rem',
                        color: '#f59e0b'
                    }}>
                        文字が読み取りにくい箇所があります。手動での確認を推奨します。
                    </div>
                )}

                {imageUrl && (
                    <img src={imageUrl} alt="WOD" style={{ width: '100%', borderRadius: 'var(--border-radius)', marginBottom: 'var(--spacing-md)', maxHeight: '200px', objectFit: 'cover' }} />
                )}

                {/* Sections */}
                {(['warmup', 'strength', 'wod'] as const).map(section => {
                    const exercises = analyzedData.sections[section];
                    if (exercises.length === 0) return null;

                    return (
                        <div key={section} style={{ marginBottom: 'var(--spacing-md)' }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '0.5rem',
                                borderLeft: `4px solid ${section === 'warmup' ? '#aaa' : section === 'strength' ? 'var(--color-accent)' : 'var(--color-neon)'}`,
                                paddingLeft: '8px'
                            }}>
                                {section}
                            </div>
                            {exercises.map((ex) => (
                                <div key={ex.id} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 'var(--border-radius)',
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{ex.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            {ex.reps} {ex.sets && `(${ex.sets} sets)`}
                                        </div>
                                    </div>
                                    {ex.suggestedWeight && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                                            {ex.suggestedWeight}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}

                {!hasAnyExercise && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        種目を検出できませんでした。
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--spacing-lg)' }}>
                    <button
                        onClick={handleSaveDraft}
                        className="primary"
                        style={{
                            flex: 2,
                            padding: '1rem',
                            fontSize: '1rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-body)',
                            borderRadius: '12px'
                        }}
                    >
                        {analyzedData.manualModeRecommended ? '手動で詳しく入力する' : '下書きとして保存'}
                    </button>
                    <button
                        onClick={() => setStep('upload')}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}
                    >
                        撮り直す
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
