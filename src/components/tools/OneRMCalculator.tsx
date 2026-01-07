import { useState, useEffect } from 'react';
import { Calculator, Dumbbell, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export function OneRMCalculator() {
    const { user, userStats } = useAuth();
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [result, setResult] = useState<number | null>(null);

    // Max Weight States
    const [bp, setBp] = useState('');
    const [dl, setDl] = useState('');
    const [sq, setSq] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userStats?.maxWeights) {
            setBp(userStats.maxWeights.bp?.toString() || '');
            setDl(userStats.maxWeights.dl?.toString() || '');
            setSq(userStats.maxWeights.sq?.toString() || '');
        }
    }, [userStats]);

    const calculate1RM = () => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);

        if (w > 0 && r > 0) {
            // Mayhew Formula: 1RM = 100 * w / (52.2 + 41.9 * e^(-0.055 * r))
            const oneRM = (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r));
            setResult(Math.round(oneRM * 10) / 10);
        }
    };

    const handleSaveStats = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                'maxWeights.bp': parseFloat(bp) || 0,
                'maxWeights.dl': parseFloat(dl) || 0,
                'maxWeights.sq': parseFloat(sq) || 0
            });
            alert("Max weights updated!");
        } catch (e) {
            console.error(e);
            alert("Error updating stats");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2rem',
            alignItems: 'start'
        }}>
            {/* Calculator Section */}
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <Calculator size={20} color="var(--color-text)" />
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>1RM計算機 (Mayhew式)</h3>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    重量と回数から1RMを算出
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>重量</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
                                placeholder="重量"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: '#000',
                                    color: 'var(--color-text)',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                            <select style={{
                                width: '70px',
                                background: '#000',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)'
                            }}>
                                <option>kg</option>
                                <option>lbs</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>回数</label>
                        <input
                            type="number"
                            placeholder="回数"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                background: '#000',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                </div>

                <button
                    onClick={calculate1RM}
                    className="primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 600 }}
                >
                    計算する
                </button>

                {result !== null && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: 'rgba(92, 124, 250, 0.1)',
                        borderRadius: 'var(--border-radius)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Estimated 1RM</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {result} <span style={{ fontSize: '1.5rem' }}>kg</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Max Weights Input Section */}
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <Dumbbell size={20} color="var(--color-text)" />
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>現在の1RM記録</h3>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    主要3種目の自己ベストを記録・更新
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>ベンチプレス (BP)</label>
                        <input
                            type="number"
                            value={bp}
                            onChange={(e) => setBp(e.target.value)}
                            placeholder="0 kg"
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                background: '#000',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>デッドリフト (DL)</label>
                        <input
                            type="number"
                            value={dl}
                            onChange={(e) => setDl(e.target.value)}
                            placeholder="0 kg"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>バックスクワット (SQ)</label>
                        <input
                            type="number"
                            value={sq}
                            onChange={(e) => setSq(e.target.value)}
                            placeholder="0 kg"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSaveStats}
                    className="primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                    <Save size={18} />
                    {loading ? '保存中...' : '記録を保存'}
                </button>
            </div>
        </div>
    );
}
