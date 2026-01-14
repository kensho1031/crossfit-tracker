import { Edit, Trash2 } from 'lucide-react';
import type { DraftLog } from '../../types/draftLog';

interface DraftLogCardProps {
    draftLog: DraftLog;
    onEdit: (draftLog: DraftLog) => void;
    onDelete: (id: string) => void;
}

export function DraftLogCard({ draftLog, onEdit, onDelete }: DraftLogCardProps) {
    // Flatten steps from all sections for the preview
    const sections = draftLog.analyzedData.sections || { warmup: [], strength: [], wod: [] };
    const allExercises = [
        ...(sections.warmup || []),
        ...(sections.strength || []),
        ...(sections.wod || [])
    ];

    // Support legacy 'exercises' field if it exists temporarily
    const exercises = allExercises.length > 0 ? allExercises : ((draftLog.analyzedData as any).exercises || []);

    const weightedExercises = exercises.filter((ex: any) => ex.requiresWeight);

    return (
        <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--spacing-md)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-neon)';
                e.currentTarget.style.boxShadow = 'var(--shadow-neon)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => onEdit(draftLog)}
        >
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                {draftLog.imageUrl && (
                    <img
                        src={draftLog.imageUrl}
                        alt="WOD"
                        style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: 'var(--border-radius)'
                        }}
                    />
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: '0.25rem',
                                fontFamily: 'var(--font-body)'
                            }}>
                                未完了のログ
                            </div>
                            <div style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--color-primary-foreground)',
                                fontFamily: 'var(--font-heading)',
                                letterSpacing: 'var(--letter-spacing-tight)',
                                background: 'var(--color-primary)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                display: 'inline-block'
                            }}>
                                {draftLog.analyzedData.wodType || 'WOD'}
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(draftLog.id);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        {exercises.length} 種目
                        {weightedExercises.length > 0 && ` • ${weightedExercises.length} 件の重量入力が必要`}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {exercises.slice(0, 3).map((ex: any) => (
                            <div key={ex.id} style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                background: ex.requiresWeight ? 'var(--color-primary)' : 'rgba(128, 128, 128, 0.1)',
                                color: ex.requiresWeight ? 'var(--color-primary-foreground)' : 'var(--color-text-muted)',
                                fontWeight: ex.requiresWeight ? 600 : 400
                            }}>
                                {ex.name}
                            </div>
                        ))}
                        {exercises.length > 3 && (
                            <div style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                color: 'var(--color-text-muted)'
                            }}>
                                +{exercises.length - 3}
                            </div>
                        )}
                    </div>

                    <div style={{
                        marginTop: 'var(--spacing-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-primary)',
                        fontWeight: 600
                    }}>
                        <Edit size={14} />
                        クリックして編集
                    </div>
                </div>
            </div>
        </div>
    );
}
