import { useState, useEffect } from 'react';
import { PRService } from '../../services/PRService';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Calendar, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ExerciseMaster } from '../../types/pr';

interface PRRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: {
        exerciseName?: string;
        value?: number;
        unit?: string;
        date?: string;
        note?: string;
    };
}

export function PRRegisterModal({ isOpen, onClose, onSuccess, initialData }: PRRegisterModalProps) {
    const { user, currentBox } = useAuth();
    const [searchTerm, setSearchTerm] = useState(initialData?.exerciseName || '');
    const [selectedExercise, setSelectedExercise] = useState<ExerciseMaster | null>(null);
    const [searchResults, setSearchResults] = useState<ExerciseMaster[]>([]);

    const [value, setValue] = useState(initialData?.value?.toString() || '');
    const [min, setMin] = useState('');
    const [sec, setSec] = useState('');
    const [unit, setUnit] = useState(initialData?.unit || 'kg');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState(initialData?.note || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset or initialize state
            setSearchTerm(initialData?.exerciseName || '');
            setDate(initialData?.date || new Date().toISOString().slice(0, 10));
            setNote(initialData?.note || '');
            setSelectedExercise(null); // Reset selection

            // Initial Data Handling
            if (initialData?.unit === 'sec' || initialData?.unit === 'time') {
                const val = initialData.value || 0;
                setMin(Math.floor(val / 60).toString());
                setSec(Math.round(val % 60).toString());
                setValue('');
                setUnit('sec');
            } else {
                setValue(initialData?.value?.toString() || '');
                setUnit(initialData?.unit || 'kg');
                setMin('');
                setSec('');
            }

            // If we have an initial exercise name, try to find it automatically
            if (initialData?.exerciseName) {
                PRService.searchExercises(initialData.exerciseName).then(results => {
                    const exactMatch = results.find(ex => ex.name.toLowerCase() === initialData.exerciseName!.toLowerCase());
                    if (exactMatch) {
                        setSelectedExercise(exactMatch);
                        // If exact match is found, respect its default unit
                        if (exactMatch.measureType === 'time' || exactMatch.defaultUnit === 'sec') {
                            setUnit('sec');
                            // If initialData didn't have values but we selected a time exercise, ensure UI is correct
                            if (initialData.value === undefined) {
                                setMin(''); setSec(''); setValue('');
                            }
                        } else {
                            setUnit(exactMatch.defaultUnit);
                        }
                    }
                    setSearchResults(results);
                });
            }
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm) {
                const results = await PRService.searchExercises(searchTerm);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const handleSelectExercise = (ex: ExerciseMaster) => {
        setSelectedExercise(ex);
        setSearchTerm(ex.name);

        if (ex.measureType === 'time' || ex.defaultUnit === 'sec') {
            setUnit('sec');
        } else {
            setUnit(ex.defaultUnit);
        }
        setSearchResults([]); // Hide results
    };

    const handleSave = async () => {
        if (!user || !selectedExercise) return;

        let finalValue = 0;
        if (unit === 'sec' || unit === 'time') {
            finalValue = (parseFloat(min) || 0) * 60 + (parseFloat(sec) || 0);
            if (finalValue <= 0) return;
        } else {
            finalValue = parseFloat(value);
            if (!finalValue) return;
        }

        setLoading(true);
        try {
            await PRService.addPR({
                uid: user.uid,
                exerciseId: selectedExercise.id,
                exerciseName: selectedExercise.name,
                value: finalValue,
                unit,
                date,
                source: 'manual',
                note,
                boxId: currentBox?.id || null
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const isTime = unit === 'sec' || unit === 'time';

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.7)'
        }}>
            <div style={{
                background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
                width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>記録を登録</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Exercise Search */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>種目 (EXERCISE)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedExercise(null);
                                }}
                                placeholder="種目を検索 (例: Back Squat)"
                                style={{
                                    width: '100%', padding: '0.75rem', paddingLeft: '2.5rem',
                                    background: '#111', border: selectedExercise ? '1px solid #00ffff' : '1px solid #333',
                                    borderRadius: '8px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box'
                                }}
                            />
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        </div>

                        {/* Autocomplete Results */}
                        {searchResults.length > 0 && !selectedExercise && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                background: '#222', border: '1px solid #444', borderRadius: '8px', marginTop: '4px',
                                maxHeight: '200px', overflowY: 'auto'
                            }}>
                                {searchResults.map(ex => (
                                    <div
                                        key={ex.id}
                                        onClick={() => handleSelectExercise(ex)}
                                        style={{ padding: '0.75rem', borderBottom: '1px solid #333', cursor: 'pointer', color: '#ddd' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ fontWeight: 600 }}>{ex.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{ex.category}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Value & Unit */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {!isTime ? (
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>記録 (VALUE)</label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="0"
                                    style={{
                                        width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333',
                                        borderRadius: '8px', color: '#fff', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 2, display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>分 (Min)</label>
                                    <input
                                        type="number"
                                        value={min}
                                        onChange={(e) => setMin(e.target.value)}
                                        placeholder="0"
                                        style={{
                                            width: '100%', padding: '0.5rem', background: '#111', border: '1px solid #333',
                                            borderRadius: '8px', color: '#fff', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <span style={{ paddingBottom: '0.75rem', fontSize: '1.2rem', color: '#666' }}>:</span>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>秒 (Sec)</label>
                                    <input
                                        type="number"
                                        value={sec}
                                        onChange={(e) => setSec(e.target.value)}
                                        placeholder="00"
                                        style={{
                                            width: '100%', padding: '0.5rem', background: '#111', border: '1px solid #333',
                                            borderRadius: '8px', color: '#fff', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>単位 (UNIT)</label>
                            {isTime ? (
                                <div style={{
                                    width: '100%', padding: '0.5rem', flex: 1, background: '#111', border: '1px solid #333',
                                    borderRadius: '8px', color: '#888', fontSize: '1.2rem', fontWeight: 700, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
                                }}>
                                    Time
                                </div>
                            ) : (
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', height: '56px', background: '#111', border: '1px solid #333',
                                        borderRadius: '8px', color: '#ccc', fontSize: '1rem', boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="kg">kg</option>
                                    <option value="lb">lb</option>
                                    <option value="reps">reps</option>
                                    <option value="cal">cal</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>日付 (DATE)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', paddingLeft: '2.5rem',
                                    background: '#111', border: '1px solid #333',
                                    borderRadius: '8px', color: '#fff', fontFamily: 'monospace', boxSizing: 'border-box'
                                }}
                            />
                            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>メモ (NOTE) - Optional</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder=""
                            style={{
                                width: '100%', padding: '0.75rem', background: '#111', border: '1px solid #333',
                                borderRadius: '8px', color: '#fff', minHeight: '80px', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={!selectedExercise || (!value && !min && !sec) || loading}
                        className="w-full"
                        style={{ marginTop: '0.5rem', background: 'var(--color-neon)', color: '#000', fontWeight: 800 }}
                    >
                        {loading ? 'SAVING...' : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={20} />
                                保存する
                            </span>
                        )}
                    </Button>

                </div>
            </div>
        </div>
    );
}
