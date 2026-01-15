import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Users, Search } from 'lucide-react';
import { getUsersByBox, searchUsers, updateUserBoxAndRole, removeUserFromBox } from '../../services/userService';
import { getAllBoxes } from '../../services/boxService';
import { useRole } from '../../hooks/useRole';
import type { Box } from '../../types/box';

export function BoxMemberManagement() {
    const navigate = useNavigate();
    const { boxId } = useParams<{ boxId: string }>();
    const { isSuperAdmin, loading: roleLoading } = useRole();

    const [box, setBox] = useState<Box | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Add member form
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'coach' | 'member'>('member');

    useEffect(() => {
        if (!roleLoading && !isSuperAdmin) {
            navigate('/');
            return;
        }
        if (!roleLoading && isSuperAdmin && boxId) {
            loadBoxAndMembers();
        }
    }, [roleLoading, isSuperAdmin, boxId, navigate]);

    const loadBoxAndMembers = async () => {
        if (!boxId) return;

        setLoading(true);
        try {
            // Load box info
            const boxes = await getAllBoxes();
            const currentBox = boxes.find(b => b.id === boxId);
            setBox(currentBox || null);

            // Load members
            const boxMembers = await getUsersByBox(boxId);
            setMembers(boxMembers);
        } catch (error) {
            console.error('Failed to load box/members:', error);
            setMessage('データの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setMessage('メールアドレスを入力してください');
            return;
        }

        setSearching(true);
        try {
            const results = await searchUsers(searchTerm);
            // Filter out users already in this box
            const filtered = results.filter(u => u.boxId !== boxId);
            setSearchResults(filtered);
            if (filtered.length === 0) {
                setMessage('ユーザーが見つかりませんでした');
            }
        } catch (error) {
            console.error('Search failed:', error);
            setMessage('検索に失敗しました');
        } finally {
            setSearching(false);
        }
    };

    const handleAddMember = async (userId: string) => {
        if (!boxId) return;

        try {
            await updateUserBoxAndRole(userId, boxId, selectedRole);
            setMessage(`✓ メンバーを追加しました（${selectedRole}）`);
            setSearchTerm('');
            setSearchResults([]);
            setShowAddForm(false);
            await loadBoxAndMembers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Failed to add member:', error);
            setMessage(`追加失敗: ${error.message || '不明なエラー'}`);
        }
    };

    const handleRemoveMember = async (userId: string, userName: string) => {
        if (!window.confirm(`${userName} を BOX から削除しますか？`)) {
            return;
        }

        try {
            await removeUserFromBox(userId);
            setMessage('✓ メンバーを削除しました');
            await loadBoxAndMembers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Failed to remove member:', error);
            setMessage(`削除失敗: ${error.message || '不明なエラー'}`);
        }
    };

    const handleChangeRole = async (userId: string, newRole: 'admin' | 'coach' | 'member') => {
        if (!boxId) return;

        try {
            await updateUserBoxAndRole(userId, boxId, newRole);
            setMessage(`✓ 権限を変更しました（${newRole}）`);
            await loadBoxAndMembers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Failed to change role:', error);
            setMessage(`変更失敗: ${error.message || '不明なエラー'}`);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
            </div>
        );
    }

    if (!box) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: '#ff5252' }}>BOX が見つかりません</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/boxes')} style={{ background: 'none', border: 'none', color: 'var(--color-text)', padding: '4px', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={28} color="var(--color-primary)" />
                    {box.name} - メンバー管理
                </h1>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderRadius: '8px',
                    background: message.includes('失敗') ? 'rgba(255,82,82,0.1)' : 'rgba(0,255,0,0.1)',
                    border: `1px solid ${message.includes('失敗') ? '#ff5252' : 'var(--color-neon)'}`,
                    color: message.includes('失敗') ? '#ff5252' : 'var(--color-neon)',
                    fontWeight: 'bold'
                }}>
                    {message}
                </div>
            )}

            {/* Add Member Button */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '1rem 1.5rem',
                        background: 'var(--color-primary)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-glow)'
                    }}
                >
                    <UserPlus size={20} />
                    {showAddForm ? 'キャンセル' : 'メンバーを追加'}
                </button>
            </div>

            {/* Add Member Form */}
            {showAddForm && (
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '2px solid var(--color-primary)',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>メンバーを検索して追加</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="メールアドレスで検索"
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg)',
                                color: 'var(--color-text)',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'var(--color-neon)',
                                color: 'var(--color-bg)',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: searching ? 'not-allowed' : 'pointer',
                                opacity: searching ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Search size={18} />
                            {searching ? '検索中...' : '検索'}
                        </button>
                    </div>

                    {/* Role Selection */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            役割を選択
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as any)}
                            style={{
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg)',
                                color: 'var(--color-text)',
                                fontSize: '1rem',
                                width: '100%'
                            }}
                        >
                            <option value="member">Member（一般メンバー）</option>
                            <option value="coach">Coach（コーチ）</option>
                            <option value="admin">Admin（管理者）</option>
                        </select>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                検索結果 ({searchResults.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {searchResults.map(user => (
                                    <div
                                        key={user.id}
                                        style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{user.displayName || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                                        </div>
                                        <button
                                            onClick={() => handleAddMember(user.id)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'var(--color-primary)',
                                                color: 'var(--color-bg)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            追加
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Members List */}
            <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                    メンバー一覧 ({members.length})
                </h2>
                {members.length === 0 ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        background: 'var(--color-surface)',
                        borderRadius: '12px',
                        border: '1px dashed var(--color-border)'
                    }}>
                        <Users size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>メンバーがまだ登録されていません</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {members.map((member) => (
                            <div
                                key={member.id}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--color-surface)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem' }}>{member.displayName || 'Unknown'}</h3>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{member.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(member.id, member.displayName)}
                                        style={{
                                            padding: '0.5rem',
                                            background: 'transparent',
                                            border: '1px solid #ff5252',
                                            borderRadius: '6px',
                                            color: '#ff5252',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        削除
                                    </button>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                                        役割
                                    </label>
                                    <select
                                        value={member.role || 'member'}
                                        onChange={(e) => handleChangeRole(member.id, e.target.value as any)}
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg)',
                                            color: 'var(--color-text)',
                                            fontSize: '0.9rem',
                                            width: '200px'
                                        }}
                                    >
                                        <option value="member">Member</option>
                                        <option value="coach">Coach</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
