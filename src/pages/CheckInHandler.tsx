import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { checkInToClass } from '../services/attendanceService';
import { getDailyClass } from '../services/classService';
import { useRole } from '../hooks/useRole';

export function CheckInHandler() {
    const navigate = useNavigate();
    const { boxId } = useRole();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('チェックイン中...');

    useEffect(() => {
        const performCheckIn = async () => {
            if (!boxId) {
                setStatus('error');
                setMessage('BOXに所属していないため、チェックインできません。');
                return;
            }

            try {
                // Get today's class
                const todayStr = new Date().toISOString().split('T')[0];
                const todayClass = await getDailyClass(todayStr, boxId);

                if (!todayClass) {
                    setStatus('error');
                    setMessage('本日のクラスが見つかりません');
                    return;
                }

                // Minimum delay for UX (to show processing state)
                await new Promise(resolve => setTimeout(resolve, 800));

                await checkInToClass(todayClass.id, boxId);

                setStatus('success');
                setMessage('チェックイン完了！');

                // Redirect to Class Detail after short delay
                setTimeout(() => {
                    navigate('/class/today', { replace: true });
                }, 1500);

            } catch (error) {
                console.error('Check-in failed:', error);
                setStatus('error');
                setMessage('チェックインに失敗しました。ログイン状態を確認してください。');
            }
        };

        performCheckIn();
    }, [navigate, boxId]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <div style={{
                background: 'var(--color-surface)',
                padding: '3rem 2rem',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '400px',
                width: '100%'
            }}>
                {status === 'processing' && (
                    <>
                        <Loader2 size={48} className="spin" color="var(--color-primary)" style={{ marginBottom: '1.5rem', animation: 'spin 1s linear infinite' }} />
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Processing</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle size={48} color="var(--color-neon)" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-neon)' }}>Success</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <AlertCircle size={48} color="#ff4444" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem', color: '#ff4444' }}>Error</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                marginTop: '1.5rem',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                padding: '0.8rem 1.5rem',
                                borderRadius: 'var(--border-radius)',
                                color: 'var(--color-text)'
                            }}
                        >
                            ホームに戻る
                        </button>
                    </>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
