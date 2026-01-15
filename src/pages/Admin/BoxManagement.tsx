import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Building2, Users } from 'lucide-react';
import { getAllBoxes, createBox, deleteBox } from '../../services/boxService';
import { useRole } from '../../hooks/useRole';
import type { Box } from '../../types/box';

export function BoxManagement() {
    const navigate = useNavigate();
    const { canManageBoxes, loading: roleLoading } = useRole();
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form state
    const [newBoxName, setNewBoxName] = useState('');
    const [newBoxAddress, setNewBoxAddress] = useState('');
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!roleLoading && !canManageBoxes) {
            navigate('/');
            return;
        }
        if (!roleLoading && canManageBoxes) {
            loadBoxes();
        }
    }, [roleLoading, canManageBoxes, navigate]);

    const loadBoxes = async () => {
        setLoading(true);
        try {
            const data = await getAllBoxes();
            setBoxes(data);
        } catch (error) {
            console.error('Failed to load boxes:', error);
            setMessage('BOX の読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBox = async () => {
        if (!newBoxName.trim()) {
            setMessage('BOX 名を入力してください');
            return;
        }

        setCreating(true);
        setMessage('');
        try {
            // Use current user's UID as owner
            await createBox(newBoxName, 'sljuwV64DYb9AnZJ8WxBmKRblYz1', newBoxAddress);
            setMessage('✓ BOX を作成しました！');
            setNewBoxName('');
            setNewBoxAddress('');
            setShowCreateForm(false);
            await loadBoxes();
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Failed to create box:', error);
            setMessage(`作成失敗: ${error.message || '不明なエラー'}`);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteBox = async (boxId: string, boxName: string) => {
        if (!window.confirm(`BOX "${boxName}" を削除しますか？\n\n⚠️ この BOX に紐付いたクラスやユーザーデータも削除される可能性があります。`)) {
            return;
        }

        try {
            await deleteBox(boxId);
            setMessage('✓ BOX を削除しました');
            await loadBoxes();
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Failed to delete box:', error);
            setMessage(`削除失敗: ${error.message || '不明なエラー'}`);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', padding: '4px', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={28} color="var(--color-primary)" />
                    BOX Management
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

            {/* Create Button */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
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
                    <Plus size={20} />
                    {showCreateForm ? 'キャンセル' : '新しい BOX を作成'}
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '2px solid var(--color-primary)',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>新しい BOX を作成</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                BOX 名 <span style={{ color: '#ff5252' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={newBoxName}
                                onChange={(e) => setNewBoxName(e.target.value)}
                                placeholder="例: CrossFit Tokyo"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    color: 'var(--color-text)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                住所（オプション）
                            </label>
                            <input
                                type="text"
                                value={newBoxAddress}
                                onChange={(e) => setNewBoxAddress(e.target.value)}
                                placeholder="例: 東京都渋谷区..."
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    color: 'var(--color-text)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleCreateBox}
                            disabled={creating}
                            style={{
                                padding: '1rem',
                                background: 'var(--color-neon)',
                                color: 'var(--color-bg)',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: creating ? 'not-allowed' : 'pointer',
                                opacity: creating ? 0.6 : 1
                            }}
                        >
                            {creating ? '作成中...' : '作成'}
                        </button>
                    </div>
                </div>
            )}

            {/* Boxes List */}
            <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                    登録済み BOX ({boxes.length})
                </h2>
                {boxes.length === 0 ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        background: 'var(--color-surface)',
                        borderRadius: '12px',
                        border: '1px dashed var(--color-border)'
                    }}>
                        <Building2 size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>BOX がまだ登録されていません</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {boxes.map((box) => (
                            <div
                                key={box.id}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--color-surface)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--color-text)' }}>
                                        {box.name}
                                    </h3>
                                    {box.address && (
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            📍 {box.address}
                                        </p>
                                    )}
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        ID: {box.id}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => navigate(`/admin/boxes/${box.id}/members`)}
                                        style={{
                                            padding: '0.8rem 1rem',
                                            background: 'var(--color-primary)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'var(--color-bg)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <Users size={18} />
                                        メンバー管理
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBox(box.id, box.name)}
                                        style={{
                                            padding: '0.8rem',
                                            background: 'transparent',
                                            border: '1px solid #ff5252',
                                            borderRadius: '8px',
                                            color: '#ff5252',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                        削除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
