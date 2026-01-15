import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Trash2, Dumbbell, Flame, Timer, Zap, Plus } from 'lucide-react';
import { saveDailyClass, getDailyClass } from '../../services/classService';
import { getAllBoxes } from '../../services/boxService';
import type { DailyClass, ClassSection, SectionType, ScoreType } from '../../types/class';
import type { Box } from '../../types/box';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import { WOD_PRESETS } from '../../constants/wods';

export function AdminTodayManager() {
    const navigate = useNavigate();
    const { canManageClasses, loading: roleLoading, boxId, isSuperAdmin } = useRole();
    const today = new Date().toISOString().split('T')[0];
    const { user: authUser } = useAuth();
    const [selectedDate, setSelectedDate] = useState(today);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('Daily Workout');
    const [sections, setSections] = useState<ClassSection[]>([]);

    // Super Admin: BOX selection
    const [availableBoxes, setAvailableBoxes] = useState<Box[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const [boxesLoading, setBoxesLoading] = useState(false);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const saveTimeoutRef = useRef<number | null>(null);

    // Preset Modal State
    const [showPresetModal, setShowPresetModal] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [presetCategory, setPresetCategory] = useState<'girls' | 'hero' | 'open' | 'benchmark'>('girls');

    // Simple ID generator fallback for environments where crypto.randomUUID is not available (e.g. non-secure HTTP)
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    // Determine initial sections if creating new
    const DEFAULT_TEMPLATE: ClassSection[] = [
        { id: generateId(), type: 'warmup', title: 'Warm-up', content: '', note: '' },
        { id: generateId(), type: 'strength', title: 'Strength', content: '', note: '' },
        { id: generateId(), type: 'wod', title: 'WOD', content: '', note: '' }
    ];

    // Load available boxes for Super Admin
    useEffect(() => {
        if (isSuperAdmin) {
            const loadBoxes = async () => {
                setBoxesLoading(true);
                try {
                    const boxes = await getAllBoxes();
                    setAvailableBoxes(boxes);

                    // Try to restore last selected box from localStorage
                    const lastSelectedBox = localStorage.getItem('superadmin_selected_box');
                    if (lastSelectedBox && boxes.find(b => b.id === lastSelectedBox)) {
                        setSelectedBoxId(lastSelectedBox);
                    } else if (boxes.length > 0) {
                        setSelectedBoxId(boxes[0].id);
                    }
                } catch (error) {
                    console.error('Failed to load boxes:', error);
                } finally {
                    setBoxesLoading(false);
                }
            };
            loadBoxes();
        }
    }, [isSuperAdmin]);

    // Save selected box to localStorage
    useEffect(() => {
        if (selectedBoxId) {
            localStorage.setItem('superadmin_selected_box', selectedBoxId);
        }
    }, [selectedBoxId]);

    // Determine which boxId to use for operations
    const effectiveBoxId = isSuperAdmin ? selectedBoxId : boxId;

    // localStorage key for draft
    const DRAFT_KEY = `class_draft_${selectedDate}_${effectiveBoxId}`;

    // Load draft from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft && !draftLoaded) {
            try {
                const draft = JSON.parse(savedDraft);
                setTitle(draft.title || 'Daily Workout');
                setSections(draft.sections || DEFAULT_TEMPLATE);
                setDraftLoaded(true);
                console.log('📝 下書きを復元しました');
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }, [DRAFT_KEY, draftLoaded]);

    // Auto-save to localStorage (debounced)
    useEffect(() => {
        if (!draftLoaded) return; // Don't save until initial load is complete

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save
        saveTimeoutRef.current = window.setTimeout(() => {
            const draft = {
                title,
                sections,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            console.log('💾 下書きを自動保存しました');
        }, 1000); // Save after 1 second of inactivity

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [title, sections, DRAFT_KEY, draftLoaded]);

    useEffect(() => {
        if (!roleLoading && !canManageClasses) {
            navigate('/');
            return;
        }
        if (!roleLoading && effectiveBoxId) {
            loadClassData(selectedDate);
        }
    }, [selectedDate, canManageClasses, roleLoading, navigate, boxId]);

    const loadClassData = async (date: string) => {
        if (!effectiveBoxId) {
            console.warn('Attempted to load class without boxId');
            setLoading(false);
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            console.log('Fetching class for date:', date, 'Box:', effectiveBoxId);
            const data = await getDailyClass(date, effectiveBoxId);
            if (data) {
                setTitle(data.title || '');
                if (data.sections && data.sections.length > 0) {
                    setSections(data.sections);
                } else if (data.warmup || data.strength || data.wod) {
                    // Migration logic for old format
                    const migrated: ClassSection[] = [];
                    if (data.warmup) migrated.push({ ...data.warmup, id: 'migrated-warmup', type: 'warmup', title: 'Warm-up' });
                    if (data.strength) migrated.push({ ...data.strength, id: 'migrated-strength', type: 'strength' });
                    if (data.wod) migrated.push({ ...data.wod, id: 'migrated-wod', type: 'wod' });
                    setSections(migrated);
                } else {
                    setSections(DEFAULT_TEMPLATE);
                }
            } else {
                setTitle('Daily Workout');
                setSections(DEFAULT_TEMPLATE);
            }
        } catch (error: any) {
            console.error('Error loading class:', error);
            const errMsg = error?.message || '不明なエラー';
            setMessage(`読み込み不可: ${errMsg}`);
            if (errMsg.includes('permission')) {
                setMessage('権限がありません。管理者としてログインしてください。');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!effectiveBoxId) {
            setMessage('Error: No BOX selected. Cannot save class.');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            console.log('Saving class data:', { id: selectedDate, sections, boxId: effectiveBoxId });
            const classData: DailyClass = {
                id: selectedDate,
                date: selectedDate,
                title,
                sections: sections.map(s => ({
                    ...s,
                    content: s.content || '',
                    title: s.title || '',
                    note: s.note || ''
                })),
                createdAt: {} as any,
                updatedAt: {} as any
            };

            await saveDailyClass(classData, effectiveBoxId);
            // Clear draft after successful save
            localStorage.removeItem(DRAFT_KEY);
            console.log('🗑️ 下書きをクリアしました');
            setMessage('保存しました！');
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Error saving class:', error);
            const userStatus = authUser ? `(UID: ${authUser.uid.substring(0, 5)}...)` : '(Not logged in)';
            setMessage(`保存失敗: ${error?.message || '不明なエラー'} ${userStatus}`);
        } finally {
            setLoading(false);
        }
    };

    const addSection = (type: SectionType) => {
        const defaultTitles: Record<string, string> = {
            warmup: 'Warm-up',
            skill: 'Skill Practice',
            strength: 'Strength',
            wod: 'WOD',
            mobility: 'Mobility'
        };
        const newSection: ClassSection = {
            id: generateId(),
            type,
            title: defaultTitles[type] || 'New Section',
            content: '',
            note: ''
        };
        setSections([...sections, newSection]);
    };

    const removeSection = (id: string) => {
        if (window.confirm("このセクションを削除しますか？")) {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const updateSection = (id: string, updates: Partial<ClassSection>) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const getSectionIcon = (type: SectionType) => {
        switch (type) {
            case 'warmup': return <Flame size={20} />;
            case 'strength': return <Dumbbell size={20} />;
            case 'wod': return <Timer size={18} />;
            case 'extracredit': return <Plus size={20} />;
            case 'skill': return <Zap size={20} />;
            case 'mobility': return <Dumbbell size={20} />;
            default: return <Plus size={20} />;
        }
    };

    const getSectionColor = (type: SectionType) => {
        switch (type) {
            case 'warmup': return '#9E9E9E'; // Gray
            case 'strength': return 'var(--color-accent)'; // Gold
            case 'wod': return 'var(--color-neon)'; // Green
            case 'skill': return '#2196F3'; // Blue
            case 'extracredit': return '#E91E63'; // Pink
            case 'mobility': return '#9C27B0'; // Purple
            default: return 'var(--color-primary)';
        }
    };


    const applyPreset = (preset: any) => {
        if (!activeSectionId) return;
        updateSection(activeSectionId, {
            title: preset.title,
            content: preset.menu,
            scoreType: preset.scoreType as ScoreType,
            category: presetCategory,
        });
        setShowPresetModal(false);
        setActiveSectionId(null);
    };

    const openPresetModal = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setShowPresetModal(true);
    };

    return (
        <div className="admin-manager-container" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                /* ... (Previous styles) ... */
                /* Base Reset */
                .admin-manager-container {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 1.5rem 1.5rem 6rem 1.5rem;
                    box-sizing: border-box;
                    overflow-x: hidden;
                }
                .admin-manager-container * { box-sizing: border-box; }

                /* Inputs */
                input, textarea, select { 
                    width: 100% !important; 
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8); z-index: 1000;
                    display: flex; justify-content: center; alignItems: center;
                    padding: 20px;
                }
                .modal-content {
                    background: var(--color-surface);
                    width: 100%; max-width: 500px;
                    max-height: 80vh;
                    border-radius: 12px;
                    display: flex; flex-direction: column;
                    border: 1px solid var(--color-border);
                    overflow: hidden;
                }
                .modal-tabs {
                    display: flex; border-bottom: 1px solid var(--color-border);
                }
                .modal-tab {
                    flex: 1; padding: 1rem; text-align: center;
                    background: none; border: none; color: var(--color-text-muted);
                    cursor: pointer; font-weight: bold;
                }
                .modal-tab.active {
                    color: var(--color-primary); border-bottom: 2px solid var(--color-primary);
                }
                .preset-list {
                    overflow-y: auto; padding: 1rem;
                    display: flex; flex-direction: column; gap: 10px;
                }
                .preset-item {
                    padding: 1rem; background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: 8px; cursor: pointer;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .preset-item:hover { background: rgba(255,255,255,0.05); }

                /* ... (Existing Styles) ... */
                /* Header */
                .page-header {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    margin-bottom: 1.5rem;
                }
                .h1-title {
                    font-family: var(--font-heading);
                    margin: 0;
                    font-size: 1.5rem;
                }

                /* Config Grid (Date & Theme) */
                .config-grid-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    background: var(--color-surface);
                    padding: 1.2rem;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    width: 100%;
                    max-width: 100%;
                    overflow: hidden; /* Prevent children from pushing out */
                }
                .config-item {
                    width: 100%;
                    min-width: 0;
                    max-width: 100%;
                    overflow: hidden;
                }
                .config-item input {
                    width: 100% !important;
                    display: block;
                    box-sizing: border-box;
                    margin: 0;
                    text-align: center !important; /* Force centering */
                    font-family: inherit;
                    -webkit-appearance: none; /* Reset for mobile */
                    min-height: 48px;
                }
                /* iOS Safari centering specifically for date inputs */
                input[type="date"] {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                input[type="date"]::-webkit-date-and-time-value {
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    width: 100%;
                    min-height: 1.2rem;
                }
                /* Hide calendar icon if it's pushing text or just center it */
                input[type="date"]::-webkit-calendar-picker-indicator {
                    margin-left: -10px;
                }

                /* Add Buttons Grid (3 Columns) */
                .add-buttons-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr; /* 3 Columns */
                    gap: 10px;
                    margin-bottom: 2rem;
                    width: 100%;
                }
                .add-btn {
                    padding: 0.8rem 0.5rem;
                    background: transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: bold;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    width: 100%;
                    white-space: nowrap;
                }
                .add-btn:active { transform: scale(0.98); }

                /* Section Box */
                .section-box {
                    padding: 1.2rem;
                    background: var(--color-surface);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    animation: fadeIn 0.2s ease-out;
                    border: 1px solid var(--color-border);
                    width: 100%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: height 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Mobile Optimization */
                @media (max-width: 600px) {
                    .config-grid-container { 
                        display: flex;       /* Use Flex instead of block for better gap control */
                        flex-direction: column; 
                        width: 100% !important;
                        padding: 1rem;
                    }
                    .config-item {
                        width: 100% !important;
                        margin-bottom: 0;
                    }
                    .h1-title { font-size: 1.3rem !important; }
                    
                    /* Buttons still 3 columns on mobile, but maybe smaller font */
                    .add-buttons-grid {
                        gap: 8px;
                    }
                    .add-btn {
                        font-size: 0.7rem;
                        padding: 0.7rem 0.1rem;
                        letter-spacing: -0.5px;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="page-header">
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', padding: '4px', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="h1-title">Class Manager</h1>
            </div>

            {/* Top Config Row */}
            <div className="config-grid-container">
                {/* Super Admin: BOX Selection */}
                {isSuperAdmin && (
                    <div className="config-item" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                            🏢 Select BOX (Super Admin)
                        </label>
                        <select
                            value={selectedBoxId || ''}
                            onChange={(e) => setSelectedBoxId(e.target.value)}
                            disabled={boxesLoading}
                            style={{
                                padding: '0.8rem', borderRadius: '8px',
                                border: '2px solid var(--color-primary)',
                                background: 'var(--color-bg)',
                                color: 'var(--color-text)',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {boxesLoading ? (
                                <option>Loading BOXes...</option>
                            ) : availableBoxes.length === 0 ? (
                                <option>No BOXes available</option>
                            ) : (
                                availableBoxes.map(box => (
                                    <option key={box.id} value={box.id}>
                                        {box.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}

                <div className="config-item">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        <Calendar size={14} color="var(--color-primary)" /> Target Date
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '0.8rem', borderRadius: '8px',
                            border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '1rem'
                        }}
                    />
                </div>
                <div className="config-item">
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Class Theme</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Hero WOD Murph"
                        style={{
                            padding: '0.8rem', borderRadius: '8px',
                            border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            {/* Add Section Buttons (3 Columns) */}
            <div className="add-buttons-grid">
                <button className="add-btn" onClick={() => addSection('warmup')} style={{ border: `1.5px solid #9E9E9E`, color: '#9E9E9E' }}>+ Warm-up</button>
                <button className="add-btn" onClick={() => addSection('skill')} style={{ border: `1.5px solid #2196F3`, color: '#2196F3' }}>+ Skill</button>
                <button className="add-btn" onClick={() => addSection('strength')} style={{ border: `1.5px solid var(--color-accent)`, color: 'var(--color-accent)' }}>+ Strength</button>
                <button className="add-btn" onClick={() => addSection('wod')} style={{ border: `1.5px solid var(--color-neon)`, color: 'var(--color-neon)' }}>+ WOD</button>
                <button className="add-btn" onClick={() => addSection('extracredit')} style={{ border: `1.5px solid #E91E63`, color: '#E91E63' }}>+ Extra Credit</button>
                <button className="add-btn" onClick={() => addSection('mobility')} style={{ border: `1.5px solid #9C27B0`, color: '#9C27B0' }}>+ Mobility</button>
            </div>

            {/* Sections List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {sections.map((section) => (
                    <div key={section.id} className="section-box" style={{
                        borderLeft: `5px solid ${getSectionColor(section.type)}`,
                        borderLeftWidth: '5px'
                    }}>
                        {/* Section Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: getSectionColor(section.type) }}>
                                    {getSectionIcon(section.type)}
                                    <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                                        {section.title || section.type}
                                    </h3>
                                </div>
                                {(section.type === 'wod' || section.type === 'strength') && (
                                    <button
                                        type="button"
                                        onClick={() => openPresetModal(section.id)}
                                        style={{
                                            background: 'rgba(255,215,0,0.1)',
                                            border: '1px solid var(--color-primary)',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            fontSize: '0.75rem',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        📋 PRESET
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => removeSection(section.id)}
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '6px' }}
                                title="Remove Section"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Title Input - Compact */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                                    WOD Name <span style={{ opacity: 0.5, fontWeight: 'normal' }}>(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={section.title || ''}
                                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                    placeholder="e.g. Fran, Murph"
                                    style={{
                                        padding: '0.65rem', fontSize: '0.95rem',
                                        borderRadius: '8px', border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)', color: 'var(--color-text)'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                                    Sets <span style={{ opacity: 0.5, fontWeight: 'normal' }}>(Strength)</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="-"
                                    value={section.sets || ''}
                                    onChange={(e) => updateSection(section.id, { sets: parseInt(e.target.value) || undefined })}
                                    style={{
                                        padding: '0.65rem', fontSize: '0.95rem',
                                        borderRadius: '8px', border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)', color: 'var(--color-text)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Score Type */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                                Score Type
                            </label>
                            <select
                                value={section.scoreType || 'none'}
                                onChange={(e) => updateSection(section.id, { scoreType: e.target.value as ScoreType })}
                                style={{
                                    padding: '0.65rem', fontSize: '0.95rem',
                                    borderRadius: '8px', border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)', color: 'var(--color-text)'
                                }}
                            >
                                <option value="none">None</option>
                                <option value="time">Time</option>
                                <option value="rounds_reps">Rounds + Reps</option>
                                <option value="reps">Total Reps</option>
                                <option value="weight">Weight (KG/LB)</option>
                                <option value="points">Points</option>
                            </select>
                        </div>

                        {/* Content Input */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                                Menu / Content
                            </label>
                            <textarea
                                value={section.content || ''}
                                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                rows={8}
                                placeholder="Menu details..."
                                style={{
                                    padding: '0.8rem', fontSize: '1rem', lineHeight: '1.5',
                                    borderRadius: '8px', border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)', color: 'var(--color-text)',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Notes Input */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                Coach Notes
                            </label>
                            <textarea
                                value={section.note || ''}
                                onChange={(e) => updateSection(section.id, { note: e.target.value })}
                                placeholder="クラス画面には表示されません"
                                rows={3}
                                style={{
                                    padding: '0.7rem', fontSize: '0.95rem', lineHeight: '1.4',
                                    borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent', color: 'var(--color-text-muted)',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <div style={{
                marginTop: '1rem',
                padding: '2rem 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                borderTop: '1px solid var(--color-border)'
            }}>
                {message && (
                    <div style={{ color: message.includes('失敗') ? '#ff5252' : 'var(--color-neon)', fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem' }}>
                        {message.includes('保存しました') ? '✓ ' : ''}{message}
                    </div>
                )}
                <button
                    className="primary"
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '1.2rem 3rem', fontSize: '1.1rem', fontWeight: 'bold',
                        boxShadow: 'var(--shadow-glow)', borderRadius: '40px',
                        width: '100%', maxWidth: '300px', justifyContent: 'center'
                    }}
                >
                    <Save size={22} />
                    {loading ? 'SAVING...' : 'SAVE CLASS'}
                </button>
            </div>

            {/* Preset Modal */}
            {showPresetModal && (
                <div className="modal-overlay" onClick={() => setShowPresetModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-tabs">
                            {(['girls', 'hero', 'open', 'benchmark'] as const).map(cat => (
                                <button
                                    key={cat}
                                    className={`modal-tab ${presetCategory === cat ? 'active' : ''}`}
                                    onClick={() => setPresetCategory(cat)}
                                >
                                    {cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="preset-list">
                            {WOD_PRESETS[presetCategory]?.map((preset: any, idx: number) => (
                                <div key={idx} className="preset-item" onClick={() => applyPreset(preset)}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{preset.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{preset.scoreType}</div>
                                    </div>
                                    <Plus size={16} />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowPresetModal(false)}
                            style={{ padding: '15px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', borderTop: '1px solid var(--color-border)' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Old style function removed intentionally as we now use CSS classes
