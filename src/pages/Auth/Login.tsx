import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Globe, ShieldCheck, Zap } from 'lucide-react';
import './Login.css';

export function Login() {
    const { user, signInWithGoogle, loginAnonymously, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Capture Invite Token
        const params = new URLSearchParams(window.location.search);
        const inviteToken = params.get('invite');
        if (inviteToken) {
            sessionStorage.setItem('pending_invite_token', inviteToken);
        }

        if (user && !authLoading) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const handleGoogleSignIn = async (method: 'popup' | 'redirect') => {
        setLoginError(null);
        setIsProcessing(true);
        try {
            await signInWithGoogle(method);
        } catch (err: any) {
            if (err.message === 'INVITATION_REQUIRED') {
                setLoginError('このメールアドレスは招待されていません。管理者に連絡してください。');
            } else {
                setLoginError('ログイン中にエラーが発生しました。もう一度お試しください。');
            }
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (authLoading) return null;

    return (
        <div className="login-page-container">
            <div className="login-bg-overlay"></div>

            <div className="login-card-luxury">
                <div className="login-header-premium">
                    <div className="login-brand-logo">
                        <Zap size={32} color="var(--color-primary)" fill="var(--color-primary)" />
                    </div>
                    <h1 className="login-title-premium">CROSSFIT TRACKER</h1>
                    <p className="login-subtitle-premium">ULTIMATE PERFORMANCE HUB</p>
                </div>

                <div className="login-content-premium">
                    {loginError && (
                        <div className="login-error-alert-luxury">
                            {loginError}
                        </div>
                    )}

                    <div className="login-actions-group">
                        <button
                            className="btn-luxury-primary"
                            onClick={() => handleGoogleSignIn('popup')}
                            disabled={isProcessing}
                        >
                            <div className="btn-inner">
                                <LogIn size={20} />
                                <span>{isProcessing ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}</span>
                            </div>
                        </button>

                        <div className="login-divider-luxury">
                            <span>OR BEST FOR MOBILE</span>
                        </div>

                        <button
                            className="btn-luxury-outline"
                            onClick={() => handleGoogleSignIn('redirect')}
                            disabled={isProcessing}
                        >
                            <Globe size={18} />
                            <span>VIA MOBILE BROWSER</span>
                        </button>

                        <div className="login-divider-luxury">
                            <span>DEVELOPMENT ONLY</span>
                        </div>

                        <button
                            className="btn-luxury-ghost"
                            onClick={() => loginAnonymously()}
                            disabled={isProcessing}
                        >
                            <ShieldCheck size={18} />
                            <span>GUEST ACCESS (TESTER)</span>
                        </button>
                    </div>
                </div>

                <div className="login-footer-premium">
                    &copy; 2026 CHRONO LUNAR SYSTEM V1.0
                </div>
            </div>
        </div>
    );
}
