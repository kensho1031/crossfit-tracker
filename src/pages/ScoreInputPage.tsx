import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Activity, Dumbbell, History, ChevronDown, ChevronUp } from 'lucide-react';
import { getDailyClass } from '../services/classService';
import { saveScore, getUserHistory } from '../services/scoreService';
import { useAuth } from '../contexts/AuthContext';
import type { DailyClass } from '../types/class';

// Extended state for score inputs
type ScoreInputState = {
    // For Rounds+Reps / Time / Reps
    value1: string; // Rounds / Min / Reps / Points
    value2: string; // Reps / Sec

    // For Weight (Strength)
    weightSets: string[]; // Array of weight values for each set

    isRx: boolean;
    note: string;
};

export function ScoreInputPage() {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [dailyClass, setDailyClass] = useState<DailyClass | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // History State
    const [histories, setHistories] = useState<Record<string, any[]>>({});

    // Form State
    const [scores, setScores] = useState<Record<string, ScoreInputState>>({});

    // UI State: Collapsed sections
    const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const loadClass = async () => {
            if (!date || !user) return;
            try {
                const data = await getDailyClass(date);
                setDailyClass(data);

                // Initialize state and fetch history
                if (data && data.sections) {
                    const initialScores: Record<string, ScoreInputState> = {};
                    const historyPromises = data.sections.map(async (section) => {
                        // Allow note input even if scoreType is none or missing, but prioritize scorable ones for history
                        const defaultSets = section.sets ? Array(Number(section.sets)).fill('') : [''];

                        initialScores[section.id] = {
                            value1: '',
                            value2: '',
                            weightSets: defaultSets,
                            isRx: true,
                            note: ''
                        };

                        // Load history if wodName exists and it's a scorable section
                        if ((section.scoreType && section.scoreType !== 'none') && (section.wodName || section.title)) {
                            const historyData = await getUserHistory(user.uid, section.wodName || section.title || '');
                            return { id: section.id, data: historyData };
                        }
                        return null;
                    });

                    const historyResults = await Promise.all(historyPromises);
                    const historyMap: Record<string, any[]> = {};
                    historyResults.forEach(res => {
                        if (res) historyMap[res.id] = res.data;
                    });

                    setScores(initialScores);
                    setHistories(historyMap);
                }
            } catch (error) {
                console.error("Failed to load class:", error);
            } finally {
                setLoading(false);
            }
        };
        loadClass();
    }, [date, user]);

    const toggleSection = (sectionId: string) => {
        setCollapsedMap(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleScoreChange = (sectionId: string, field: keyof ScoreInputState, value: any) => {
        setScores(prev => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [field]: value
            }
        }));
    };

    const handleWeightChange = (sectionId: string, index: number, value: string) => {
        setScores(prev => {
            const currentSets = [...prev[sectionId].weightSets];
            currentSets[index] = value;
            return {
                ...prev,
                [sectionId]: {
                    ...prev[sectionId],
                    weightSets: currentSets
                }
            };
        });
    };

    const handleSaveAll = async () => {
        if (!dailyClass || !date || !user) return;
        setSaving(true);
        try {
            const savePromises = Object.entries(scores).map(async ([sectionId, scoreData]) => {
                const section = dailyClass.sections.find(s => s.id === sectionId);
                if (!section) return;

                let resultString = '';

                // 1. Validation & Formatting
                if (section.scoreType === 'rounds_reps') {
                    if (scoreData.value1) {
                        resultString = `${scoreData.value1} rounds + ${scoreData.value2 || '0'} reps`;
                    }
                } else if (section.scoreType === 'time') {
                    if (scoreData.value1 || scoreData.value2) {
                        const min = scoreData.value1.padStart(2, '0') || '00';
                        const sec = scoreData.value2.padStart(2, '0') || '00';
                        resultString = `${min}:${sec}`;
                    }
                } else if (section.scoreType === 'weight') {
                    const validSets = scoreData.weightSets.filter(w => w.trim() !== '');
                    if (validSets.length > 0) {
                        resultString = validSets.map(w => `${w}kg`).join(' / ');
                    }
                } else if (section.scoreType === 'reps') {
                    if (scoreData.value1) resultString = `${scoreData.value1} reps`;
                } else if (section.scoreType === 'points') {
                    if (scoreData.value1) resultString = `${scoreData.value1} pts`;
                }

                // Skip if no score AND no note (unless it's explicitly 'none' type where we might just save a note)
                if (!resultString && !scoreData.note) return;

                await saveScore({
                    classId: dailyClass.id,
                    scoreType: section.scoreType || 'none',
                    scoreValue: resultString, // Can be empty string if only note
                    isRx: scoreData.isRx,
                    note: scoreData.note,
                    title: section.title,
                    wodName: section.wodName || section.title
                });
            });

            await Promise.all(savePromises);

            navigate(`/class/${date}`);
        } catch (error) {
            console.error("Save failed:", error);
            alert("保存に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (!dailyClass) return <div className="p-4 text-center">Class not found</div>;

    const scorableSections = dailyClass.sections;

    return (
        <div style={{ paddingBottom: '120px', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                .score-card {
                    background: var(--color-surface);
                    margin: 0.8rem;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05); /* Softer border */
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                .score-label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                    margin-bottom: 4px;
                    font-weight: 500;
                    text-align: left;
                    letter-spacing: 0.5px;
                }
                .score-input {
                    width: 100%;
                    padding: 0.6rem;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    color: #fff;
                    font-size: 1rem;
                    text-align: left;
                    padding-left: 0.8rem;
                    font-family: var(--font-number);
                    box-sizing: border-box; /* Fix overflow */
                }
                .score-input:focus {
                    border-color: var(--color-primary);
                    background: rgba(255,255,255,0.08);
                    outline: none;
                }
                .rx-container {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 1rem;
                }
                .rx-btn {
                    flex: 1;
                    padding: 0.6rem;
                    text-align: center;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--color-text-muted);
                    background: transparent;
                }
                .rx-btn.active {
                    background: var(--color-primary);
                    color: black;
                    border-color: var(--color-primary);
                    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
                }
                .history-item {
                    display: flex; justify-content: space-between;
                    padding: 0.5rem 0; 
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    font-size: 0.75rem; color: var(--color-text-muted);
                }
                .header-title {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: bold;
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis;
                }
            `}</style>

            {/* Header */}
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg)' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>RECORD RESULTS</h1>
            </div>

            <div style={{ maxWidth: '480px', margin: '0 auto' }}> { /* Reduced max-width for more compact mobile feel */}
                {scorableSections.map(section => {
                    const state = scores[section.id] || { value1: '', value2: '', weightSets: [''], isRx: true, note: '' };

                    // Determine Color based on Type (Matching ClassDetail logic)
                    let sectionColor = '#9E9E9E'; // Default text-muted (Gray for Warmup, Extra Credit, Mobility etc)
                    if (section.type === 'wod') sectionColor = 'var(--color-neon)';
                    else if (section.type === 'strength') sectionColor = 'var(--color-accent)'; // Gold/Orange
                    else if (section.type === 'skill') sectionColor = '#2196F3'; // Blue
                    // Warmup falls to default Gray (#9E9E9E)

                    const sectionHistory = histories[section.id] || [];
                    const showInput = section.scoreType && section.scoreType !== 'none';
                    const isCollapsed = collapsedMap[section.id];
                    const isStrength = section.type === 'strength';

                    return (
                        <div key={section.id} className="score-card" style={{ borderLeft: `3px solid ${sectionColor}` }}>
                            {/* Section Header */}
                            <div
                                onClick={() => toggleSection(section.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    marginBottom: isCollapsed ? '0' : '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {isStrength ?
                                    <Dumbbell size={16} color={sectionColor} /> :
                                    <Activity size={16} color={sectionColor} />
                                }
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', letterSpacing: '0.5px' }}>
                                        {section.type}
                                    </span>
                                    <h2 className="header-title" style={{ color: isCollapsed ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                                        {/* Updated Default Title Logic: Use section title OR uppercase Type */}
                                        {section.title || section.type.replace(/_/g, ' ').toUpperCase()}
                                    </h2>
                                </div>
                                {isCollapsed ? <ChevronDown size={16} color="var(--color-text-muted)" /> : <ChevronUp size={16} color="var(--color-text-muted)" />}
                            </div>

                            {!isCollapsed && (
                                <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                                    {/* History / PR Section */}
                                    {sectionHistory.length > 0 && showInput && (
                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)', padding: '10px',
                                            borderRadius: '6px', marginBottom: '1rem',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'gold', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                                <History size={10} /> RECENT HISTORY
                                            </div>
                                            {sectionHistory.slice(0, 3).map((h, idx) => (
                                                <div key={idx} className="history-item">
                                                    <span>{h.date}</span>
                                                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{h.result} {h.isRx ? '' : '(Scaled)'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Dynamic Input Fields */}
                                    {showInput && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            {section.scoreType === 'time' && (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <span className="score-label">MINUTES</span>
                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                type="number"
                                                                className="score-input"
                                                                placeholder="00"
                                                                value={state.value1}
                                                                onChange={e => handleScoreChange(section.id, 'value1', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', paddingTop: '16px', color: 'var(--color-text-muted)' }}>:</span>
                                                    <div style={{ flex: 1 }}>
                                                        <span className="score-label">SECONDS</span>
                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                type="number"
                                                                className="score-input"
                                                                placeholder="00"
                                                                value={state.value2}
                                                                onChange={e => handleScoreChange(section.id, 'value2', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {section.scoreType === 'rounds_reps' && (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <span className="score-label">ROUNDS</span>
                                                        <input
                                                            type="number"
                                                            className="score-input"
                                                            placeholder="5"
                                                            value={state.value1}
                                                            onChange={e => handleScoreChange(section.id, 'value1', e.target.value)}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <span className="score-label">REPS</span>
                                                        <input
                                                            type="number"
                                                            className="score-input"
                                                            placeholder="12"
                                                            value={state.value2}
                                                            onChange={e => handleScoreChange(section.id, 'value2', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {section.scoreType === 'weight' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {state.weightSets.map((val, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ width: '30px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                                                #{idx + 1}
                                                            </span>
                                                            <div style={{ flex: 1, position: 'relative' }}>
                                                                <input
                                                                    type="number"
                                                                    className="score-input"
                                                                    placeholder="60"
                                                                    value={val}
                                                                    onChange={e => handleWeightChange(section.id, idx, e.target.value)}
                                                                    style={{ marginBottom: 0 }}
                                                                />
                                                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>kg</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {(section.scoreType === 'reps' || section.scoreType === 'points') && (
                                                <div>
                                                    <span className="score-label">{section.scoreType === 'reps' ? 'TOTAL REPS' : 'TOTAL POINTS'}</span>
                                                    <input
                                                        type="number"
                                                        className="score-input"
                                                        placeholder="100"
                                                        value={state.value1}
                                                        onChange={e => handleScoreChange(section.id, 'value1', e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Rx / Scaled Toggle (For WODs mainly, and only if scorable) */}
                                    {!isStrength && showInput && (
                                        <div className="rx-container">
                                            <div
                                                className={`rx-btn ${state.isRx ? 'active' : ''}`}
                                                onClick={() => handleScoreChange(section.id, 'isRx', true)}
                                            >
                                                Rx
                                            </div>
                                            <div
                                                className={`rx-btn ${!state.isRx ? 'active' : ''}`}
                                                onClick={() => handleScoreChange(section.id, 'isRx', false)}
                                            >
                                                Scaled
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div>
                                        <span className="score-label">NOTES</span>
                                        <textarea
                                            placeholder=""
                                            style={{
                                                width: '100%', padding: '0.6rem', borderRadius: '6px',
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff', minHeight: '100px', fontFamily: 'inherit',
                                                resize: 'none', fontSize: '0.9rem',
                                                boxSizing: 'border-box', overflow: 'hidden'
                                            }}
                                            value={state.note}
                                            onChange={e => {
                                                handleScoreChange(section.id, 'note', e.target.value);
                                                adjustTextareaHeight(e);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '1.5rem', background: 'linear-gradient(to top, var(--color-bg) 80%, transparent)',
                display: 'flex', justifyContent: 'center', zIndex: 10
            }}>
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="primary"
                    style={{
                        width: '100%', maxWidth: '400px',
                        padding: '1rem', borderRadius: '30px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        fontSize: '1rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,255,255,0.2)',
                        letterSpacing: '1px'
                    }}
                >
                    <Save size={18} />
                    {saving ? 'SAVING...' : 'SAVE RESULTS'}
                </button>
            </div>
        </div>
    );
}
