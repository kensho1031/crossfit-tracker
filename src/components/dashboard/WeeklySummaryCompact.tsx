import { useWeeklySummary } from '../../hooks/useWeeklySummary';
import { Trophy, Activity } from 'lucide-react';

export function WeeklySummaryCompact() {
    const { workoutCount, prCount, categoryRatio, loading } = useWeeklySummary();

    if (loading) return null;

    const categories = Object.keys(categoryRatio);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            margin: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, letterSpacing: '1px' }}>週間サマリー</span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Activity size={14} color="var(--color-accent)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{workoutCount}<span style={{ fontSize: '0.7rem', fontWeight: 500, marginLeft: '2px', color: '#666' }}>回</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trophy size={14} color="#ffd700" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{prCount}<span style={{ fontSize: '0.7rem', fontWeight: 500, marginLeft: '2px', color: '#666' }}>回</span></span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.length > 0 ? categories.map(cat => (
                    <span key={cat} style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.03)', color: '#888', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        #{cat}
                    </span>
                )) : (
                    <span style={{ fontSize: '0.65rem', color: '#444' }}>動きカテゴリ：なし</span>
                )}
            </div>
        </div>
    );
}
