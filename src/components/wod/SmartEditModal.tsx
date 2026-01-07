import { useState, useEffect } from 'react';
import { X, Save, Dumbbell, Trophy } from 'lucide-react';
import type { DraftLog, Exercise } from '../../types/draftLog';
import { db } from '../../firebase/config';
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { PRService } from '../../services/PRService';
import { PRRegisterModal } from '../pr/PRRegisterModal';
import type { ExerciseMaster } from '../../types/pr';

interface SmartEditModalProps {
    draftLog: DraftLog;
    onClose: () => void;
    onSave: () => void;
}

export function SmartEditModal({ draftLog, onClose, onSave }: SmartEditModalProps) {
    const [userInputs, setUserInputs] = useState(draftLog.userInputs || {});
    const [saving, setSaving] = useState(false);

    // PR Integration State
    const [knownExercises, setKnownExercises] = useState<ExerciseMaster[]>([]);
    const [prModalOpen, setPrModalOpen] = useState(false);
    const [selectedPrCandidate, setSelectedPrCandidate] = useState<{ name: string, weight?: string } | null>(null);

    // Support legacy logs that might not have 'sections'
    const initialSections = draftLog.analyzedData.sections || {
        warmup: [],
        strength: (draftLog.analyzedData as any).exercises || [],
        wod: []
    };
    const [sections, setSections] = useState(initialSections);

    useEffect(() => {
        // Load known exercises for PR matching
        setKnownExercises(PRService.getAllExercises());
    }, []);

    const findMatchingExercise = (name: string): ExerciseMaster | undefined => {
        const normalized = name.toLowerCase().trim();
        return knownExercises.find(ex =>
            ex.name.toLowerCase() === normalized ||
            ex.aliases.some(alias => alias.toLowerCase() === normalized)
        );
    };

    const handlePRClick = (ex: Exercise) => {
        const userInputWeight = userInputs[ex.id]?.weight;
        // Clean weight string (remove 'kg', 'lbs' etc if present, though input might be raw)
        // If input is "100", use it. If "100kg", parse it. 
        // For now, pass raw string to modal and let user confirm.
        const weight = userInputWeight || ex.suggestedWeight || '';
        const cleanWeight = weight.replace(/[^\d.]/g, '');

        setSelectedPrCandidate({
            name: ex.name,
            weight: cleanWeight ? parseFloat(cleanWeight).toString() : undefined
        });
        setPrModalOpen(true);
    };

    const handleWeightChange = (exerciseId: string, weight: string) => {
        setUserInputs(prev => ({
            ...prev,
            [exerciseId]: { ...prev[exerciseId], weight }
        }));
    };

    const toggleCategory = (exerciseId: string, currentCategory: 'warmup' | 'strength' | 'wod') => {
        const categories: ('warmup' | 'strength' | 'wod')[] = ['warmup', 'strength', 'wod'];
        const nextCategory = categories[(categories.indexOf(currentCategory) + 1) % categories.length];

        const newSections = { ...sections };
        let exercise: any = null;

        // Find and remove from current section
        newSections[currentCategory] = newSections[currentCategory].filter(ex => {
            if (ex.id === exerciseId) {
                exercise = { ...ex, category: nextCategory };
                return false;
            }
            return true;
        });

        // Add to next section
        if (exercise) {
            newSections[nextCategory] = [...newSections[nextCategory], exercise];
        }

        setSections(newSections);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const draftRef = doc(db, 'draftLogs', draftLog.id);
            await updateDoc(draftRef, {
                userInputs,
                'analyzedData.sections': sections,
                updatedAt: serverTimestamp()
            });

            const now = new Date();
            const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 10);

            const logData = {
                uid: draftLog.uid,
                date: localDate,
                photoUrl: draftLog.imageUrl,
                memo: generateMemoFromSections(sections, userInputs),
                rpe: 3,
                condition: 'Normal',
                createdAt: serverTimestamp(),
                analysisConfidence: draftLog.analyzedData.confidence || 0
            };

            await addDoc(collection(db, 'logs'), logData);

            // Log the analysis stats for later improvement
            await addDoc(collection(db, 'analysisLogs'), {
                uid: draftLog.uid,
                confidence: draftLog.analyzedData.confidence,
                hadCorrections: JSON.stringify(sections) !== JSON.stringify(draftLog.analyzedData.sections),
                timestamp: serverTimestamp()
            });

            await deleteDoc(draftRef);
            onSave();
        } catch (error) {
            console.error('Error saving log:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-md)',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #1e1e24 0%, #121216 100%)',
                borderRadius: 'var(--border-radius-lg)',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    position: 'sticky',
                    top: 0,
                    background: 'rgba(20, 20, 25, 0.9)',
                    backdropFilter: 'blur(5px)',
                    borderBottom: '1px solid var(--color-border)',
                    padding: '1.25rem 2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 10
                }}>
                    <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: 0 }}>WOD記録の編集</h3>
                        {draftLog.analyzedData.confidence !== undefined && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                AI信頼度: {Math.round(draftLog.analyzedData.confidence * 100)}%
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    {draftLog.imageUrl && (
                        <div style={{ marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <img src={draftLog.imageUrl} alt="WOD Board" style={{ width: '100%', display: 'block' }} />
                        </div>
                    )}

                    {(['warmup', 'strength', 'wod'] as const).map(sectionKey => {
                        const exercises = sections[sectionKey];
                        if (exercises.length === 0 && sectionKey !== 'wod') return null;

                        return (
                            <div key={sectionKey} style={{ marginBottom: '2.5rem' }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 900,
                                    color: sectionKey === 'wod' ? 'var(--color-neon)' : 'var(--color-text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '3px',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <div style={{ width: '30px', height: '2px', background: 'currentColor', opacity: 0.3 }}></div>
                                    {sectionKey}
                                </div>

                                {exercises.map((ex) => {
                                    const isMatch = findMatchingExercise(ex.name);

                                    return (
                                        <div key={ex.id} style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            padding: '1.25rem',
                                            marginBottom: '1rem',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="text"
                                                            value={ex.name}
                                                            onChange={(e) => {
                                                                const newSections = { ...sections };
                                                                const idx = newSections[sectionKey].findIndex(e => e.id === ex.id);
                                                                newSections[sectionKey][idx].name = e.target.value;
                                                                setSections(newSections);
                                                            }}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'var(--color-text)',
                                                                fontSize: '1.1rem',
                                                                fontWeight: 700,
                                                                width: '100%',
                                                                outline: 'none',
                                                                padding: 0
                                                            }}
                                                        />
                                                        {isMatch && (
                                                            <button
                                                                onClick={() => handlePRClick(ex)}
                                                                title="Register as PR"
                                                                style={{
                                                                    background: 'rgba(255, 215, 0, 0.1)',
                                                                    border: '1px solid rgba(255, 215, 0, 0.3)',
                                                                    borderRadius: '50%',
                                                                    padding: '4px',
                                                                    cursor: 'pointer',
                                                                    color: '#ffd700',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <Trophy size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                                        <input
                                                            type="text"
                                                            value={ex.reps}
                                                            placeholder="Reps"
                                                            onChange={(e) => {
                                                                const newSections = { ...sections };
                                                                const idx = newSections[sectionKey].findIndex(e => e.id === ex.id);
                                                                newSections[sectionKey][idx].reps = e.target.value;
                                                                setSections(newSections);
                                                            }}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.85rem', width: '80px', outline: 'none' }}
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleCategory(ex.id, sectionKey)}
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        color: 'var(--color-text-muted)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    移動
                                                </button>
                                            </div>

                                            {(ex.requiresWeight || ex.category === 'strength') && (
                                                <div style={{ position: 'relative' }}>
                                                    <Dumbbell size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} />
                                                    <input
                                                        type="text"
                                                        placeholder={ex.suggestedWeight || '重量を入力...'}
                                                        value={userInputs[ex.id]?.weight || ''}
                                                        onChange={(e) => handleWeightChange(ex.id, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '8px',
                                                            color: 'var(--color-accent)',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={() => {
                                        const newSections = { ...sections };
                                        newSections[sectionKey].push({
                                            id: `new-${Date.now()}`,
                                            name: '',
                                            reps: '',
                                            requiresWeight: sectionKey === 'strength',
                                            category: sectionKey
                                        });
                                        setSections(newSections);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'transparent',
                                        border: '1px dashed rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'var(--color-text-muted)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + 種目を追加
                                </button>
                            </div>
                        );
                    })}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="primary"
                            style={{ flex: 2, padding: '1.25rem', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            <Save size={20} />
                            {saving ? '保存中...' : 'ログを保存'}
                        </button>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '1.25rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 'var(--border-radius)', cursor: 'pointer', fontWeight: 600 }}
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>

            <PRRegisterModal
                isOpen={prModalOpen}
                onClose={() => setPrModalOpen(false)}
                onSuccess={() => {
                    alert('PRを保存しました！');
                    // Ensure the modal refreshes any state if needed, though PRs are global
                }}
                initialData={selectedPrCandidate ? {
                    exerciseName: selectedPrCandidate.name,
                    value: selectedPrCandidate.weight ? parseFloat(selectedPrCandidate.weight) : undefined
                    // Date defaults to today in modal, which matches draft log use case usually
                } : undefined}
            />
        </div>
    );
}

function generateMemoFromSections(sections: any, userInputs: any): string {
    let memo = '';

    (['warmup', 'strength', 'wod'] as const).forEach(key => {
        const exercises = sections[key];
        if (exercises.length === 0) return;

        memo += `[${key.toUpperCase()}]\n`;
        exercises.forEach((ex: any) => {
            const weight = userInputs[ex.id]?.weight || ex.suggestedWeight || '';
            memo += `- ${ex.name}: ${ex.reps}`;
            if (weight) memo += ` (@${weight})`;
            memo += '\n';
        });
        memo += '\n';
    });

    return memo.trim();
}
