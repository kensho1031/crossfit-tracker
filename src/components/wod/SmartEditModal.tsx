import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Dumbbell, Trophy, Trash2 } from 'lucide-react';
import { getCategoriesByExercises } from '../../utils/workoutUtils';
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
    const { currentBox } = useAuth();

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

    // Additional fields matching manual LOG flow
    const [customMemo, setCustomMemo] = useState('');
    const [rpe, setRPE] = useState(5);
    const [condition, setCondition] = useState<'Good' | 'Normal' | 'Tired'>('Normal');
    const [includeWarmup, setIncludeWarmup] = useState(true);

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

        newSections[currentCategory] = newSections[currentCategory].filter(ex => {
            if (ex.id === exerciseId) {
                exercise = { ...ex, category: nextCategory };
                return false;
            }
            return true;
        });

        if (exercise) {
            newSections[nextCategory] = [...newSections[nextCategory], exercise];
        }

        setSections(newSections);
    };

    const generateMemoFromSections = (sections: any, userInputs: any) => {
        const parts: string[] = [];
        (['wod', 'strength', 'warmup'] as const).forEach(key => {
            const exercises = sections[key];
            if (!includeWarmup && key === 'warmup') return;
            if (exercises.length > 0) {
                parts.push(`[${key.toUpperCase()}]`);
                exercises.forEach((ex: any) => {
                    const weight = userInputs[ex.id]?.weight;
                    let text = `- ${ex.name}: ${ex.reps}`;
                    if (weight) text += ` @ ${weight}`;
                    parts.push(text);
                });
                parts.push('');
            }
        });
        return parts.join('\n').trim();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const draftRef = doc(db, 'draftLogs', draftLog.id);
            const finalSections = { ...sections };
            if (!includeWarmup) {
                finalSections.warmup = [];
            }

            // Extract all exercises from sections for summary
            const allExercises = [
                ...finalSections.warmup.map(e => e.name),
                ...finalSections.strength.map(e => e.name),
                ...finalSections.wod.map(e => e.name)
            ].filter(Boolean);

            const exercises = allExercises.length > 0 ? allExercises : ["other"];
            const categories = getCategoriesByExercises(exercises);

            await updateDoc(draftRef, {
                userInputs,
                'analyzedData.sections': finalSections,
                updatedAt: serverTimestamp()
            });

            const now = new Date();
            const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 10);

            const logData = {
                uid: draftLog.uid,
                type: 'wod',
                source: 'scan',
                date: localDate,
                photoUrl: draftLog.imageUrl,
                raw_text: customMemo.trim() || generateMemoFromSections(sections, userInputs),
                rpe,
                condition,
                exercises,
                categories,
                analysisConfidence: draftLog.analyzedData.confidence || 0,
                boxId: currentBox?.id || null,
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'calendar_entries'), {
                ...logData,
                createdAt: serverTimestamp()
            });

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
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 'var(--spacing-md)', backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #1e1e24 0%, #121216 100%)',
                borderRadius: 'var(--border-radius-lg)', maxWidth: '800px', width: '100%',
                maxHeight: '90vh', overflow: 'auto', position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    position: 'sticky', top: 0, background: 'rgba(20, 20, 25, 0.9)',
                    backdropFilter: 'blur(5px)', borderBottom: '1px solid var(--color-border)',
                    padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
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

                    {/* Warmup Toggle */}
                    <div style={{
                        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <input
                            type="checkbox"
                            id="includeWarmup"
                            checked={includeWarmup}
                            onChange={(e) => setIncludeWarmup(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="includeWarmup" style={{ fontSize: '0.9rem', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 600 }}>
                            Warmup（準備運動）を含める
                        </label>
                    </div>

                    {(['wod', 'strength', 'warmup'] as const).map(sectionKey => {
                        const exercises = sections[sectionKey];
                        if (!includeWarmup && sectionKey === 'warmup') return null;
                        if (exercises.length === 0 && sectionKey !== 'wod') return null;

                        return (
                            <div key={sectionKey} style={{ marginBottom: '2.5rem' }}>
                                <div style={{
                                    fontSize: '0.9rem', fontWeight: 900, color: sectionKey === 'wod' ? 'var(--color-neon)' : 'var(--color-text)',
                                    textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '0.5rem 0', position: 'relative'
                                }}>
                                    <div style={{ flex: 1, height: '1px', background: 'currentColor', opacity: 0.2 }}></div>
                                    {sectionKey}
                                    <div style={{ flex: 1, height: '1px', background: 'currentColor', opacity: 0.2 }}></div>
                                </div>

                                {exercises.map((ex) => {
                                    const isMatch = findMatchingExercise(ex.name);
                                    return (
                                        <div key={ex.id} style={{
                                            padding: '0.4rem 0 0.8rem 0',
                                            marginBottom: '0.4rem',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '0.75rem', width: '100%' }}>
                                                <div style={{ flex: 1 }}>
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
                                                            background: 'transparent', border: 'none',
                                                            color: 'var(--color-text)', fontSize: ex.name.length > 20 ? '0.9rem' : '1.1rem', fontWeight: 700,
                                                            width: '100%', outline: 'none', padding: '2px 0', boxSizing: 'border-box'
                                                        }}
                                                        placeholder="Exercise name"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (!confirm('この種目を削除しますか？')) return;
                                                        const newSections = { ...sections };
                                                        newSections[sectionKey] = newSections[sectionKey].filter(e => e.id !== ex.id);
                                                        setSections(newSections);
                                                    }}
                                                    style={{
                                                        background: 'transparent', border: 'none',
                                                        color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', minWidth: '24px', height: '24px', flexShrink: 0, opacity: 0.5
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: (ex.requiresWeight || ex.category === 'strength') ? '0.75rem' : 0 }}>
                                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                                    <input
                                                        type="text"
                                                        value={ex.reps}
                                                        placeholder="Reps (e.g., 5x5)"
                                                        onChange={(e) => {
                                                            const newSections = { ...sections };
                                                            const idx = newSections[sectionKey].findIndex(e => e.id === ex.id);
                                                            newSections[sectionKey][idx].reps = e.target.value;
                                                            setSections(newSections);
                                                        }}
                                                        style={{
                                                            width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
                                                            color: 'var(--color-text)', fontSize: '0.9rem', padding: '6px 10px', borderRadius: '6px', outline: 'none', boxSizing: 'border-box'
                                                        }}
                                                    />
                                                </div>
                                                <select
                                                    value={sectionKey}
                                                    onChange={() => toggleCategory(ex.id, sectionKey)}
                                                    style={{
                                                        flex: '0 0 auto', fontSize: '0.8rem', padding: '6px 8px', borderRadius: '6px',
                                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                        color: 'var(--color-text-muted)', cursor: 'pointer', outline: 'none', minWidth: '80px'
                                                    }}
                                                >
                                                    <option value="warmup" style={{ color: 'black' }}>WARM</option>
                                                    <option value="strength" style={{ color: 'black' }}>STR</option>
                                                    <option value="wod" style={{ color: 'black' }}>WOD</option>
                                                </select>
                                                {isMatch && (
                                                    <button
                                                        onClick={() => handlePRClick(ex)}
                                                        style={{
                                                            flex: '0 0 auto', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)',
                                                            borderRadius: '6px', padding: '8px', cursor: 'pointer', color: '#ffd700', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', minWidth: '40px'
                                                        }}
                                                    >
                                                        <Trophy size={18} />
                                                    </button>
                                                )}
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
                                                            width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', background: 'rgba(0,0,0,0.2)',
                                                            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--color-accent)',
                                                            fontSize: '0.95rem', fontWeight: 600, boxSizing: 'border-box'
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
                                            id: `new-${Date.now()}`, name: '', reps: '', requiresWeight: sectionKey === 'strength', category: sectionKey
                                        });
                                        setSections(newSections);
                                    }}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)',
                                        borderRadius: '12px', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer'
                                    }}
                                >
                                    + 種目を追加
                                </button>
                            </div>
                        );
                    })}

                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>追加情報（任意）</h4>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>メモ</label>
                            <textarea
                                value={customMemo}
                                onChange={(e) => setCustomMemo(e.target.value)}
                                placeholder="トレーニングの感想など..."
                                style={{
                                    width: '100%', minHeight: '80px', padding: '0.75rem', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text)',
                                    fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>RPE（強度: 1-10）</label>
                            <select
                                value={rpe}
                                onChange={(e) => setRPE(Number(e.target.value))}
                                style={{
                                    width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', color: 'var(--color-text)', fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n} style={{ color: 'black' }}>{n}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>体調</label>
                            <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value as 'Good' | 'Normal' | 'Tired')}
                                style={{
                                    width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', color: 'var(--color-text)', fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                <option value="Good" style={{ color: 'black' }}>Good</option>
                                <option value="Normal" style={{ color: 'black' }}>Normal</option>
                                <option value="Tired" style={{ color: 'black' }}>Tired</option>
                            </select>
                        </div>
                    </div>

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

                <PRRegisterModal
                    isOpen={prModalOpen}
                    onClose={() => setPrModalOpen(false)}
                    onSuccess={() => alert('PRを保存しました！')}
                    initialData={selectedPrCandidate ? {
                        exerciseName: selectedPrCandidate.name,
                        value: selectedPrCandidate.weight ? parseFloat(selectedPrCandidate.weight) : undefined
                    } : undefined}
                />
            </div>
        </div>
    );
}
