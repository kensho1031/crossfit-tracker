import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, QrCode, X, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ClassSectionAccordion } from '../components/class/ClassSectionAccordion';
import { isUserCheckedIn } from '../services/attendanceService';
import { getDailyClass } from '../services/classService';
import { getScores } from '../services/scoreService';
import { useRole } from '../hooks/useRole';
import type { DailyClass } from '../types/class';

export function ClassDetail() {
    const navigate = useNavigate();
    const { canManageClasses, boxId, isVisitorExpired } = useRole();
    const [dailyClass, setDailyClass] = useState<DailyClass | null>(null);
    const [scores, setScores] = useState<any[]>([]); // Using any for MVP simplicity
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showQRModal, setShowQRModal] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];

    const fetchScores = async (classId: string) => {
        try {
            const scoreData = await getScores(classId, boxId);
            setScores(scoreData);
        } catch (e) {
            console.error("Failed to fetch scores", e);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (!boxId) {
                // Personal mode or loading? 
                // If loading, useRole loading should mask it, but here we might just render 'No WOD'
                setLoading(false);
                return;
            }

            try {
                const classData = await getDailyClass(todayStr, boxId);
                setDailyClass(classData);

                if (classData) {
                    const status = await isUserCheckedIn(classData.id, boxId);
                    setIsCheckedIn(status);
                    await fetchScores(classData.id);
                }
            } catch (error) {
                console.error("Initialization Failed:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [todayStr, boxId]);
    if (isVisitorExpired) return (
        <div style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
            <h2 style={{ color: 'var(--color-text-muted)' }}>Account Expired</h2>
            <p style={{ opacity: 0.7 }}>ビジター利用期間が終了しました。<br />継続についてはBOX管理者にお問い合わせください。</p>
            <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.8rem 1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}>
                ホームに戻る
            </button>
        </div>
    );

    const isToday = true; // For this route it is always today
    const canInputScore = isCheckedIn || isToday;



    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>Loading class...</div>;

    if (!dailyClass) return (
        <div style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto 1rem auto'
                }}
            >
                <ArrowLeft size={20} /> Back
            </button>
            <h2 style={{ color: 'var(--color-text-muted)' }}>No WOD Posted Yet</h2>
            <p style={{ opacity: 0.7 }}>本日のクラス内容はまだ登録されていません。</p>
        </div>
    );

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{
                padding: 'var(--spacing-sm)',
                paddingTop: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '8px',
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        color: 'var(--color-text)'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: 0 }}>
                        {dailyClass.date}
                    </h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        {dailyClass.title}
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <Users size={16} />
                        <span>{scores.length}</span>
                    </div>
                    {canManageClasses && (
                        <button
                            onClick={() => setShowQRModal(true)}
                            style={{
                                padding: '8px',
                                background: 'rgba(255, 215, 0, 0.1)',
                                border: '1px solid var(--color-primary)',
                                borderRadius: '8px',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold'
                            }}
                        >
                            <QrCode size={16} />
                            QR
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '0 var(--spacing-sm)', maxWidth: '800px', margin: '0 auto' }}>

                {dailyClass.sections && dailyClass.sections.length > 0 ? (
                    // New Dynamic Rendering
                    dailyClass.sections.map((section, index) => (
                        <ClassSectionAccordion
                            key={section.id || index}
                            title={section.title || section.type.toUpperCase()}
                            section={section}
                            color={
                                section.type === 'wod' ? 'var(--color-neon)' :
                                    section.type === 'strength' ? 'var(--color-accent)' :
                                        section.type === 'skill' ? '#2196F3' : '#9E9E9E'
                            }
                            defaultOpen={index > 0}
                        />
                    ))
                ) : (
                    // Fallback for Legacy Data (Only show if fields actually exist)
                    <>
                        {dailyClass.warmup && dailyClass.warmup.content && (
                            <ClassSectionAccordion title="Warm-up" section={dailyClass.warmup} color="#9E9E9E" />
                        )}
                        {dailyClass.strength && dailyClass.strength.content && (
                            <ClassSectionAccordion title="Strength" section={dailyClass.strength} defaultOpen={true} color="var(--color-accent)" />
                        )}
                        {dailyClass.wod && dailyClass.wod.content && (
                            <ClassSectionAccordion title="WOD" section={dailyClass.wod} defaultOpen={true} color="var(--color-neon)" />
                        )}
                    </>
                )}

                {/* Leaderboard - STRICT: Only for Checked-in Users */}
                {isCheckedIn ? (
                    <div style={{ marginTop: '1.5rem', marginBottom: '6rem' }}>
                        <h3 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '0.95rem',
                            marginBottom: '0.8rem',
                            paddingLeft: '0.5rem',
                            color: 'var(--color-text-muted)',
                            letterSpacing: '1px',
                            borderLeft: '2px solid var(--color-primary)'
                        }}>
                            LEADERBOARD
                        </h3>

                        {scores.length === 0 ? (
                            <div style={{
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '8px',
                                padding: '0.8rem',
                                textAlign: 'center',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.8rem',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                まだスコアはありません
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {scores.map((score, idx) => (
                                    <div key={score.id || idx} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <span style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                color: idx === 0 ? 'var(--color-bg)' : 'var(--color-text)',
                                                background: idx === 0 ? 'var(--color-primary)' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'transparent',
                                                border: idx > 2 ? '1px solid var(--color-border)' : 'none'
                                            }}>
                                                {idx + 1}
                                            </span>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{score.userName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: '1rem',
                                                color: 'var(--color-primary)',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {score.result}
                                            </span>
                                            {score.isRx && (
                                                <span style={{
                                                    fontSize: '0.6rem',
                                                    background: 'rgba(255, 215, 0, 0.2)',
                                                    color: 'var(--color-primary)',
                                                    border: '1px solid var(--color-primary)',
                                                    padding: '1px 3px',
                                                    borderRadius: '3px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Rx
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Locked Leaderboard Message */
                    <div style={{
                        marginTop: '1.5rem',
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                        border: '1px dashed var(--color-border)'
                    }}>
                        <div style={{ opacity: 0.7, marginBottom: '0.3rem', fontSize: '1rem' }}>🔒</div>
                        <div style={{ fontSize: '0.75rem' }}>チェックインするとスコアが表示されます</div>
                    </div>
                )}

                {/* Score Input - OPEN: Today OR Checked-in */}
                {canInputScore ? (
                    <>
                        {/* Manual Check-in Prompt (Only if NOT checked in but is today) */}
                        {!isCheckedIn && isToday && (
                            <div style={{
                                margin: '0.5rem 0 5rem 0',
                                padding: '0.6rem 0.8rem',
                                background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 100%)',
                                borderRadius: '8px',
                                borderLeft: '2px solid var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    クラスに参加しますか？
                                </div>
                                <button
                                    onClick={() => navigate(`/checkin/${dailyClass.id}`)}
                                    style={{
                                        fontSize: '0.7rem',
                                        padding: '4px 10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--color-primary)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <QrCode size={12} />
                                    CHECK-IN
                                </button>
                            </div>
                        )}

                        {/* Scoring Button (Fixed Bottom) */}
                        <div style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '1.5rem',
                            background: 'linear-gradient(to top, var(--color-bg) 70%, transparent)',
                            display: 'flex',
                            justifyContent: 'center',
                            zIndex: 100
                        }}>
                            <button
                                className="primary"
                                onClick={() => navigate(`/class/${dailyClass.date}/score`)}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '0.8rem',
                                    height: '50px',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    borderRadius: '25px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
                                    letterSpacing: '1px'
                                }}
                            >
                                <Trophy size={16} />
                                RECORD SCORE
                            </button>
                        </div>
                    </>
                ) : (
                    /* Blocked State */
                    <div style={{
                        marginBottom: '3rem',
                        padding: '1rem',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.75rem',
                        opacity: 0.5
                    }}>
                        入力期間外です
                    </div>
                )}



            </div>

            {/* QR Code Modal */}
            {showQRModal && dailyClass && (
                <div
                    onClick={() => setShowQRModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '2rem'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--color-surface)',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '100%',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                                チェックイン QRコード
                            </h3>
                            <button
                                onClick={() => setShowQRModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* QR Code */}
                        <div id="qr-modal" style={{
                            background: '#fff',
                            padding: '2rem',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <QRCodeSVG
                                value={`${window.location.origin}/checkin`}
                                size={256}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        {/* Info */}
                        <div style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-text-muted)',
                            textAlign: 'center',
                            marginBottom: '1rem'
                        }}>
                            このQRコードをスキャンして今日のクラスにチェックイン<br />
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(店舗に常設可能)</span>
                        </div>

                        {/* Download Button */}
                        <button
                            onClick={() => {
                                const svg = document.querySelector('#qr-modal svg');
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        ctx?.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL('image/png');
                                        const downloadLink = document.createElement('a');
                                        downloadLink.download = `qr-checkin-permanent.png`;
                                        downloadLink.href = pngFile;
                                        downloadLink.click();
                                    };
                                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                background: 'var(--color-primary)',
                                color: 'var(--color-bg)',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Download size={16} />
                            ダウンロード
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
