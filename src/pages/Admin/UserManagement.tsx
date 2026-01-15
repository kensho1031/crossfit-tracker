import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Search, Users as UsersIcon, Mail, Plus, X, Clock, Check, Copy } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useRole } from '../../hooks/useRole';
import type { UserRole } from '../../types/user';
import type { Invitation } from '../../types/invitation';
import { createInvitation, getBoxInvitations } from '../../services/invitationService';
import { useAuth } from '../../contexts/AuthContext';
import { getUsersByBox, updateUserBoxAndRole } from '../../services/userService';

// Improved UserData interface with flattened role for UI
interface UserData {
    uid: string;
    id: string; // compatibility with getUsersByBox
    email: string;
    displayName: string;
    role: UserRole; // This should be the role IN THIS BOX
    boxId?: string | null;
}

export function UserManagement() {
    const navigate = useNavigate();
    const { canManageUsers, isSuperAdmin, boxId, currentBox, loading: roleLoading } = useRole();
    const { user: currentUser } = useAuth();

    // Data States
    const [users, setUsers] = useState<UserData[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
    const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

    // Invite Modal States
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole | 'visitor'>('member');
    const [visitorDays, setVisitorDays] = useState(3);
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!roleLoading && !canManageUsers) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            // Determine target BoxId (Super Admin might not have one selected in context, but let's use currentBox)
            const targetBoxId = boxId || (currentBox ? currentBox.id : null);

            try {
                // 1. Fetch Users
                if (!targetBoxId && !isSuperAdmin) {
                    setUsers([]);
                    setLoading(false);
                    return;
                }

                let relevantUsers: UserData[] = [];

                if (targetBoxId) {
                    // Fetch using user_boxes service logic via userService wrapper
                    const boxUsers = await getUsersByBox(targetBoxId);
                    // Map to UserData
                    relevantUsers = boxUsers.map(u => ({
                        uid: u.id,
                        id: u.id,
                        email: u.email,
                        displayName: u.displayName,
                        role: u.role || 'member', // Role from user_boxes
                        boxId: targetBoxId
                    }));
                } else if (isSuperAdmin) {
                    // Super Admin Global View (Legacy)
                    const usersCollection = collection(db, 'users');
                    const usersSnapshot = await getDocs(usersCollection);
                    relevantUsers = usersSnapshot.docs.map(doc => ({
                        uid: doc.id,
                        id: doc.id,
                        ...doc.data()
                    } as UserData));
                }

                setUsers(relevantUsers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')));

                // 2. Fetch Invitations
                if (targetBoxId) {
                    const boxInvitations = await getBoxInvitations(targetBoxId);
                    setInvitations(boxInvitations);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!roleLoading) {
            fetchData();
        }
    }, [canManageUsers, roleLoading, boxId, currentBox, isSuperAdmin, navigate]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!inviteEmail || !currentUser) return;
        const targetBoxId = boxId || (currentBox ? currentBox.id : null);

        if (!targetBoxId && !isSuperAdmin) {
            alert('エラー: BOXが選択されていません。');
            return;
        }

        const finalBoxId = targetBoxId || 'global';

        setInviteStatus('sending');
        try {
            await createInvitation(
                inviteEmail,
                finalBoxId,
                inviteRole,
                currentUser.uid,
                inviteRole === 'visitor' ? visitorDays : undefined
            );

            // Refresh invitations
            const updatedInvites = await getBoxInvitations(finalBoxId);
            setInvitations(updatedInvites);

            setInviteStatus('success');
            setTimeout(() => {
                setShowInviteModal(false);
                setInviteStatus('idle');
                setInviteEmail('');
                setInviteRole('member');
            }, 1000);
        } catch (error) {
            console.error('Invite failed:', error);
            setInviteStatus('error');
            alert('招待に失敗しました。メールアドレスが既に招待されている可能性があります。');
        }
    };

    const handleRoleChange = async (uid: string, newRole: UserRole) => {
        if (!window.confirm(`このユーザーの権限を「${newRole}」に変更しますか？`)) {
            return;
        }

        const targetBoxId = boxId || (currentBox ? currentBox.id : null);
        if (!targetBoxId) return;

        setUpdating(uid);
        try {
            // New multi-box update
            await updateUserBoxAndRole(uid, targetBoxId, newRole);

            setUsers(users.map(user =>
                user.uid === uid ? { ...user, role: newRole } : user
            ));

            alert('権限を更新しました');
        } catch (error: any) {
            console.error('Error updating role:', error);
            alert(`権限の更新に失敗しました: ${error.message || '不明なエラー'}`);
        } finally {
            setUpdating(null);
        }
    };

    const handleCopyInviteLink = (invite: Invitation) => {
        // Construct Link
        // Assuming app handles ?inviteToken=... or similar.
        // For now, simpler: Just the token or a dummy URL if routing not ready
        // Let's use origin + /login?invite=TOKEN
        const link = `${window.location.origin}/login?invite=${invite.token}`;

        navigator.clipboard.writeText(link).then(() => {
            setCopiedInviteId(invite.id);
            setTimeout(() => setCopiedInviteId(null), 2000);
        }).catch(err => {
            console.error('Copy failed', err);
            alert('コピーに失敗しました');
        });
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'admin': return '#ff4444';
            case 'coach': return 'var(--color-primary)';
            case 'member': return '#9E9E9E';
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'admin': return '管理者';
            case 'coach': return 'コーチ';
            case 'member': return 'メンバー';
        }
    };

    const filteredUsers = users.filter(user =>
        (user.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (roleLoading || loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '4rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text)',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={28} color="var(--color-primary)" />
                            ユーザー管理
                        </h1>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                            {currentBox ? `${currentBox.name} のメンバー管理` : '全ユーザー管理'}
                        </div>
                    </div>
                </div>

                {/* Tabs & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{
                                background: activeTab === 'users' ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === 'users' ? '#000' : 'var(--color-text-muted)',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            ユーザー
                        </button>
                        <button
                            onClick={() => setActiveTab('invitations')}
                            style={{
                                background: activeTab === 'invitations' ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === 'invitations' ? '#000' : 'var(--color-text-muted)',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            招待中
                            <span style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.8rem'
                            }}>
                                {invitations.length}
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={() => setShowInviteModal(true)}
                        style={{
                            background: 'var(--color-primary)',
                            color: '#000',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Plus size={20} />
                        招待する
                    </button>
                </div>

                {activeTab === 'users' ? (
                    <>
                        {/* Search */}
                        <div style={{
                            background: 'var(--color-surface)',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem'
                        }}>
                            <Search size={18} color="var(--color-text-muted)" />
                            <input
                                type="text"
                                placeholder="名前またはメールで検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--color-text)',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        {/* Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            {['admin', 'coach', 'member'].map(role => {
                                const count = users.filter(u => u.role === role).length;
                                return (
                                    <div key={role} style={{
                                        background: 'var(--color-surface)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getRoleBadgeColor(role as UserRole) }}>
                                            {count}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                                            {getRoleLabel(role as UserRole)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Users List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {filteredUsers.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    <UsersIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <div>ユーザーが見つかりません</div>
                                </div>
                            ) : (
                                filteredUsers.map(user => (
                                    <div key={user.uid} style={{
                                        background: 'var(--color-surface)',
                                        borderRadius: '12px',
                                        padding: '1.2rem',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem' }}>
                                                {user.displayName}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {user.email}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                            {(['member', 'coach', 'admin'] as UserRole[]).map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => handleRoleChange(user.uid, role)}
                                                    disabled={updating === user.uid || user.role === role}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '8px',
                                                        border: user.role === role ? `2px solid ${getRoleBadgeColor(role)}` : '1px solid var(--color-border)',
                                                        background: user.role === role ? getRoleBadgeColor(role) : 'transparent',
                                                        color: user.role === role ? '#000' : 'var(--color-text)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: user.role === role ? 'bold' : 'normal',
                                                        cursor: user.role === role ? 'default' : 'pointer',
                                                        opacity: updating === user.uid ? 0.5 : 1,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {getRoleLabel(role)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    /* Invitations List */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {invitations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                <Mail size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <div>招待中のユーザーはいません</div>
                            </div>
                        ) : (
                            invitations.map(invite => (
                                <div key={invite.id} style={{
                                    background: 'var(--color-surface)',
                                    borderRadius: '12px',
                                    padding: '1.2rem',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem' }}>
                                            {invite.email}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: getRoleBadgeColor(invite.role as UserRole)
                                            }}>
                                                <Shield size={14} />
                                                {getRoleLabel(invite.role as UserRole)}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} />
                                                {new Date(invite.createdAt).toLocaleDateString()}
                                            </span>
                                            {invite.role === 'visitor' && (
                                                <span>({invite.visitorExpiresInDays}日間)</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <button
                                            onClick={() => handleCopyInviteLink(invite)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--color-primary)',
                                                background: 'transparent',
                                                color: 'var(--color-primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                            title="招待リンクをコピー"
                                        >
                                            {copiedInviteId === invite.id ? <Check size={16} /> : <Copy size={16} />}
                                            {copiedInviteId === invite.id ? 'Copied' : 'Link'}
                                        </button>
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            background: invite.status === 'pending' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                            color: invite.status === 'pending' ? '#FFC107' : '#4CAF50'
                                        }}>
                                            {invite.status === 'pending' ? '招待中' : '登録完了'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        border: '1px solid var(--color-primary)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>ユーザーを招待</h3>
                            <button onClick={() => setShowInviteModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleInvite}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>メールアドレス</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)',
                                        color: '#fff'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>権限ロール</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {['member', 'coach', 'admin', 'visitor'].map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setInviteRole(role as any)}
                                            style={{
                                                flex: 1,
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                border: inviteRole === role ? `2px solid ${getRoleBadgeColor(role as UserRole)}` : '1px solid var(--color-border)',
                                                background: inviteRole === role ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                color: inviteRole === role ? getRoleBadgeColor(role as UserRole) : 'var(--color-text-muted)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {role === 'visitor' ? 'ビジター' : getRoleLabel(role as UserRole)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {inviteRole === 'visitor' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>有効期限（日数）</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={visitorDays}
                                        onChange={e => setVisitorDays(parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg)',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={inviteStatus === 'sending'}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: inviteStatus === 'success' ? '#4CAF50' : 'var(--color-primary)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    opacity: inviteStatus === 'sending' ? 0.7 : 1
                                }}
                            >
                                {inviteStatus === 'sending' ? '送信中...' : inviteStatus === 'success' ? '送信完了！' : '招待メールを送信'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
