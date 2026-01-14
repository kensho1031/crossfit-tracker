import { useState } from 'react';
import { Camera, Scan } from 'lucide-react';
import { WODAnalysisFlow } from '../wod/WODAnalysisFlow';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { AnalyzedWOD } from '../../types/draftLog';

export function ScanWODButton() {
    const { user } = useAuth();
    const [showAnalysisFlow, setShowAnalysisFlow] = useState(false);

    const handleAnalysisComplete = async (imageUrl: string, analyzedData: AnalyzedWOD) => {
        if (!user) return;

        try {
            // Save as draft log
            await addDoc(collection(db, 'draftLogs'), {
                uid: user.uid,
                imageUrl,
                analyzedData,
                userInputs: {},
                status: 'draft',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            alert('WODを一時保存しました！\nダッシュボードから後で入力できます。');
            setShowAnalysisFlow(false);
        } catch (error) {
            console.error('Error saving draft:', error);
            alert('保存に失敗しました');
        }
    };

    if (showAnalysisFlow) {
        return (
            <WODAnalysisFlow
                onComplete={handleAnalysisComplete}
                onCancel={() => setShowAnalysisFlow(false)}
            />
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-xl) 0',
            maxWidth: '100%',
            boxSizing: 'border-box'
        }}>
            <button
                onClick={() => setShowAnalysisFlow(true)}
                style={{
                    position: 'relative',
                    width: 'min(300px, 100%)',
                    height: 'min(300px, 80vw)',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                    border: '2px solid var(--color-neon)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'var(--shadow-neon)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-sm)',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.8)';
                    e.currentTarget.style.borderWidth = '3px';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-neon)';
                    e.currentTarget.style.borderWidth = '2px';
                }}
            >
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Camera size={72} color="var(--color-neon)" strokeWidth={1.5} />
                    <Scan
                        size={90}
                        color="var(--color-neon)"
                        strokeWidth={1}
                        style={{
                            position: 'absolute',
                            opacity: 0.3,
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                    />
                </div>
                <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--color-neon)',
                    letterSpacing: 'var(--letter-spacing-tight)',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-heading)',
                    textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
                }}>
                    SCAN WOD
                </div>
                <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    letterSpacing: 'var(--letter-spacing-wide)',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-body)'
                }}>
                    AI-Powered Analysis
                </div>
            </button>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.1); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
