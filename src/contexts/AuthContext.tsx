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
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { type UserStats, INITIAL_STATS, type UserBoxMembership } from '../types/user';
import type { Box } from '../types/box';
import { getBoxById } from '../services/boxService';
import { Loader2, Bug } from 'lucide-react';

interface AuthContextType {
    user: User | null;
    userStats: UserStats | null;
    memberships: UserBoxMembership[];
    myBoxes: Box[];
    currentBox: Box | null;
    setCurrentBox: (box: Box | null) => void;

    loading: boolean;
    debugLogs: string[];
    showDebug: boolean;
    setShowDebug: (show: boolean) => void;
    signInWithGoogle: (method?: 'popup' | 'redirect') => Promise<void>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);

    // Multi-Box State
    const [memberships, setMemberships] = useState<UserBoxMembership[]>([]);
    const [myBoxes, setMyBoxes] = useState<Box[]>([]);
    const [currentBox, setCurrentBoxState] = useState<Box | null>(null);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('CONNECTING TO GYM...');
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);

    const addLog = (msg: string) => {
        console.log(`[AUTH] ${msg}`);
        setDebugLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    // Helper to update currentBox and persist to Firestore
    const setCurrentBox = async (box: Box | null) => {
        setCurrentBoxState(box);
        if (user) {
            // Update last accessed box in user profile
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { currentBoxId: box?.id || null });
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                addLog("Initializing Auth Persistence...");
                await setPersistence(auth, browserLocalPersistence);
                const result = await getRedirectResult(auth);
                if (result) addLog(`Redirect Success: ${result.user.email}`);
            } catch (err: any) {
                addLog(`Init Error: ${err.message}`);
                setStatus(`INIT ERROR: ${err.message}`);
            }
        };

        initAuth();

        const timer = setTimeout(() => {
            if (loading && mounted) {
                setStatus('CONNECTION SLOW - RETRYING...');
            }
        }, 15000);

        setStatus('INITIALIZING ATHLETE...');
        let membershipUnsubscribe: (() => void) | null = null;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!mounted) return;
            addLog(`Auth State Change: ${currentUser ? currentUser.email : 'GUEST'}`);
            if (currentUser) {
                addLog(`Current User Email: ${currentUser.email}`);
            }

            // Clear previous subscription
            if (membershipUnsubscribe) {
                membershipUnsubscribe();
                membershipUnsubscribe = null;
            }

            if (currentUser) {
                setStatus('FETCHING STATS...');
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    let stats: UserStats;

                    if (userDoc.exists()) {
                        stats = userDoc.data() as UserStats;
                        addLog("Stats loaded.");
                    } else {
                        // --- New User Flow: Acceptance & Verification ---
                        if (!currentUser.email) {
                            addLog("Anonymous login - No invitation check required (or logic TBD)");
                        } else {
                            // Check for pending invitations
                            const { findPendingInvitationByEmail, acceptAllPendingInvitations } = await import('../services/invitationService');
                            const invite = await findPendingInvitationByEmail(currentUser.email);

                            if (!invite) {
                                // If NO invitation, block them out completely
                                addLog("No invitation found for new user in onAuthStateChanged. Blocking.");
                                await currentUser.delete();
                                await signOut(auth);
                                // Note: throwing here is limited since it's a callback, 
                                // but we handle it in the signIn caller too.
                                throw new Error('INVITATION_REQUIRED');
                            }

                            // Accept all invitations
                            await acceptAllPendingInvitations(currentUser.uid, currentUser.email);
                            addLog("Accepted invitations for NEW user.");
                        }

                        // Creating New User Logic
                        stats = {
                            ...INITIAL_STATS,
                            uid: currentUser.uid,
                            displayName: currentUser.displayName || 'Athlete',
                            email: currentUser.email || '',
                            photoURL: currentUser.photoURL || '',
                            createdAt: new Date().toISOString(),
                            currentMonth: new Date().toISOString().slice(0, 7),
                        };
                        await setDoc(userDocRef, stats);
                        addLog("New user record created.");
                    }

                    // --- Real-time Memberships ---
                    let firstSnapshotResolved = false;
                    const { collection, query, where, onSnapshot } = await import('firebase/firestore');
                    const membershipQuery = query(
                        collection(db, 'user_boxes'),
                        where('userId', '==', currentUser.uid)
                    );

                    membershipUnsubscribe = onSnapshot(membershipQuery, async (snapshot) => {
                        const userMemberships = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as UserBoxMembership));

                        addLog(`Memberships updated: ${userMemberships.length}`);
                        setMemberships(userMemberships);

                        // Fetch actual Box objects for these memberships
                        const boxes = await Promise.all(
                            userMemberships.map(async m => {
                                try {
                                    return await getBoxById(m.boxId);
                                } catch (e) {
                                    addLog(`Failed to load box ${m.boxId}: ${e}`);
                                    return null;
                                }
                            })
                        );
                        const validBoxes = boxes.filter((b): b is Box => b !== null);

                        // --- Box List & Current Box Determination ---
                        const superAdminUid = 'sljuwV64DYb9AnZJ8WxBmKRblYz1';
                        const isSuperAdmin = currentUser.uid === superAdminUid;
                        addLog(`User UID: ${currentUser.uid} (isSuperAdmin: ${isSuperAdmin})`);
                        let boxesToDisplay: Box[] = validBoxes;

                        if (isSuperAdmin) {
                            try {
                                const { getAllBoxes } = await import('../services/boxService');
                                const allBoxes = await getAllBoxes();
                                boxesToDisplay = allBoxes;
                                setMyBoxes(allBoxes);
                                addLog(`Super Admin: Loaded all ${allBoxes.length} boxes`);
                            } catch (e) {
                                addLog(`Super Admin Load Failed: ${e}`);
                                setMyBoxes(validBoxes);
                            }
                        } else {
                            setMyBoxes(validBoxes);
                        }

                        // Determine current box
                        let boxToSet = null;
                        if (boxesToDisplay.length > 0) {
                            const targetId = stats.currentBoxId;
                            const savedBox = boxesToDisplay.find(b => b.id === targetId);

                            // Logic to determine which box to active
                            boxToSet = savedBox || (isSuperAdmin ? boxesToDisplay[0] : (validBoxes[0] || boxesToDisplay[0]));

                            if (boxToSet && (!currentBox || !boxesToDisplay.find(b => b.id === currentBox.id))) {
                                addLog(`Determined current box: ${boxToSet.name}`);
                                setCurrentBoxState(boxToSet);
                            }
                        } else if (!isSuperAdmin) {
                            addLog("User has no boxes. Clearing currentBox.");
                            setCurrentBoxState(null);
                        }

                        // FINALIZE LOADING: Only when memberships are synced AND currentBox is decided
                        if (!firstSnapshotResolved && mounted) {
                            firstSnapshotResolved = true;
                            clearTimeout(timer);
                            setLoading(false);
                            addLog("Auth sync complete. Loading finished.");
                        }
                    });

                    if (mounted) {
                        setUser(currentUser);
                        setUserStats(stats);
                    }
                } catch (error: any) {
                    addLog(`Firestore Error: ${error.message}`);
                    if (mounted) {
                        setUser(currentUser);
                        setUserStats(null);
                        clearTimeout(timer);
                        setLoading(false);
                    }
                }
            } else {
                if (mounted) {
                    setUser(null);
                    setUserStats(null);
                    setMemberships([]);
                    setCurrentBoxState(null);
                    clearTimeout(timer);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    // Global toggle for dev/superadmin
    useEffect(() => {
        (window as any).toggleDebug = () => setShowDebug(prev => !prev);
    }, []);

    const signInWithGoogle = async (method: 'popup' | 'redirect' = 'popup') => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            if (method === 'redirect') {
                setStatus('REDIRECTING...');
                setLoading(true);
                await signInWithRedirect(auth, provider);
                return;
            }

            const result = await signInWithPopup(auth, provider);
            addLog(`Popup Success: ${result.user.email}`);

            // --- STRICT INVITATION & MEMBERSHIP CHECK ---
            const userDocRef = doc(db, 'users', result.user.uid);
            const userDoc = await getDoc(userDocRef);

            // Import service dynamically
            const { getInvitationByToken, findPendingInvitationByEmail, acceptInvitation } = await import('../services/invitationService');
            const { addUserToBox } = await import('../services/userBoxService');

            // 1. Check for persisted token first (Strongest signal)
            const token = sessionStorage.getItem('pending_invite_token');
            let matchedInvite = null;

            if (token) {
                matchedInvite = await getInvitationByToken(token);
                if (matchedInvite && matchedInvite.email !== result.user.email) {
                    // Email mismatch!
                    addLog(`Invite Email Mismatch: Token=${matchedInvite.email}, Login=${result.user.email}`);
                    await result.user.delete();
                    await signOut(auth);
                    setUser(null);
                    setLoading(false);
                    sessionStorage.removeItem('pending_invite_token'); // Clear invalid token
                    throw new Error(`この招待リンクは ${matchedInvite.email} 専用です。ログインしたアカウント (${result.user.email}) と一致しません。`);
                }
            }

            // 2. If no token or token matched, check by email (Fallback for same-device flow without link click, or lost session)
            if (!matchedInvite && result.user.email) {
                matchedInvite = await findPendingInvitationByEmail(result.user.email);
            }

            // 3. Decision Logic
            if (!userDoc.exists()) {
                // New User: MUST have an invitation
                if (!matchedInvite) {
                    addLog("No invitation found for NEW user. Blocking.");
                    await result.user.delete();
                    await signOut(auth);
                    setUser(null);
                    setLoading(false);
                    throw new Error('INVITATION_REQUIRED');
                }
            }

            // 4. Processing Invitation (for both New and Existing users)
            if (matchedInvite) {
                addLog(`Processing Invite: ${matchedInvite.id} for Box: ${matchedInvite.boxId}`);

                // Add to Box
                // Cast matchedInvite.role to UserRole (assuming service guarantees valid role)
                await addUserToBox(result.user.uid, matchedInvite.boxId, matchedInvite.role as any);

                // Mark as used
                await acceptInvitation(matchedInvite.id);

                // Set default box if not set
                // (This will be handled by regular sync, but good to ensure)

                // Clear token
                sessionStorage.removeItem('pending_invite_token');
                addLog("Invitation Accepted & Membership Granted.");
            }

            // If existing user has no invite, they just log in normally (assuming they already have memberships).
            // Logic continues to onAuthStateChanged...
            // -------------------------------

        } catch (error: any) {
            const authError = error as AuthError;
            console.error("Login Error:", authError);

            if (authError.code === 'auth/requires-recent-login') {
                await signOut(auth);
                alert("セッションの有効期限切れです。もう一度お試しください。");
            } else {
                alert(`Login Failed: ${authError.message}`);
            }
            setLoading(false);
        }
    };

    const loginAnonymously = async () => {
        setLoading(true);
        try {
            await signInAnonymously(auth);
        } catch (error: any) {
            alert(`Guest Login Failed: ${error.message}`);
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserStats(null);
            setMemberships([]);
            setMyBoxes([]);
            setCurrentBoxState(null);
        } catch (error) { console.error(error); }
    };

    return (
        <AuthContext.Provider value={{
            user,
            userStats,
            memberships,
            myBoxes,
            currentBox,
            setCurrentBox,
            loading,
            debugLogs,
            showDebug,
            setShowDebug,
            signInWithGoogle,
            loginAnonymously,
            logout
        }}>
            {/* Persistent Debug Toggle - Subtle */}
            <button
                onClick={() => setShowDebug(prev => !prev)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 10005,
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(0, 255, 255, 0.5)',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    WebkitTapHighlightColor: 'transparent'
                }}
            >
                <Bug size={16} />
            </button>

            {showDebug && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.95)',
                    padding: '15px',
                    fontSize: '11px',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    border: '2px solid #00ffff',
                    color: '#00ffff',
                    zIndex: 10010,
                    pointerEvents: 'auto',
                    fontFamily: 'monospace',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                        <strong style={{ letterSpacing: '2px' }}>SYSTEM DEBUG LOGS</strong>
                        <button onClick={() => setShowDebug(false)} style={{ color: '#fff', background: '#e11d48', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CLOSE</button>
                    </div>
                    {debugLogs.length === 0 && <div>No logs yet...</div>}
                    {debugLogs.map((log, i) => <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #111' }}>{log}</div>)}
                </div>
            )}

            {loading ? (
                <div style={{
                    height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#00ffff',
                    fontFamily: '"Courier New", monospace'
                }} >
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <div style={{ letterSpacing: '2px', fontSize: '0.9rem', fontWeight: 800 }}>{status}</div>
                </div >
            ) : children}
        </AuthContext.Provider >
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
