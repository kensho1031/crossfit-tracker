import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ImageUploader } from '../components/log/ImageUploader';
import { Save, Calendar, AlertCircle, History, Edit, Trash2, X } from 'lucide-react';

import { getCategoriesByExercises } from '../utils/workoutUtils';

interface LogData {
    id: string;
    date: string;
    raw_text: string;
    photoUrl: string | null;
    rpe: number;
    condition: string;
    issues?: string;
    improvements?: string;
    source: 'scan' | 'log';
    exercises: string[];
    categories: string[];
}

export function WorkoutLog() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [memo, setMemo] = useState('');
    const [issues, setIssues] = useState('');
    const [improvements, setImprovements] = useState('');
    const [rpe, setRpe] = useState(3); // 1-5
    const [condition, setCondition] = useState('Normal'); // Good, Normal, Bad
    const [date, setDate] = useState(() => {
        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 10);
    });

    // History State
    const [history, setHistory] = useState<LogData[]>([]);
    const [lastIssues, setLastIssues] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        // Subscribe to last 5 logs from calendar_entries
        const q = query(
            collection(db, 'calendar_entries'),
            where('uid', '==', user.uid),
            where('type', '==', 'wod'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogData));
            setHistory(logs);

            // Set the issues from the most recent log as a reminder
            if (logs.length > 0 && logs[0].issues) {
                setLastIssues(logs[0].issues);
            } else {
                setLastIssues(null);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        if (!memo && !photoUrl && !issues && !improvements) {
            alert("内容を入力してください。");
            return;
        }

        setLoading(true);
        try {
            const exercises = ["other"]; // Default for manual log
            const categories = getCategoriesByExercises(exercises);

            const logData = {
                uid: user.uid,
                type: 'wod',
                source: 'log',
                date,
                photoUrl,
                raw_text: memo, // Map memo to raw_text
                issues,
                improvements,
                rpe,
                condition,
                exercises,
                categories,
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                // Update existing log
                await updateDoc(doc(db, 'calendar_entries', editingId), logData);
                alert("記録を更新しました！");
            } else {
                // Create new log
                await addDoc(collection(db, 'calendar_entries'), {
                    ...logData,
                    createdAt: serverTimestamp()
                });
                alert("ワークアウトを記録しました！お疲れ様でした！");
            }

            // Reset Form
            setEditingId(null);
            setMemo('');
            setIssues('');
            setImprovements('');
            setPhotoUrl(null);
            setRpe(3);
            setCondition('Normal');
        } catch (error) {
            console.error("Error saving log:", error);
            alert("記録の保存に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("このログを削除してもよろしいですか？")) return;
        try {
            await deleteDoc(doc(db, 'calendar_entries', id));
        } catch (error) {
            console.error("Error deleting log:", error);
            alert("削除に失敗しました。");
        }
    };

    const handleEdit = (log: LogData) => {
        setEditingId(log.id);
        setDate(log.date);
        setMemo(log.raw_text || '');
        setIssues(log.issues || '');
        setImprovements(log.improvements || '');
        setRpe(log.rpe || 3);
        setCondition(log.condition || 'Normal');
        setPhotoUrl(log.photoUrl || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setMemo('');
        setIssues('');
        setImprovements('');
        setPhotoUrl(null);
        setRpe(3);
        setCondition('Normal');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '4rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.5rem 2rem 1.5rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-heading)', fontSize: '1.8rem', letterSpacing: '1px' }}>
                    {editingId ? '📝 EDIT LOG' : '💪 WORKOUT LOG'}
                </h2>

                <div style={{ display: 'grid', gap: '1.2rem' }}>

                    {/* Previous Issues Reminder */}
                    {lastIssues && (
                        <div style={{
                            background: 'rgba(255, 146, 0, 0.08)',
                            border: '1px solid rgba(255, 146, 0, 0.3)',
                            borderRadius: '12px',
                            padding: '1rem 1.2rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            marginBottom: '0.5rem',
                            boxShadow: '0 2px 8px rgba(255, 146, 0, 0.1)'
                        }}>
                            <AlertCircle size={18} color="#ff9200" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff9200', marginBottom: '4px', letterSpacing: '0.5px' }}>前回の課題</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: '1.5' }}>{lastIssues}</div>
                            </div>
                        </div>
                    )}

                    {/* Date Selector */}
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '0.9rem 1.2rem',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <Calendar size={18} color="var(--color-primary)" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontSize: '0.95rem', flex: 1, outline: 'none', color: 'var(--color-text)' }}
                        />
                    </div>

                    {/* 1. Photo Capture */}
                    <div style={{
                        borderRadius: '12px',
                        padding: '1.2rem',
                        background: 'var(--color-surface)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                            📸 写真・画像記録
                        </h3>
                        {photoUrl ? (
                            <div style={{ position: 'relative' }}>
                                <img src={photoUrl} alt="WOD" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                                <button
                                    onClick={() => setPhotoUrl(null)}
                                    style={{
                                        position: 'absolute', top: '10px', right: '10px',
                                        background: 'rgba(0,0,0,0.6)',
                                        color: '#fff',
                                        fontSize: '0.7rem',
                                        padding: '0.4em 0.8em',
                                        borderRadius: '20px',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    削除
                                </button>
                            </div>
                        ) : (
                            <ImageUploader onUploadSuccess={setPhotoUrl} />
                        )}
                    </div>

                    {/* 2. Reflections (Issues/Improvements) */}
                    <div style={{
                        borderRadius: '12px',
                        padding: '1.2rem',
                        background: 'var(--color-surface)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid var(--color-border)',
                        display: 'grid',
                        gap: '1.2rem'
                    }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                            📝 トレーニングの振返り
                        </h3>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                                メモ (メニュー、スコアなど)
                            </label>
                            <textarea
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder="今日のWOD内容や感情を自由に記録..."
                                style={{
                                    width: '100%',
                                    minHeight: '90px',
                                    padding: '0.7rem',
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                                次回への課題 (意識すること)
                            </label>
                            <textarea
                                value={issues}
                                onChange={(e) => setIssues(e.target.value)}
                                placeholder="例: スクワットで膝が内側に入らないようにする..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '0.7rem',
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                                良かった点・改善できたこと
                            </label>
                            <textarea
                                value={improvements}
                                onChange={(e) => setImprovements(e.target.value)}
                                placeholder="例: 前回より粘ることができた！"
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '0.7rem',
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    {/* 3. Condition & RPE */}
                    <div style={{
                        borderRadius: '12px',
                        padding: '1.2rem',
                        background: 'var(--color-surface)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>⚡ コンディション</h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                                強度 (RPE: 1=楽, 5=極限)
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setRpe(val)}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            textAlign: 'center',
                                            background: rpe === val ? 'var(--color-primary)' : 'var(--color-bg)',
                                            color: rpe === val ? 'var(--color-primary-foreground)' : 'var(--color-text)',
                                            border: '1px solid',
                                            borderColor: rpe === val ? 'var(--color-primary)' : 'var(--color-border)',
                                            width: '100%', height: '48px',
                                            borderRadius: '12px',
                                            fontWeight: 700,
                                            transition: 'all 0.2s ease',
                                            boxShadow: rpe === val ? '0 4px 12px rgba(92, 124, 250, 0.3)' : 'none'
                                        }}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>気分・体調</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {[
                                    { val: 'Good', label: '良好', color: '#40c057' },
                                    { val: 'Normal', label: '普通', color: '#fab005' },
                                    { val: 'Bad', label: '不調', color: '#fa5252' }
                                ].map((item) => (
                                    <button
                                        key={item.val}
                                        onClick={() => setCondition(item.val)}
                                        style={{
                                            flex: 1,
                                            background: condition === item.val ? item.color : 'var(--color-bg)',
                                            color: condition === item.val ? '#fff' : 'var(--color-text)',
                                            border: '1px solid',
                                            borderColor: condition === item.val ? item.color : 'var(--color-border)',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            borderRadius: '12px',
                                            padding: '12px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        {editingId && (
                            <button
                                onClick={handleCancelEdit}
                                style={{
                                    padding: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    width: '100%',
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-muted)',
                                    borderRadius: 'var(--border-radius)'
                                }}
                            >
                                <X size={20} /> キャンセル
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="primary"
                            style={{
                                padding: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                width: '100%'
                            }}
                        >
                            <Save size={20} /> {loading ? "保存中..." : (editingId ? "更新する" : "ワークアウトを記録")}
                        </button>
                    </div>

                    {/* History Section */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                            <History size={18} color="var(--color-text-muted)" />
                            <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' }}>最近の記録</h3>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {history.map(log => (
                                <div key={log.id} style={{
                                    background: 'var(--color-surface)',
                                    borderRadius: '12px',
                                    padding: '1.2rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            <Calendar size={14} /> {log.date}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEdit(log)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }} title="編集">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(log.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }} title="削除">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-primary)', color: 'var(--color-primary-foreground)', fontWeight: 600 }}>RPE: {log.rpe}</span>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>{log.condition}</span>
                                        </div>
                                    </div>

                                    {
                                        log.photoUrl && (
                                            <img src={log.photoUrl} alt="Log" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
                                        )
                                    }

                                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                                        {log.issues && (
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                                <span style={{ fontWeight: 700, color: '#ff9200', marginRight: '6px' }}>課題:</span>
                                                {log.issues}
                                            </div>
                                        )}
                                        {log.improvements && (
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                                <span style={{ fontWeight: 700, color: '#40c057', marginRight: '6px' }}>改善:</span>
                                                {log.improvements}
                                            </div>
                                        )}
                                        {log.raw_text && (
                                            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', margin: 0, color: 'var(--color-text-muted)' }}>
                                                {log.raw_text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem', fontSize: '0.9rem' }}>記録がありません。</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
