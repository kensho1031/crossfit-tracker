import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export function StatsForm() {
    const { user, userStats } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        sq: userStats?.maxWeights.sq || 0,
        bp: userStats?.maxWeights.bp || 0,
        dl: userStats?.maxWeights.dl || 0,
        wl: userStats?.maxWeights.wl || 0,
        bodyWeight: userStats?.bodyWeight || 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: parseFloat(e.target.value) || 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                'maxWeights.sq': formData.sq,
                'maxWeights.bp': formData.bp,
                'maxWeights.dl': formData.dl,
                'maxWeights.wl': formData.wl,
                'bodyWeight': formData.bodyWeight
            });
            alert("Stats Updated! Check your Avatar evolution!");
            // Force reload or better, rely on onSnapshot in Auth (which we didn't implement fully for deep updates, but simplistic is fine)
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Error updating stats");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            maxWidth: '500px',
            margin: '0 auto',
            padding: '2.5rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius)',
            backdropFilter: 'var(--backdrop-blur)'
        }}>
            <h3 style={{
                color: 'var(--color-text)',
                textAlign: 'center',
                marginBottom: '1rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.05em',
                fontSize: '1rem',
                fontWeight: 500
            }}>CURRENT MAX LIFTS</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    SQUAT
                    <input type="number" name="sq" value={formData.sq} onChange={handleChange} style={{ fontSize: '1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', borderRadius: 0, padding: '0.5rem 0' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    BENCH PRESS
                    <input type="number" name="bp" value={formData.bp} onChange={handleChange} style={{ fontSize: '1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', borderRadius: 0, padding: '0.5rem 0' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    DEADLIFT
                    <input type="number" name="dl" value={formData.dl} onChange={handleChange} style={{ fontSize: '1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', borderRadius: 0, padding: '0.5rem 0' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    WEIGHTLIFTING
                    <input type="number" name="wl" value={formData.wl} onChange={handleChange} style={{ fontSize: '1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', borderRadius: 0, padding: '0.5rem 0' }} />
                </label>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }}></div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                BODY WEIGHT (KG)
                <input type="number" name="bodyWeight" value={formData.bodyWeight} onChange={handleChange} style={{ fontSize: '1.2rem', color: 'var(--color-primary)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', borderRadius: 0, padding: '0.5rem 0' }} />
            </label>

            <button type="submit" className="accent" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
                {loading ? "SAVING..." : "UPDATE"}
            </button>
        </form>
    );
}
