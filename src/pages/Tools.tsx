import { RandomWODGenerator } from '../components/tools/RandomWODGenerator';
import { OneRepMaxCalculator } from '../components/tools/OneRepMaxCalculator';
import { WeightConverter } from '../components/tools/WeightConverter';
import { Dumbbell, Users, Settings, Building2 } from 'lucide-react';
import { useRole } from '../hooks/useRole';

export function Tools() {
    const { canManageClasses, canManageUsers, canManageBoxes } = useRole();


    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{
                textAlign: 'center',
                marginBottom: '2.5rem',
                fontFamily: 'var(--font-heading)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '2rem'
            }}>
                <Dumbbell size={32} color="var(--color-primary)" />
                TOOLS
            </h2>

            <div style={{ display: 'grid', gap: '2.5rem' }}>
                {/* Admin/Coach Tools */}
                {(canManageClasses || canManageUsers) && (
                    <section style={{
                        border: '2px solid var(--color-primary)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 215, 0, 0.05)'
                    }}>
                        <h3 style={{
                            margin: '0 0 1rem 0',
                            fontSize: '1rem',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Settings size={18} />
                            管理機能
                        </h3>
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {canManageClasses && (
                                <div
                                    onClick={() => window.location.href = '/admin/class'}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '1rem',
                                        background: 'var(--color-surface)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                >
                                    <Dumbbell size={20} color="var(--color-primary)" />
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>クラス管理</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>WODの作成・編集</div>
                                    </div>
                                </div>
                            )}
                            {canManageUsers && (
                                <div
                                    onClick={() => window.location.href = '/admin/users'}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '1rem',
                                        background: 'var(--color-surface)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                >
                                    <Users size={20} color="var(--color-primary)" />
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>ユーザー管理</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>権限の変更</div>
                                    </div>
                                </div>
                            )}
                            {canManageBoxes && (
                                <div
                                    onClick={() => window.location.href = '/admin/boxes'}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '1rem',
                                        background: 'var(--color-surface)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                >
                                    <Building2 size={20} color="var(--color-primary)" />
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>BOX 管理</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>BOX の作成・削除</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}


                {/* 1. Weight Converter */}
                <section>
                    <WeightConverter />
                </section>

                {/* 2. 1RM Calculator */}
                <section>
                    <OneRepMaxCalculator />
                </section>

                {/* 3. WOD Generator */}
                <section>
                    <RandomWODGenerator />
                </section>
            </div>
        </div>
    );
}
