import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { DraftLogCard } from './DraftLogCard';
import { SmartEditModal } from '../wod/SmartEditModal';
import { Clock } from 'lucide-react';
import type { DraftLog } from '../../types/draftLog';

export function DraftLogsSection() {
    const { user } = useAuth();
    const [draftLogs, setDraftLogs] = useState<DraftLog[]>([]);
    const [selectedDraft, setSelectedDraft] = useState<DraftLog | null>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'draftLogs'),
            where('uid', '==', user.uid),
            where('status', '==', 'draft'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const drafts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as DraftLog));
            setDraftLogs(drafts);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (confirm('この未完了ログを削除しますか？')) {
            try {
                await deleteDoc(doc(db, 'draftLogs', id));
            } catch (error) {
                console.error('Error deleting draft:', error);
                alert('削除に失敗しました');
            }
        }
    };

    const handleSave = () => {
        setSelectedDraft(null);
        // Firestore subscription will automatically update the list
    };

    if (draftLogs.length === 0) {
        return null;
    }

    return (
        <>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    <Clock size={20} color="var(--color-neon)" />
                    <h3 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.5rem',
                        margin: 0,
                        letterSpacing: 'var(--letter-spacing-tight)'
                    }}>
                        未完了のWOD
                    </h3>
                    <div style={{
                        background: 'rgba(0, 255, 255, 0.2)',
                        color: 'var(--color-neon)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}>
                        {draftLogs.length}
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 'var(--spacing-md)'
                }}>
                    {draftLogs.map((draft) => (
                        <DraftLogCard
                            key={draft.id}
                            draftLog={draft}
                            onEdit={setSelectedDraft}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>

            {selectedDraft && (
                <SmartEditModal
                    draftLog={selectedDraft}
                    onClose={() => setSelectedDraft(null)}
                    onSave={handleSave}
                />
            )}
        </>
    );
}
