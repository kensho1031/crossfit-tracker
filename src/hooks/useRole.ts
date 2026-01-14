import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserRole } from '../types/user';

export function useRole() {
    const { user } = useAuth();
    const [role, setRole] = useState<UserRole>('member');
    const [boxId, setBoxId] = useState<string | null>(null);
    const [visitorExpiresAt, setVisitorExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!user) {
                setRole('member');
                setBoxId(null);
                setVisitorExpiresAt(null);
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setRole(userData.role || 'member');
                    setBoxId(userData.boxId || null);
                    setVisitorExpiresAt(userData.visitorExpiresAt || null);
                } else {
                    setRole('member');
                    setBoxId(null);
                    setVisitorExpiresAt(null);
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
                setRole('member');
                setBoxId(null);
                setVisitorExpiresAt(null);
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [user]);

    const isExpired = role === 'visitor' && visitorExpiresAt && new Date(visitorExpiresAt) < new Date();

    return {
        role,
        boxId,
        loading,
        visitorExpiresAt,
        isAdmin: role === 'admin',
        isCoach: role === 'coach' || role === 'admin',
        isMember: role === 'member',
        isVisitor: role === 'visitor',
        isVisitorExpired: isExpired,
        canManageClasses: (role === 'admin' || role === 'coach') && !!boxId && !isExpired,
        canManageUsers: role === 'admin' && !!boxId && !isExpired,
        canAccessBoxData: !!boxId && !isExpired,
    };
}
