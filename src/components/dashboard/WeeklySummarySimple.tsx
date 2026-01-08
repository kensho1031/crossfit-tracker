import { useWeeklySummary } from '../../hooks/useWeeklySummary';
import { ArrowUpRight } from 'lucide-react';

interface WeeklySummaryBaseProps {
    onDetailClick?: () => void;
}

export function WeeklySummarySimple({ onDetailClick }: WeeklySummaryBaseProps) {
    const { workoutCount, prCount, categoryRatio, loading } = useWeeklySummary();

    if (loading) return (
        <div style={{ height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#666', fontSize: '0.8rem' }}>読み込み中...</span>
        </div>
    );

    const categories = Object.keys(categoryRatio).slice(0, 3);

    return (
        <div
            onClick={onDetailClick}
            style={{
                minHeight: '100px',
                background: 'linear-gradient(135deg, #1e1e24 0%, #121216 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                margin: '1.5rem 1rem',
                padding: '1.2rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '1rem',
                flex: 1,
                alignItems: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>今週の回数</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-accent)', lineHeight: 1 }}>
                        {workoutCount}<span style={{ fontSize: '0.7rem', marginLeft: '2px', color: '#666' }}>回</span>
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>PR更新数</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffd700', lineHeight: 1 }}>
                        {prCount}<span style={{ fontSize: '0.7rem', marginLeft: '2px', color: '#666' }}>回</span>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '4px',
                    gridColumn: 'span 2' // Categories span the whole width on small screens
                }}>
                    <div style={{ color: '#888', fontSize: '0.6rem', fontWeight: 600, textAlign: 'center' }}>主なトレーニングカテゴリ</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {categories.map(cat => (
                            <span key={cat} style={{
                                fontSize: '0.6rem', padding: '1px 8px', borderRadius: '4px',
                                background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)',
                                whiteSpace: 'nowrap'
                            }}>
                                {cat}
                            </span>
                        ))}
                        {categories.length === 0 && <span style={{ fontSize: '0.6rem', color: '#444' }}>データなし</span>}
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: 'var(--color-accent)',
                fontSize: '0.8rem',
                fontWeight: 700,
                width: '100%',
                marginTop: '0.5rem',
                borderTop: '1px solid rgba(255,255,255,0.03)',
                paddingTop: '0.75rem'
            }}>
                詳細を見る <ArrowUpRight size={14} />
            </div>
        </div>
    );
}
