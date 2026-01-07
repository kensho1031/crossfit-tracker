import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export function BodyStatusCard() {
    const { user, userStats } = useAuth();
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            // Updating metrics - assuming we might want to store history later, but for now direct update
            await updateDoc(userRef, {
                'bodyWeight': parseFloat(weight) || userStats?.bodyWeight
                // Add bodyFat to schema if needed, for now just UI
            });
            alert("Updated!");
            setWeight('');
            setBodyFat('');
            window.location.reload(); // Simple reload for state refresh
        } catch (e) {
            console.error(e);
            alert("Error updating");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            height: 'fit-content'
        }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>身体ステータス</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                体重と体脂肪率を管理します
            </p>

            {/* Stats Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>現在の体重</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {userStats?.bodyWeight || '--'} <span style={{ fontSize: '1rem', fontWeight: 400 }}>kg</span>
                    </div>
                </div>
                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>体脂肪率</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        -- <span style={{ fontSize: '1rem', fontWeight: 400 }}>%</span>
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>体重</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="number"
                            placeholder="体重を入力"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <select style={{ width: '80px' }}>
                            <option>kg</option>
                            <option>lbs</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>体脂肪率 (オプション)</label>
                    <input
                        type="number"
                        placeholder="体脂肪率 %"
                        value={bodyFat}
                        onChange={(e) => setBodyFat(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>

                <button
                    onClick={handleUpdate}
                    className="primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
                >
                    {loading ? '記録中...' : '記録'}
                </button>
            </div>
        </div>
    );
}
