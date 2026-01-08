import { useState, useEffect } from 'react';
import { useWeeklySummary } from '../../hooks/useWeeklySummary';
import { generateWeeklyComment } from '../../services/geminiService';
import { Trophy, Activity, TrendingUp, BarChart3, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function WeeklySummaryDetailed() {
    const stats = useWeeklySummary();
    const [aiComment, setAiComment] = useState<string>('分析中...');

    useEffect(() => {
        if (!stats.loading) {
            generateWeeklyComment({
                workoutCount: stats.workoutCount,
                prCount: stats.prCount,
                categories: Object.keys(stats.categoryRatio),
                sourceRatio: stats.sourceRatio
            }).then(setAiComment);
        }
    }, [stats.loading, stats.workoutCount, stats.prCount]);

    if (stats.loading) return (
        <div style={{ padding: '2rem', background: 'var(--color-surface)', borderRadius: '16px', marginBottom: '2rem', textAlign: 'center' }}>
            読み込み中...
        </div>
    );

    const categoryData = Object.entries(stats.categoryRatio).map(([name, value]) => ({ name, value }));
    const exerciseData = Object.entries(stats.exerciseFrequency)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: '20px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                marginBottom: '1.5rem',
                fontFamily: 'var(--font-heading)',
                textAlign: 'center',
                color: 'var(--color-accent)',
                letterSpacing: '1px'
            }}>
                週間パフォーマンス
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Activity size={20} color="var(--color-accent)" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600 }}>総ワークアウト回数</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{stats.workoutCount}<span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '2px' }}>回</span></div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Trophy size={20} color="#ffd700" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600 }}>PR更新数</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{stats.prCount}<span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '2px' }}>回</span></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {/* Category Ratio */}
                <div style={{ height: '240px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                        <BarChart3 size={16} color="var(--color-accent)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#aaa' }}>カテゴリ比率</span>
                    </div>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>No Data</div>
                    )}
                </div>

                {/* Top Exercises */}
                <div style={{ height: '240px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                        <TrendingUp size={16} color="var(--color-accent)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#aaa' }}>トレーニング頻度 (種目別)</span>
                    </div>
                    {exerciseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={exerciseData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#888' }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>No Data</div>
                    )}
                </div>
            </div>

            {/* AI Comment */}
            {aiComment && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(92, 124, 250, 0.05) 100%)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid rgba(0, 255, 255, 0.1)',
                    display: 'flex',
                    gap: '1.2rem',
                    alignItems: 'flex-start'
                }}>
                    <MessageSquare size={24} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '1px', marginBottom: '4px', opacity: 0.8 }}>AI ANALYSIS ADVICE</div>
                        <p style={{
                            margin: 0,
                            fontSize: '0.8rem',
                            lineHeight: '1.4',
                            color: '#fff',
                            fontWeight: 400,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            opacity: 0.85
                        }}>
                            {aiComment.replace(/^[>\s*-]+/, '').trim()}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
