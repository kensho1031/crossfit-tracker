import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signInAnonymously,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    type AuthError
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { type UserStats, INITIAL_STATS } from '../types/user';
import { Loader2, Bug } from 'lucide-react';

interface AuthContextType {
    user: User | null;
    userStats: UserStats | null;
    loading: boolean;
    debugLogs: string[];
    signInWithGoogle: (method?: 'popup' | 'redirect') => Promise<void>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('CONNECTING TO GYM...');
    const [loadError, setLoadError] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);

    const addLog = (msg: string) => {
        console.log(`[AUTH] ${msg}`);
        setDebugLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                addLog("Initializing Auth Persistence...");
                await setPersistence(auth, browserLocalPersistence);

                addLog("Checking redirect result...");
                try {
                    const result = await getRedirectResult(auth);
                    if (result) {
                        addLog(`Redirect Success: ${result.user.email}`);
                    } else {
                        addLog("No redirect found.");
                    }
                } catch (redirectError: any) {
                    // Handle specific redirect errors if needed, or just log
                    addLog(`Redirect check warning: ${redirectError.message}`);
                }

            } catch (err: any) {
                addLog(`Init Error: ${err.message}`);
                setLoadError(true);
                setStatus(`INIT ERROR: ${err.message}`);
            }
        };

        initAuth();

        const timer = setTimeout(() => {
            if (loading && mounted) {
                addLog("Initialization Timeout reached.");
                setLoadError(true);
                setStatus('CONNECTION SLOW - RETRYING...');
                // Force stop loading after 5 more seconds if it's still stuck?
                // Or leave it to the user to refresh.
            }
        }, 15000);

        setStatus('INITIALIZING ATHLETE...');
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!mounted) return;
            addLog(`Auth State Change: ${currentUser ? currentUser.email : 'GUEST'}`);

            if (currentUser) {
                setStatus('FETCHING STATS...');
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    addLog("Fetching user document...");
                    const userDoc = await getDoc(userDocRef);

                    let stats: UserStats;
                    if (userDoc.exists()) {
                        stats = userDoc.data() as UserStats;
                        addLog("Stats loaded.");
                    } else {
                        addLog("Creating new athlete record...");
                        setStatus('CREATING NEW ATHLETE...');
                        stats = {
                            ...INITIAL_STATS,
                            uid: currentUser.uid,
                            displayName: currentUser.displayName || 'Athlete',
                            email: currentUser.email || '',
                            photoURL: currentUser.photoURL || '',
                            createdAt: new Date().toISOString(),
                            currentMonth: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7)
                        };
                        await setDoc(userDocRef, stats);
                        addLog("New record created.");
                    }

                    if (mounted) {
                        setUser(currentUser);
                        setUserStats(stats);
                    }
                } catch (error: any) {
                    addLog(`Firestore Error: ${error.message}`);
                    if (mounted) {
                        setUser(currentUser);
                        setUserStats(null);
                    }
                }
            } else {
                if (mounted) {
                    setUser(null);
                    setUserStats(null);
                }
            }

            if (mounted) {
                clearTimeout(timer);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const signInWithGoogle = async (method: 'popup' | 'redirect' = 'popup') => {
        addLog(`Login requested via ${method}.`);
        addLog(`Current Origin: ${window.location.origin}`);

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            if (method === 'redirect') {
                setStatus('REDIRECTING TO GOOGLE...');
                setLoading(true);
                try {
                    await signInWithRedirect(auth, provider);
                } catch (redirectStartError: any) {
                    setLoading(false);
                    setStatus('REDIRECT ERROR');
                    addLog(`Redirect Start Error: ${redirectStartError.code} - ${redirectStartError.message}`);
                    alert(`リダイレクトの開始に失敗しました。\nCode: ${redirectStartError.code}\nMessage: ${redirectStartError.message}`);
                }
                return; // Redirecting...
            }

            // Defaults to popup
            addLog("Attempting Popup login...");
            const result = await signInWithPopup(auth, provider);
            addLog(`Popup Success: ${result.user.email}`);
        } catch (error: any) {
            const authError = error as AuthError;
            addLog(`Login Failed (${method}): ${authError.code}`);

            if (authError.code === 'auth/unauthorized-domain') {
                alert(`ドメインが許可されていません。\nFirebaseコンソールで ${window.location.hostname} を承認済みドメインに追加してください。`);
            }

            if (
                authError.code === 'auth/popup-blocked' ||
                authError.code === 'auth/cancelled-popup-request' ||
                authError.code === 'auth/popup-closed-by-user' ||
                authError.message.includes("400") // Catch generic 400s if they manifest here
            ) {
                addLog("Popup issues detected. Suggesting redirect...");
                // Auto-fallback for some cases, or just log
                if (method === 'popup') {
                    // Optionally auto-redirect? 
                    // Let's force redirect if popup failed specifically due to blocking
                    if (authError.code === 'auth/popup-blocked') {
                        addLog("Popup blocked, switching to redirect automatically.");
                        await signInWithGoogle('redirect');
                        return;
                    }
                }
            }

            alert(`ログインに失敗しました: ${authError.message}\n(Code: ${authError.code})`);
            setLoading(false);
        }
    };



    const loginAnonymously = async () => {
        addLog("Anonymous login requested.");
        setLoading(true);
        setStatus('LOGGING IN AS GUEST...');
        try {
            const result = await signInAnonymously(auth);
            addLog(`Anonymous Success: ${result.user.uid}`);
        } catch (error: any) {
            addLog(`Anonymous Login Failed: ${error.message}`);
            alert(`ゲストログインに失敗しました: ${error.message}`);
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            addLog("Logged out.");
            setUser(null);
            setUserStats(null);
        } catch (error: any) {
            addLog(`Logout Error: ${error.message}`);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userStats, loading, debugLogs, signInWithGoogle, loginAnonymously, logout }}>
            {loading ? (
                <div style={{
                    height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#00ffff',
                    fontFamily: '"Courier New", monospace'
                }}>
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <div style={{ letterSpacing: '2px', fontSize: '0.9rem', fontWeight: 800, textAlign: 'center', padding: '0 20px' }}>
                        {status}
                    </div>

                    {/* Floating Debug Toggle */}
                    <div
                        onClick={() => setShowDebug(!showDebug)}
                        style={{ position: 'fixed', bottom: '20px', right: '20px', opacity: 0.3, cursor: 'pointer' }}
                    >
                        <Bug size={16} />
                    </div>

                    {showDebug && (
                        <div style={{
                            position: 'fixed', bottom: '50px', left: '10px', right: '10px',
                            background: 'rgba(0,0,0,0.9)', padding: '10px', fontSize: '10px',
                            maxHeight: '200px', overflowY: 'auto', border: '1px solid #00ffff', color: '#00ffff'
                        }}>
                            {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                    )}

                    {loadError && (
                        <div className="mt-8 flex flex-col gap-2">
                            <p className="text-red-400 text-xs">Initialization taking longer than expected.</p>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '8px 16px', background: 'transparent',
                                    border: '1px solid #ff4444', color: '#ff4444', borderRadius: '4px'
                                }}
                            >
                                RELOAD PAGE
                            </button>
                        </div>
                    )}
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
