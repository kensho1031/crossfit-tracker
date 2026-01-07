import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PRService } from '../../services/PRService';
import type { PR } from '../../types/pr';
import { SUGGESTED_EXERCISES, EXERCISE_MASTER_DATA } from '../../data/exercises';
import { PRRegisterModal } from '../pr/PRRegisterModal';
import { Plus, Trophy, Search, Star, ChevronDown, ChevronUp, Edit2, Dumbbell, Activity, Zap } from 'lucide-react';

interface PRDisplay extends PR {
    color: string;
    target: number;
    isProjected?: boolean; // If true, it's a placeholder
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function PRCards() {
    const { user } = useAuth();
    const [personalBests, setPersonalBests] = useState<PRDisplay[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPR, setSelectedPR] = useState<Partial<PR> | undefined>(undefined);

    // Context & State
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('pr_favorites');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [customOrder, setCustomOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('pr_custom_order');
        return saved ? JSON.parse(saved) : [];
    });
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    useEffect(() => {
        localStorage.setItem('pr_favorites', JSON.stringify(Array.from(favorites)));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem('pr_custom_order', JSON.stringify(customOrder));
    }, [customOrder]);

    const toggleFavorite = (e: React.MouseEvent, exerciseId: string) => {
        e.stopPropagation();
        const next = new Set(favorites);
        if (next.has(exerciseId)) {
            next.delete(exerciseId);
        } else {
            next.add(exerciseId);
        }
        setFavorites(next);
    };

    // Helper: Format value based on unit
    const formatValue = (val: number, unit: string) => {
        if (unit === 'sec' || unit === 'time') {
            // val is seconds
            const m = Math.floor(val / 60);
            const s = Math.round(val % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
        return val.toString();
    };

    const getUnitLabel = (unit: string) => {
        if (unit === 'sec' || unit === 'time') return '分:秒';
        return unit;
    };

    const loadPRs = async () => {
        if (!user) return;
        try {
            const allPRs = await PRService.getAllUserPRs(user.uid);

            const bestsMap = new Map<string, PR>();

            allPRs.forEach(pr => {
                const master = EXERCISE_MASTER_DATA.find(e => e.id === pr.exerciseId);
                const IsTime = master?.measureType === 'time' || master?.defaultUnit === 'sec';

                const existing = bestsMap.get(pr.exerciseId);

                // For time, smaller is better. For weight, larger is better.
                const isBetter = !existing || (IsTime ? pr.value < existing.value : pr.value > existing.value);

                if (isBetter) {
                    bestsMap.set(pr.exerciseId, pr);
                }
            });

            const displayList: PRDisplay[] = [];
            const usedColors = new Set<string>();

            // First, add all actual PRs
            Array.from(bestsMap.values()).forEach((pr, i) => {
                const master = EXERCISE_MASTER_DATA.find(e => e.id === pr.exerciseId);
                // Target logic: Weight -> +20%, Time -> -10% (dummy logic for visual bar)
                let target = 100;
                if (master?.measureType === 'time' || master?.defaultUnit === 'sec') {
                    target = pr.value * 0.9;
                } else {
                    target = Math.ceil(pr.value * 1.2 / 5) * 5;
                }

                displayList.push({
                    ...pr,
                    color: COLORS[i % COLORS.length],
                    target: target
                });
                usedColors.add(COLORS[i % COLORS.length]);
            });

            // Then, check for missing Suggested ones
            SUGGESTED_EXERCISES.forEach(id => {
                if (!bestsMap.has(id)) {
                    const master = EXERCISE_MASTER_DATA.find(e => e.id === id);
                    if (master) {
                        const unusedColor = COLORS.find(c => !usedColors.has(c)) || COLORS[displayList.length % COLORS.length];
                        displayList.push({
                            id: `placeholder-${id}`,
                            uid: user.uid,
                            exerciseId: master.id,
                            exerciseName: master.name,
                            value: 0,
                            unit: master.defaultUnit,
                            date: new Date().toISOString(),
                            source: 'manual',
                            createdAt: { seconds: 0, nanoseconds: 0 } as any,
                            color: unusedColor,
                            target: 100,
                            isProjected: true
                        } as PRDisplay);
                        usedColors.add(unusedColor);
                    }
                }
            });

            setPersonalBests(displayList);

        } catch (error: any) {
            console.error("Failed to load PRs:", error);
        }
    };

    useEffect(() => {
        loadPRs();
    }, [user]);

    const handleAddClick = () => {
        setSelectedPR(undefined);
        setIsModalOpen(true);
    };

    const handleCardClick = (pr: PRDisplay) => {
        if (pr.isProjected) {
            setSelectedPR({
                exerciseName: pr.exerciseName,
                unit: pr.unit,
                value: undefined
            });
        } else {
            setSelectedPR(pr);
        }
        setIsModalOpen(true);
    };

    // --- Filtering & Sorting Logic ---
    const filtered = personalBests.filter(pr => {
        const matchesSearch = pr.exerciseName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFav = showFavoritesOnly ? favorites.has(pr.exerciseId) : true;
        return matchesSearch && matchesFav;
    });

    const sorted = [...filtered].sort((a, b) => {
        // 0. Custom Order (if exists)
        if (customOrder.length > 0) {
            const aIdx = customOrder.indexOf(a.exerciseId);
            const bIdx = customOrder.indexOf(b.exerciseId);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
        }

        // 1. Real PRs first, projected (unregistered) last
        if (!!a.isProjected !== !!b.isProjected) return a.isProjected ? 1 : -1;

        // 2. Then Favorites
        const aFav = favorites.has(a.exerciseId) ? 1 : 0;
        const bFav = favorites.has(b.exerciseId) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;

        // 3. Then Key Exercises
        const aKey = SUGGESTED_EXERCISES.includes(a.exerciseId) ? 1 : 0;
        const bKey = SUGGESTED_EXERCISES.includes(b.exerciseId) ? 1 : 0;
        if (aKey !== bKey) return bKey - aKey;

        // 4. Finally by date
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // --- DND Handlers ---
    const handleDragStart = (idx: number) => {
        setDraggedIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow drop
    };

    const handleDrop = (dropIdx: number) => {
        if (draggedIdx === null || draggedIdx === dropIdx) return;

        const newSorted = [...sorted];
        const draggedItem = newSorted[draggedIdx];
        newSorted.splice(draggedIdx, 1);
        newSorted.splice(dropIdx, 0, draggedItem);

        // Update custom order based on the new full list order
        const newOrder = newSorted.map(item => item.exerciseId);
        setCustomOrder(newOrder);
        setDraggedIdx(null);
    };

    // Determine Layout Items - PC shows 8 slots
    const topItems = sorted.slice(0, 8);
    const hiddenItems = sorted.slice(8);

    return (
        <div style={{ marginBottom: '3rem' }}>
            {/* Header / Controls */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Trophy size={24} className="text-primary" />
                        <h2 style={{
                            fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
                            letterSpacing: 'var(--letter-spacing-tight)', margin: 0
                        }}>
                            PERSONAL RECORDS
                        </h2>
                    </div>
                    <button
                        onClick={handleAddClick}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.5rem 1rem', borderRadius: '8px', color: '#fff',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <Plus size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>記録を追加</span>
                    </button>
                </div>

                {/* Search & Favorites */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="種目を検索..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 1rem', paddingLeft: '2.5rem',
                                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)', color: 'white'
                            }}
                        />
                        <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                            <Search size={16} />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        style={{
                            padding: '0 1rem', borderRadius: '8px',
                            border: showFavoritesOnly ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                            background: showFavoritesOnly ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)',
                            color: showFavoritesOnly ? 'white' : '#aaa', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Star size={16} fill={showFavoritesOnly ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>

            {/* Top Grid (Max 8) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                {topItems.map((pr, idx) => {
                    const master = EXERCISE_MASTER_DATA.find(e => e.id === pr.exerciseId);
                    const category = master?.category || 'weightlifting';

                    let CatIcon = Dumbbell;
                    if (category === 'gymnastics') CatIcon = Activity;
                    else if (category === 'monostructural') CatIcon = Zap;

                    return (
                        <div
                            key={pr.id}
                            onClick={() => handleCardClick(pr)}
                            style={{
                                background: 'linear-gradient(135deg, #1e1e24 0%, #181820 100%)',
                                borderRadius: 'var(--border-radius-lg)',
                                padding: '1.25rem',
                                paddingLeft: '1.5rem',
                                border: pr.isProjected ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)',
                                borderLeft: pr.isProjected ? '3px dashed rgba(255, 255, 255, 0.1)' : `3px solid ${pr.color}40`,
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'grab',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                boxShadow: pr.isProjected ? '0 4px 20px rgba(0,0,0,0.1)' : `0 4px 20px rgba(0,0,0,0.2), 0 0 10px ${pr.color}10`,
                                opacity: pr.isProjected ? 0.8 : 1,
                                overflow: 'hidden'
                            }}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(idx)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 25px ${pr.color}25`;
                                e.currentTarget.style.border = `1px solid ${pr.color}40`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = pr.isProjected ? '0 4px 20px rgba(0,0,0,0.1)' : `0 4px 20px rgba(0,0,0,0.2), 0 0 10px ${pr.color}10`;
                                e.currentTarget.style.border = pr.isProjected ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)';
                            }}
                        >
                            {/* Header: Name + Favorite */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                <div style={{
                                    fontSize: '0.95rem', fontWeight: 600,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                    color: '#aaa',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '85%'
                                }}>
                                    {pr.exerciseName}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {!pr.isProjected && <CatIcon size={14} style={{ color: pr.color, opacity: 0.8 }} />}
                                    <button
                                        onClick={(e) => toggleFavorite(e, pr.exerciseId)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0px', display: 'flex' }}
                                    >
                                        <Star size={18} className={favorites.has(pr.exerciseId) ? "text-yellow-500" : "text-gray-600"} fill={favorites.has(pr.exerciseId) ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>

                            {/* Value - Center Aligned */}
                            <div style={{ marginBottom: '0.75rem', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {pr.isProjected ? (
                                    <div style={{ fontSize: '1.8rem', color: '#555', fontWeight: 700 }}>--</div>
                                ) : (
                                    <div style={{
                                        fontSize: '2.5rem', fontWeight: 800, lineHeight: 1,
                                        textShadow: `0 0 15px ${pr.color}40`,
                                        position: 'relative',
                                        paddingBottom: '4px'
                                    }}>
                                        {formatValue(pr.value, pr.unit)} <span style={{ fontSize: '1rem', fontWeight: 400, color: '#888' }}>{getUnitLabel(pr.unit)}</span>
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: '5%', right: '5%',
                                            height: '1px', background: `linear-gradient(90deg, transparent, ${pr.color}80, transparent)`
                                        }} />
                                    </div>
                                )}
                            </div>



                            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.5rem', textAlign: 'right' }}>
                                {pr.isProjected ? 'タップして記録' : new Date(pr.date).toLocaleDateString()}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Collapsible Section - Compact List View */}
            {hiddenItems.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            width: '100%', padding: '1rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                            color: 'var(--color-text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            fontSize: '0.9rem', fontWeight: 600, minHeight: '44px' // Mobile touch target
                        }}
                    >
                        {isExpanded ? (
                            <>閉じる <ChevronUp size={16} /></>
                        ) : (
                            <>もっと見る ({hiddenItems.length}) <ChevronDown size={16} /></>
                        )}
                    </button>

                    {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
                            {hiddenItems.map(pr => (
                                <div
                                    key={pr.id}
                                    onClick={() => handleCardClick(pr)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: 'linear-gradient(145deg, #1e1e24 0%, #121216 100%)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer'
                                    }}
                                >
                                    {/* Left: Star + Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <button
                                            onClick={(e) => toggleFavorite(e, pr.exerciseId)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <Star size={16} className={favorites.has(pr.exerciseId) ? "text-yellow-500" : "text-gray-700"} fill={favorites.has(pr.exerciseId) ? "currentColor" : "none"} />
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{pr.exerciseName}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                                {pr.isProjected ? '未記録' : new Date(pr.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Value + Edit Icon */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: pr.isProjected ? '#555' : 'white' }}>
                                            {pr.isProjected ? '--' : `${formatValue(pr.value, pr.unit)} ${getUnitLabel(pr.unit)}`}
                                        </div>
                                        <Edit2 size={16} color="#444" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <PRRegisterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadPRs(); // Refresh list
                    setIsModalOpen(false);
                }}
                initialData={selectedPR ? {
                    exerciseName: selectedPR.exerciseName,
                    value: selectedPR.value,
                    unit: selectedPR.unit,
                    date: selectedPR.date ? new Date(selectedPR.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
                } : undefined}
            />
        </div>
    );
}
